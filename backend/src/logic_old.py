import re
import os
from typing import Optional, List, Dict
import time
import random
import json
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain.output_parsers import OutputFixingParser
from langchain_google_genai import ChatGoogleGenerativeAI
from rich import print
from rich.panel import Panel
from tavily import TavilyClient
from firebase_admin import firestore
from functools import wraps
from google.api_core.exceptions import ResourceExhausted
from google.cloud import storage
from langchain_core.runnables import RunnableConfig
from thefuzz import fuzz


from src import db_manager
from src import cost_tracking
from src.config import app_config


try:
    word_tokenize("test")
except LookupError:
    import nltk

    print("[yellow]NLTK 'punkt' data not found. Downloading...[/yellow]")
    nltk.download("punkt")


def _get_normalized_cache_key(entity_name: str) -> str:
    """
    Creates a standardized, robust cache key from an entity name.
    Example: "Large Companies" -> "larg-compani"
    """
    if not entity_name:
        return None
    stemmer = PorterStemmer()
    # 1. Tokenize: Split the name into words -> ['Large', 'Companies']
    tokens = word_tokenize(entity_name.lower())
    # 2. Stem: Reduce each word to its root -> ['larg', 'compani']
    stemmed_tokens = [stemmer.stem(token) for token in tokens]
    # 3. Join: Create a stable key -> "larg-compani"
    return "-".join(stemmed_tokens)


def retry_with_exponential_backoff(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        max_retries = 5
        delay = 2
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except (ResourceExhausted, json.JSONDecodeError) as e:
                error_type = (
                    "Rate limit hit"
                    if isinstance(e, ResourceExhausted)
                    else "JSON parsing error"
                )
                wait_time = delay + random.uniform(0, 1)
                print(
                    f"[yellow]{error_type}. Retrying in {wait_time:.2f} seconds... (Attempt {attempt + 1}/{max_retries})[/yellow]"
                )
                time.sleep(wait_time)
                delay *= 2
            except Exception as e:
                print(
                    f"[bold red]An unexpected error occurred in '{func.__name__}': {e}. Skipping retries for this call.[/bold red]"
                )
                break
        print(
            f"[bold red]Max retries reached or fatal error occurred for '{func.__name__}'. Returning a default empty dict.[/bold red]"
        )
        if (
            "verify_claim" in func.__name__
            or "generate_contextual_briefing" in func.__name__
        ):
            return {"summary": "Failed after multiple retries.", "perspectives": []}
        else:
            return {}

    return wrapper


def get_timestamp_from_line(line: str) -> Optional[str]:
    """
    Extracts the first timestamp (like 0:00 or 12:34:56) from a line.
    Returns the timestamp string or None if not found.
    """
    # This regex handles formats like M:SS, MM:SS, H:MM:SS at the start of a line
    match = re.search(r"^\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*", line)
    return match.group(1) if match else None


async def find_semantic_topic_boundaries_with_ai(
    canonical_transcript: List[Dict],
    runnable_config: RunnableConfig,
    user_id: str,
    job_id: str,
) -> List[int]:
    """
    Uses an AI model to detect topic shifts and returns the INDICES of the utterances that start new topics.
    """
    print("\n[cyan]Finding semantic topic boundaries using AI analysis...[/cyan]")
    db_manager.log_progress(
        user_id, job_id, "Finding semantic topic boundaries using AI analysis..."
    )

    # Create a numbered, simplified version of the transcript for the LLM
    numbered_transcript = ""
    for i, utterance in enumerate(canonical_transcript):
        numbered_transcript += f"INDEX {i}: {utterance['text']}\n\n"

    if not numbered_transcript:
        return []

    llm = ChatGoogleGenerativeAI(
        model=app_config.LLM_MODELS["best-lite"], temperature=0
    )
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert podcast editor. Your task is to segment a transcript into thematically cohesive chapters. "
                "The transcript has been provided with an INDEX for each utterance. "
                "Your output must be a JSON object with a single key: 'boundary_indices', which is a list of integers. "
                "Each integer must be the INDEX of an utterance that marks the beginning of a major new topic or chapter.\n\n"
                "# Example Response Format:\n"
                # '{"boundary_indices": [0, 15, 42]}'
                "{format_instructions}",
            ),
            (
                "human",
                "Segment the following transcript by identifying the indices where new topics begin:\n--- TRANSCRIPT ---\n{numbered_transcript}\n--- END TRANSCRIPT ---",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke(
            {
                "numbered_transcript": numbered_transcript,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        indices = result.get("boundary_indices", [])
        # Validate that the output is a list of integers
        validated_indices = [i for i in indices if isinstance(i, int)]
        print(
            f"  - AI suggested {len(validated_indices)} topic boundaries at indices: {validated_indices}"
        )
        return validated_indices
    except Exception as e:
        print(f"[red]Error finding boundaries: {e}[/red]")
        return []


def clean_line_for_analysis(line: str) -> str:
    return re.sub(r"\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*", " ", line).strip()


async def chunk_plain_text_with_ai(
    full_text: str, runnable_config: RunnableConfig
) -> List[Dict]:
    """
    Takes a large block of plain text and uses an LLM to split it into thematically coherent chunks.
    Returns a list of new "virtual" utterance objects.
    """
    print("[cyan]Input is plain text. Using AI to create thematic chunks...[/cyan]")

    llm = ChatGoogleGenerativeAI(
        model=app_config.LLM_MODELS["best-lite"], temperature=0.1
    )
    # The output should be a list of strings, where each string is a chunk
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a document structuring expert. Your task is to split the following article into thematically cohesive text chunks. Each chunk should be a self-contained topic or argument. Your output must be a JSON object with a single key: 'text_chunks', which is a list of strings. Each string in the list is a complete text chunk. Aim for chunks of a few hundred words each.\n"
                "{format_instructions}",
            ),
            (
                "human",
                "Please split the following document into thematic text chunks:\n--- DOCUMENT ---\n{full_text}\n--- END DOCUMENT ---",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke(
            {
                "full_text": full_text,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        text_chunks = result.get("text_chunks", [])

        # Convert the list of text strings into our canonical utterance format
        chunked_utterances = []
        for chunk in text_chunks:
            chunked_utterances.append(
                {"speaker_id": "Narrator", "timestamp_seconds": -1, "text": chunk}
            )

        print(
            f"  - Successfully split plain text into {len(chunked_utterances)} chunks."
        )
        return chunked_utterances

    except Exception as e:
        print(f"[red]Error during plain text chunking: {e}[/red]")
        # Fallback: return the original text as a single chunk
        return [{"speaker_id": "Narrator", "timestamp_seconds": -1, "text": full_text}]


def create_sections_from_boundaries(
    full_transcript: str, perfect_boundaries: List[str]
) -> List[Dict]:
    """
    Splits a transcript into sections based on a list of 'perfect' boundary lines.
    This version is robust against whitespace issues and prevents empty "ghost" sections.
    """
    if not full_transcript:
        return []

    # If no valid boundaries were found, return the whole transcript as one section.
    if not perfect_boundaries:
        content = full_transcript.strip()
        if not content:
            return []
        lines = content.splitlines()
        start_time = next(
            (ts for l in lines if (ts := get_timestamp_from_line(l))), "N/A"
        )
        end_time = next(
            (ts for l in reversed(lines) if (ts := get_timestamp_from_line(l))),
            start_time,
        )
        return [{"content": content, "start_time": start_time, "end_time": end_time}]

    # Create a set of STRIPPED boundary lines for robust, whitespace-agnostic matching.
    boundary_set = {b.strip() for b in perfect_boundaries}
    final_sections = []
    current_lines = []

    for line in full_transcript.splitlines():
        # Compare the stripped line to the stripped boundaries for a reliable match.
        if line.strip() in boundary_set and current_lines:
            section_content = "\n".join(current_lines).strip()
            if section_content:
                start = next(
                    (ts for l in current_lines if (ts := get_timestamp_from_line(l))),
                    "N/A",
                )
                # A section is only valid if it has a timestamp.
                if start != "N/A":
                    end = next(
                        (
                            ts
                            for l in reversed(current_lines)
                            if (ts := get_timestamp_from_line(l))
                        ),
                        start,
                    )
                    final_sections.append(
                        {
                            "content": section_content,
                            "start_time": start,
                            "end_time": end,
                        }
                    )

            current_lines = [line]
        else:
            current_lines.append(line)

    # Add the final section, with the same robust checks.
    if current_lines:
        section_content = "\n".join(current_lines).strip()
        if section_content:
            start = next(
                (ts for l in current_lines if (ts := get_timestamp_from_line(l))), "N/A"
            )
            # The final, most important guard: only append if it's a real section.
            if start != "N/A":
                end = next(
                    (
                        ts
                        for l in reversed(current_lines)
                        if (ts := get_timestamp_from_line(l))
                    ),
                    start,
                )
                final_sections.append(
                    {"content": section_content, "start_time": start, "end_time": end}
                )

    return final_sections


def parse_and_normalize_time(time_str: str) -> Optional[int]:
    """
    Parses various timestamp formats (e.g., HH:MM:SS, MM:SS, [M:SS - M:SS])
    and returns the total seconds of the START time.
    This version is robust and will not crash on non-timestamp strings.
    Returns None if the format is not recognized or cannot be parsed.
    """
    if not isinstance(time_str, str):
        return None

    try:
        # Remove brackets or parentheses for cleaner parsing
        cleaned_str = time_str.strip().strip("[]()")

        # --- NEW LOGIC TO HANDLE TIME RANGES ---
        # If the timestamp is a range (e.g., "0:00 - 0:03"), we only use the start time.
        if "-" in cleaned_str:
            # Take the part before the hyphen
            cleaned_str = cleaned_str.split("-")[0].strip()
        # --- END NEW LOGIC ---

        # Split the string by colons
        parts = cleaned_str.split(":")

        # Ensure all parts are digits before converting
        if not all(part.isdigit() for part in parts if part):
            return None

        # Convert parts to integers
        int_parts = list(map(int, parts))

        if len(int_parts) == 3:  # HH:MM:SS
            return int_parts[0] * 3600 + int_parts[1] * 60 + int_parts[2]
        if len(int_parts) == 2:  # MM:SS
            return int_parts[0] * 60 + int_parts[1]
        if len(int_parts) == 1:  # SS
            return int_parts[0]

        # If it's not a recognized format, return None
        return None

    except (ValueError, AttributeError):
        # If any conversion fails (e.g., trying to int('text')), gracefully return None
        return None


async def preprocess_and_normalize_transcript(raw_text: str) -> List[Dict]:
    """
    Takes raw, messy transcript text and converts it into a clean, canonical list of utterance objects.
    This version is robust and uses regex to handle multiple formats, including [TIME] Speaker: Text.
    """
    print("[cyan]Step 2a: Starting Robust Preprocessing and Normalization...[/cyan]")
    lines = raw_text.strip().splitlines()

    # This regex is designed to capture three groups from the start of a line:
    # Group 1: The timestamp (in various formats)
    # Group 2 (Optional): The speaker name (ending in a colon)
    # Group 3: The actual text of the utterance
    line_parser_re = re.compile(
        r"^\s*(\[[\d:.]+\s*-\s*[\d:.]+\]|\[[\d:.]+\]|\([\d:.]+\)|[\d:.]+)\s*(?:([a-zA-Z\s\d'._-]+):)?\s*(.*)"
    )

    canonical_transcript = []
    current_utterance = None

    for line in lines:
        if not line.strip():
            continue

        match = line_parser_re.match(line)

        if match:
            # If the regex matches, it's the start of a new utterance.
            # First, save any pending text from the previous utterance.
            if current_utterance:
                canonical_transcript.append(current_utterance)

            timestamp_str, speaker_str, text_str = match.groups()

            timestamp_seconds = parse_and_normalize_time(timestamp_str)

            ts = timestamp_seconds if timestamp_seconds is not None else -1
            current_utterance = {
                "speaker_id": (speaker_str.strip() if speaker_str else "Speaker 1"),
                "start_seconds": ts,
                "end_seconds": ts,
                "text": text_str.strip(),
            }
        else:
            # If no match, this line is a continuation of the previous utterance's text.
            if current_utterance:
                current_utterance["text"] += " " + line.strip()
            # If there's no current utterance, this might be header text, which we can ignore for now.

    # Add the very last utterance to the list after the loop finishes
    if current_utterance:
        canonical_transcript.append(current_utterance)

    # Fallback for if the regex found absolutely nothing (true plain text)
    if not canonical_transcript and raw_text:
        print(
            "[yellow]No structured format detected. Treating input as a single block of plain text.[/yellow]"
        )
        canonical_transcript.append(
            {
                "speaker_id": "Narrator",
                "start_seconds": -1,
                "end_seconds": -1,
                "text": raw_text.replace("\n", " ").strip(),
            }
        )

    print(
        f"[green]✓ Preprocessing complete. Created {len(canonical_transcript)} canonical utterance(s).[/green]"
    )
    return canonical_transcript


def create_sections_from_canonical(
    canonical_transcript: List[Dict], boundary_indices: List[int]
) -> List[List[Dict]]:
    """
    Splits a canonical transcript (a list of utterance dicts) into sections (a list of lists of utterance dicts)
    based on the integer indices of boundary utterances.
    """
    if not boundary_indices:
        return [canonical_transcript]  # Return the whole thing as one section

    sections = []
    last_index = 0
    # Ensure indices are sorted and unique
    for boundary_index in sorted(list(set(boundary_indices))):
        if boundary_index > last_index:
            sections.append(canonical_transcript[last_index:boundary_index])
        last_index = boundary_index

    # Add the final section from the last boundary to the end
    if last_index < len(canonical_transcript):
        sections.append(canonical_transcript[last_index:])

    return sections


def merge_short_canonical_sections(
    sections: List[List[Dict]], min_duration_seconds: int = 180
) -> List[List[Dict]]:
    """
    Merges short canonical sections using a HYBRID strategy for best thematic cohesion.
    Operates on the new canonical format (a list of lists of utterance dicts).
    """
    if len(sections) <= 1:
        return sections

    print(
        f"\n[cyan]Running HYBRID canonical section merge...[/cyan] (Initial sections: {len(sections)}, Min duration: {min_duration_seconds}s)"
    )

    def get_section_duration(section: List[Dict]) -> int:
        """Helper to calculate the duration of a canonical section."""
        if not section:
            return 0

            # --- NEW DURATION LOGIC ---
        start_time = section[0].get("start_seconds", -1)
        # For the section's end, we use the END of the last utterance.
        end_time = section[-1].get("end_seconds", -1)

        if start_time < 0 or end_time < 0:
            # If a section has no valid timestamps, give it a default high duration
            # so it's never considered "short" and merged.
            return min_duration_seconds + 1

        return abs(end_time - start_time)

    processed_sections = []
    temp_buffer = None

    # --- PHASE 1: FORWARD-MERGING PASS ---
    for i, current_section in enumerate(sections):
        if temp_buffer:
            # Merge the buffered section with the current one by extending the list
            print(
                f"  - [blue]Merging buffered section into current section #{i + 1}...[/blue]"
            )
            current_section = temp_buffer + current_section
            temp_buffer = None

        duration = get_section_duration(current_section)

        if duration < min_duration_seconds and i < len(sections) - 1:
            print(
                f"  - [cyan]Buffering short section #{i + 1} (duration: {duration}s) to merge forward.[/cyan]"
            )
            temp_buffer = current_section
        else:
            print(
                f"  - [green]Keeping section #{i + 1} (duration: {duration}s).[/green]"
            )
            processed_sections.append(current_section)

    if temp_buffer:
        processed_sections.append(temp_buffer)

    # --- PHASE 2: FINAL BACKWARD-MERGE CLEANUP ---
    if len(processed_sections) > 1:
        last_section = processed_sections[-1]
        duration = get_section_duration(last_section)

        if duration < min_duration_seconds:
            print(
                f"  - [yellow]Final Cleanup: Last section is too short ({duration}s). Merging backward.[/yellow]"
            )
            short_last_section = processed_sections.pop()
            # Merge by extending the list of utterances
            processed_sections[-1].extend(short_last_section)

    print(
        f"[cyan]Hybrid merge complete.[/cyan] (Final sections: {len(processed_sections)})"
    )
    return processed_sections


def _format_ms_to_timestamp(ms: int) -> str:
    """Helper to convert milliseconds to MM:SS format."""
    seconds = ms // 1000
    return f"{seconds // 60:02d}:{seconds % 60:02d}"


def create_sections_from_audio_transcript(
    structured_transcript: List[Dict], perfect_boundaries: List[str]
) -> List[Dict]:
    """
    Creates sections from a structured audio transcript (list of utterance dicts)
    using a list of verbatim boundary lines.
    """
    if not structured_transcript or not perfect_boundaries:
        return []

    # Create a fast lookup set for the exact boundary text.
    # The boundaries from the verifier are full sentences/paragraphs.
    boundary_set = set(perfect_boundaries)
    final_sections = []
    current_section_utterances = []

    for utterance in structured_transcript:
        # The 'line' we check against is the full speaker-prefixed text.
        utterance_line = f"Speaker {utterance['speaker']}: {utterance['text']}"

        # We check if the verbatim boundary line IS the current utterance line.
        # This is simpler and more exact than the text-file method.
        if utterance_line in boundary_set and current_section_utterances:
            # Finalize the previous section
            content = "\n".join(
                [
                    f"Speaker {u['speaker']}: {u['text']}"
                    for u in current_section_utterances
                ]
            )
            start_time = _format_ms_to_timestamp(current_section_utterances[0]["start"])
            end_time = _format_ms_to_timestamp(current_section_utterances[-1]["end"])

            final_sections.append(
                {"content": content, "start_time": start_time, "end_time": end_time}
            )

            # Start the new section
            current_section_utterances = [utterance]
        else:
            current_section_utterances.append(utterance)

    # Add the final section after the loop
    if current_section_utterances:
        content = "\n".join(
            [f"Speaker {u['speaker']}: {u['text']}" for u in current_section_utterances]
        )
        start_time = _format_ms_to_timestamp(current_section_utterances[0]["start"])
        end_time = _format_ms_to_timestamp(current_section_utterances[-1]["end"])

        final_sections.append(
            {"content": content, "start_time": start_time, "end_time": end_time}
        )

    return final_sections


async def analyze_content(
    section_content: str, runnable_config: RunnableConfig
) -> Dict:
    """
    Performs the broad, Phase 1 analysis on a section of text.
    It extracts titles, summaries, quotes, and POTENTIAL entities/claims.
    """
    print("      - [yellow]Phase 1: Performing broad analysis...[/yellow]")
    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["best"], temperature=0.2)
    parser = JsonOutputParser()
    fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)

    # prompt = ChatPromptTemplate.from_messages(
    #     [
    #         (
    #             "system",
    #             "You are a master analyst. Your output must be a JSON object. For the provided text, extract the following:\n"
    #             "- 'generated_title': A concise, engaging, human-readable title (3-6 words).\n"
    #             "- '1_sentence_summary': A single sentence that captures the absolute core message.\n"
    #             "- 'summary_points': A list of 3-5 bullet points summarizing the key arguments.\n"
    #             "- 'notable_quotes': A list of 1-4 impactful, memorable sentences quoted directly from the text.\n"
    #             "- 'actionable_advice': A list of clear, actionable steps a listener could apply.\n"
    #             "- 'questions_and_answers': A list of objects, where each object has 'question' and 'answer' keys.\n"
    #             "- 'potential_entities': A list of EVERY person, organization, place, or specific concept mentioned.\n"
    #             "- 'potential_verifiable_claims': A list of EVERY statement that presents itself as an objective, verifiable fact. Do not include opinions or advice.\n"
    #             "- 'topics_and_keywords': A list of the most important keywords.\n"
    #             "{format_instructions}",
    #         ),
    #         ("human", "--- TEXT TO ANALYZE ---\n{content}\n--- END TEXT ---"),
    #     ]
    # )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a Senior Consultant at a top-tier firm like McKinsey, Bain, or BCG."
                "Your task is to analyze a client interview transcript to extract the core insights for a slide deck presentation to the client's CEO."
                "Focus on identifying business-critical pain points, strategic opportunities, and quantifiable outcomes. Your tone should be professional, concise, and direct. Your output must be a structured JSON object. For the provided text, extract the following:\n"
                "- 'generated_title': A concise, engaging, human-readable title (3-6 words).\n"
                "- '1_sentence_summary': A single sentence that captures the absolute core message.\n"
                "- 'summary_points': A list of 3-5 bullet points summarizing the key arguments.\n"
                "- 'notable_quotes': A list of 1-4 impactful, memorable sentences quoted directly from the text.\n"
                "- 'actionable_advice': A list of clear, actionable steps a listener could apply.\n"
                "- 'questions_and_answers': A list of objects, where each object has 'question' and 'answer' keys.\n"
                "- 'potential_entities': A list of EVERY person, organization, place, or specific concept mentioned.\n"
                "- 'potential_verifiable_claims': A list of EVERY statement that presents itself as an objective, verifiable fact. Do not include opinions or advice.\n"
                "- 'topics_and_keywords': A list of the most important keywords.\n"
                "{format_instructions}",
            ),
            ("human", "--- TEXT TO ANALYZE ---\n{content}\n--- END TEXT ---"),
        ]
    )

    chain = prompt | llm | fixing_parser
    return await chain.ainvoke(
        {
            "content": section_content,
            "format_instructions": parser.get_format_instructions(),
        },
        config=runnable_config,
    )


async def filter_entities(
    potential_entities: List[str],
    section_content: str,
    runnable_config: RunnableConfig,
    section_index: int,
) -> List[str]:
    """
    Phase 2: Filters a list of potential entities down to the most important ones.
    Enhanced with indexed logging.
    """
    if not potential_entities:
        return []

    log_prefix = f"   - [Section {section_index + 1}]"
    print(
        f"{log_prefix} [yellow]Phase 2: Filtering {len(potential_entities)} potential entities...[/yellow]"
    )

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["main"], temperature=0.1)
    parser = JsonOutputParser()
    fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a content strategist. From the 'LIST OF POTENTIAL ENTITIES', select the top 3 to 5 most important and relevant entities that a listener would want explained, based on the provided 'TRANSCRIPT SECTION'.\n"
                "CRITICAL: Your output must be a single, valid JSON object. All keys and string values MUST be enclosed in double quotes.\n{format_instructions}",
            ),
            (
                "human",
                "TRANSCRIPT SECTION (for context):\n{content}\n\nLIST OF POTENTIAL ENTITIES:\n{entity_list}",
            ),
        ]
    )
    chain = prompt | llm | fixing_parser

    try:
        result = await chain.ainvoke(
            {
                "content": section_content,
                "entity_list": str(potential_entities),
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        return result.get("key_entities", [])
    except Exception as e:
        print(
            f"{log_prefix} [bold red]CRITICAL: Entity filtering failed even after attempting to fix: {e}[/bold red]"
        )
        return []


async def filter_claim(
    potential_claims: List[str],
    section_content: str,
    runnable_config: RunnableConfig,
    section_index: int,
) -> str:
    """
    Phase 3: Filters a list of potential claims to select the single most valuable one.
    Enhanced with indexed logging.
    """
    if not potential_claims:
        return ""

    log_prefix = f"   - [Section {section_index + 1}]"
    print(
        f"{log_prefix} [yellow]Phase 3: Filtering {len(potential_claims)} potential claims...[/yellow]"
    )

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["main"], temperature=0.1)
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a meticulous podcast editor. Your goal is to select the single most intellectually stimulating and thematically relevant claim from a list. "
                "A high-value claim is insightful, debatable, and core to the section's main argument.\n\n"
                "**CRITICAL RULE: You MUST REJECT any claim that is promotional, an advertisement, or a call-to-action.** "
                "If a claim mentions discounts, offers, website URLs for products, or sounds like a sponsor read, it is INVALID. "
                "If all the potential claims are promotional, you MUST return an empty string for the 'best_claim' value.\n\n"
                "AVOID selecting:\n"
                "- **Sponsor-Related:** (e.g., 'You can get 35% off...').\n"
                "- **Trivial Facts:** (e.g., 'Q2 stadium is in Austin, Texas').\n"
                "- **Purely Personal Anecdotes:** (e.g., 'My heart rate went up 15 points').\n\n"
                "Based on this strict rubric, analyze the 'TRANSCRIPT SECTION' for context and select the best non-promotional claim from the 'LIST OF POTENTIAL CLAIMS'. "
                "Your output must be a JSON object with a single key 'best_claim' containing a single string.\n{format_instructions}",
            ),
            (
                "human",
                "TRANSCRIPT SECTION (for context):\n{content}\n\nLIST OF POTENTIAL CLAIMS:\n{claim_list}",
            ),
        ]
    )
    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke(
            {
                "content": section_content,
                "claim_list": str(potential_claims),
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        best_claim = result.get("best_claim", "")
        if "http" in best_claim or "% off" in best_claim:
            print(
                f"{log_prefix} [bold red]Claim filtering returned a promotional link. Rejecting.[/bold red]"
            )
            return ""
        return best_claim
    except Exception as e:
        print(f"{log_prefix} [red]Error during Claim Filtering: {e}[/red]")
        return ""


@retry_with_exponential_backoff
async def enrich_section_with_analysis(
    section_content: str,
    runnable_config: RunnableConfig,
    job_config: Dict,
    user_id: str,
    job_id: str,
    section_index: int,
) -> Dict:
    """
    Orchestrates the analysis of a single section, with logging enhanced
    to include the section index for better traceability in parallel execution.
    """
    log_prefix = f"   - [Section {section_index + 1}]"

    # Create a clean version of the content for all LLM calls
    lines = section_content.splitlines()
    cleaned_lines = [clean_line_for_analysis(line) for line in lines]
    content_for_llm = "\n".join(cleaned_lines)

    try:
        print(f"{log_prefix} [yellow]Phase 1: Performing broad analysis...[/yellow]")
        broad_analysis = await analyze_content(content_for_llm, runnable_config)
    except Exception as e:
        log_msg = f"{log_prefix} [red]Error during Phase 1 (Broad Analysis): {e}[/red]"
        print(log_msg)
        db_manager.log_progress(user_id, job_id, log_msg)
        return {}

    potential_entities = broad_analysis.get("potential_entities", [])
    potential_claims = broad_analysis.get("potential_verifiable_claims", [])

    tasks_to_run = [
        filter_entities(
            potential_entities, content_for_llm, runnable_config, section_index
        ),
    ]

    if job_config.get("run_contextual_briefing"):
        tasks_to_run.append(
            filter_claim(
                potential_claims, content_for_llm, runnable_config, section_index
            )
        )

    print(f"{log_prefix} [cyan]Executing filtering tasks in parallel...[/cyan]")
    task_results = await asyncio.gather(*tasks_to_run, return_exceptions=True)

    final_analysis = broad_analysis

    if isinstance(task_results[0], list):
        final_analysis["key_entities"] = task_results[0]
    else:
        print(f"{log_prefix} [red]Entity filtering failed: {task_results[0]}[/red]")
        final_analysis["key_entities"] = []

    if job_config.get("run_contextual_briefing"):
        best_claim_result = task_results[1] if len(task_results) > 1 else None

        if isinstance(best_claim_result, str) and best_claim_result:
            final_analysis["verifiable_claims"] = [best_claim_result]
        elif isinstance(best_claim_result, Exception):
            print(
                f"{log_prefix} [bold red]Claim filtering task threw an exception: {best_claim_result}[/bold red]"
            )
            final_analysis["verifiable_claims"] = []
        else:
            print(
                f"{log_prefix} [yellow]No valid, non-promotional claim was selected after filtering.[/yellow]"
            )
            final_analysis["verifiable_claims"] = []
    else:
        final_analysis["verifiable_claims"] = []

    final_analysis.pop("potential_entities", None)
    final_analysis.pop("potential_verifiable_claims", None)

    return final_analysis


@retry_with_exponential_backoff
async def classify_if_sponsor_section(
    section_content: str, runnable_config: RunnableConfig
) -> bool:
    llm = ChatGoogleGenerativeAI(
        model=app_config.LLM_MODELS["main-lite"], temperature=0
    )
    parser = JsonOutputParser()
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a content classifier. Your task is to determine if the provided text is a sponsored message for a THIRD-PARTY product. Your output must be a JSON object with a single boolean key: 'is_sponsor_content'.\n\n"
                "RULES:\n"
                "1. A sponsored message is when the speaker promotes a product or service that is NOT their own (e.g., 'This video is sponsored by Squarespace' or 'I want to thank our sponsor, Athletic Greens').\n"
                "2. It is **NOT** a sponsored message if the speaker is promoting their **own** book, course, webinar, newsletter, or social media channel. This is considered part of the main content.\n"
                "3. Set 'is_sponsor_content' to `true` only for third-party ads. Otherwise, set it to `false`.\n\n"
                "{format_instructions}",
            ),
            ("human", "--- TEXT TO ANALYZE ---\n{text_chunk}\n--- END TEXT ---"),
        ]
    )
    chain = prompt | llm | parser
    try:
        result = await chain.ainvoke(
            {
                "text_chunk": section_content[:1500],
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        return result.get("is_sponsor_content", False)
    except Exception:
        return False


@retry_with_exponential_backoff
async def get_context_for_entities(
    entities: List[str],
    transcript_context: str,
    user_id: str,
    job_id: str,
    section_index: int,
) -> Dict[str, str]:
    """
    Fetches context for a list of entities using a 3-tier strategy:
    1. Normalized Firestore Cache Check (Fastest)
    2. Concurrent Web Searches (for all cache misses)
    3. Batch Synthesis of web results
    Enhanced with indexed logging for parallel execution traceability.
    """
    if not entities:
        return {}

    log_prefix = f"       - [Section {section_index + 1}]"
    print(f"{log_prefix} [cyan]Starting Context Enrichment...[/cyan]")
    final_explanations = {}

    # --- Tier 1: Normalized Cache Check ---
    print(f"{log_prefix}    - 1. Checking Firestore cache with normalized keys...")
    entities_to_fetch = []
    for entity in entities:
        if not entity or not entity.strip():
            continue
        cache_id = _get_normalized_cache_key(entity)
        if not cache_id:
            continue
        try:
            doc_ref = db_manager.db.collection("entity_cache").document(cache_id)
            doc = doc_ref.get()
            if doc.exists:
                print(f"{log_prefix}      - CACHE HIT for: '{entity}'")
                final_explanations[entity] = doc.to_dict().get("explanation")
            else:
                entities_to_fetch.append(entity)  # This entity was a cache miss
        except Exception as e:
            print(
                f"{log_prefix}      - [red]Error accessing Firestore for entity '{entity}': {e}[/red]"
            )
            entities_to_fetch.append(entity)

    if not entities_to_fetch:
        print(f"{log_prefix}    - [green]All entities found in cache. Done.[/green]")
        return final_explanations

    print(
        f"{log_prefix}    - 2. Searching web concurrently for {len(entities_to_fetch)} cache misses..."
    )

    # --- Tier 2: Concurrent Web Search ---
    llm = ChatGoogleGenerativeAI(
        model=app_config.LLM_MODELS["best-lite"], temperature=0.1
    )
    tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    # A. Generate smart search queries in parallel
    query_gen_prompt = ChatPromptTemplate.from_template(
        "You are a search expert. Generate a concise, effective search query to find a relevant explanation for the term '{topic}' "
        "based on the following context.\n\nCONTEXT:\n{context}"
    )
    query_gen_chain = query_gen_prompt | llm | StrOutputParser()
    query_gen_tasks = [
        query_gen_chain.ainvoke({"topic": entity, "context": transcript_context})
        for entity in entities_to_fetch
    ]
    smart_queries = await asyncio.gather(*query_gen_tasks)

    # B. Execute all web searches in parallel
    search_tasks = [
        asyncio.to_thread(tavily_client.search, query=query, search_depth="basic")
        for query in smart_queries
        if query and query.strip()
    ]
    search_results_list = await asyncio.gather(*search_tasks)

    # C. Aggregate and deduplicate results
    all_search_results = []
    for result_group in search_results_list:
        all_search_results.extend(result_group.get("results", []))
        db_manager.update_job_cost_metrics(
            user_id, job_id, {"tavily_basic_searches": firestore.Increment(1)}
        )

    unique_results = list(
        {result["url"]: result for result in all_search_results}.values()
    )

    if not unique_results:
        print(
            f"{log_prefix}    - [yellow]Web search returned no results. Aborting enrichment for remaining entities.[/yellow]"
        )
        return final_explanations

    # --- Tier 3: Batch Synthesis ---
    print(
        f"{log_prefix}    - 3. Synthesizing explanations from {len(unique_results)} unique sources..."
    )
    parser = JsonOutputParser()
    summarizer_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful assistant. Your job is to provide concise, 1-2 sentence definitions for a list of topics based on provided search results. Your output must be a single JSON object where keys are the topics and values are the string definitions.\n{format_instructions}",
            ),
            (
                "human",
                "Please generate explanations for...\nTOPICS TO EXPLAIN:\n{topics_list}\n\nCOMBINED SEARCH RESULTS:\n{results_text}",
            ),
        ]
    )
    synthesis_chain = summarizer_prompt | llm | parser

    new_explanations_from_web = await synthesis_chain.ainvoke(
        {
            "topics_list": str(entities_to_fetch),
            "results_text": "\n\n".join([str(res) for res in unique_results]),
            "format_instructions": parser.get_format_instructions(),
        }
    )

    # --- Final Step: Update Cache and Combine Results ---
    print(f"{log_prefix}    - 4. Updating cache with new explanations...")
    for entity, explanation in new_explanations_from_web.items():
        cache_id = _get_normalized_cache_key(entity)
        if cache_id and explanation:
            db_manager.db.collection("entity_cache").document(cache_id).set(
                {"explanation": explanation, "last_updated": firestore.SERVER_TIMESTAMP}
            )
        final_explanations[entity] = explanation

    return final_explanations


@retry_with_exponential_backoff
async def generate_contextual_briefing(
    claim_text: str, context: str, user_id: str, job_id: str, section_index: int
) -> Dict:
    """
    Generates a multi-angle briefing for a specific claim by performing parallel
    web searches and synthesizing the results.
    Enhanced with indexed logging.
    """
    log_prefix = f"           - [Section {section_index + 1}]"
    print(
        f"{log_prefix} [bold purple]Starting 'Context & Perspectives Engine'...[/bold purple]"
    )

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["main"], temperature=0.1)
    parser = JsonOutputParser()

    print(f"{log_prefix}    - Generating diverse queries for: '{claim_text[:60]}...'")
    query_gen_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a master researcher. Your mission is to generate a diverse set of neutral search queries to investigate a statement from multiple angles. "
                "Think of queries that could find supporting data, challenging data, and broader context. "
                "Your output MUST be a JSON object with a single key 'queries' containing a list of 3-5 unique strings.\n{format_instructions}",
            ),
            (
                "human",
                "STATEMENT TO INVESTIGATE:\n'{claim}'\n\nORIGINAL CONTEXT FROM TRANSCRIPT:\n'{context}'",
            ),
        ]
    )
    query_gen_chain = query_gen_prompt | llm | parser

    try:
        query_result = await query_gen_chain.ainvoke(
            {
                "claim": claim_text,
                "context": context,
                "format_instructions": parser.get_format_instructions(),
            }
        )
        search_queries = query_result.get("queries", [])
        if not search_queries or not isinstance(search_queries, list):
            raise ValueError("LLM did not return a valid list of queries.")
    except Exception as e:
        print(
            f"{log_prefix}    - [red]Failed to generate valid search queries: {e}. Using raw claim as a fallback.[/red]"
        )
        search_queries = [claim_text]

    print(
        f"{log_prefix}    - Searching Tavily with {len(search_queries)} queries in parallel..."
    )
    all_search_results = []
    try:
        tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
        search_tasks = [
            asyncio.to_thread(
                tavily_client.search,
                query=query,
                search_depth="advanced",
                max_results=4,
            )
            for query in search_queries
            if query and query.strip()
        ]

        search_results_list = await asyncio.gather(*search_tasks)

        for result_group in search_results_list:
            all_search_results.extend(result_group.get("results", []))
            db_manager.update_job_cost_metrics(
                user_id, job_id, {"tavily_advanced_searches": firestore.Increment(1)}
            )

        unique_results = list(
            {result["url"]: result for result in all_search_results}.values()
        )

    except Exception as e:
        print(
            f"{log_prefix}  - [red]An error occurred during web search fallback: {e}[/red]"
        )
        return {"error": "SearchExecutionFailed", "details": str(e)}

    if not unique_results:
        return {
            "error": "NoSearchResults",
            "details": "Web search returned no results for the generated queries.",
        }

    print(
        f"{log_prefix}    - Synthesizing briefing from {len(unique_results)} unique sources..."
    )
    synthesis_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a world-class intelligence analyst. Your primary mission is to synthesize the provided **WEB SEARCH RESULTS** to create a structured, 5-angle briefing on the **ORIGINAL CLAIM**. "
                "Crucially, you must also use the **SPEAKER'S ORIGINAL CONTEXT** to inform your analysis. Your goal is to connect the general themes from the web results to the specific nuance, phrasing, and perspective of the speaker.\n"
                "Be objective, neutral, and base all points STRICTLY on the provided documents. Your output MUST be a JSON object with the following structure:\n"
                "1. 'overall_summary': A 2-3 sentence balanced overview of the findings.\n"
                "2. 'supporting_viewpoints': A list of objects, where each object represents evidence backing the claim. Each object must have 'source' (publication name), 'url', and 'perspective' (a direct quote or tight summary of the supporting point).\n"
                "3. 'challenging_viewpoints': A list of objects with the same structure, but for evidence that contradicts or challenges the claim.\n"
                "4. 'key_nuances_and_conditions': A list of strings explaining important 'it depends' factors, conditions, or exceptions mentioned in the results.\n"
                "5. 'broader_context': A brief paragraph explaining how this claim fits into a larger topic or debate.\n"
                "If no information is found for any specific angle, return an empty list for that key.\n{format_instructions}",
            ),
            (
                "human",
                "ORIGINAL CLAIM:\n'{claim}'\n\n"
                "SPEAKER'S ORIGINAL CONTEXT:\n'{original_context}'\n\n"
                "--- WEB SEARCH RESULTS ---\n{results}\n--- END SEARCH RESULTS ---",
            ),
        ]
    )
    synthesis_chain = synthesis_prompt | llm | parser

    try:
        briefing = await synthesis_chain.ainvoke(
            {
                "claim": claim_text,
                "original_context": context,
                "results": json.dumps(unique_results),
                "format_instructions": parser.get_format_instructions(),
            }
        )
        return briefing
    except Exception as e:
        print(f"{log_prefix}  - [red]Error during briefing synthesis: {e}[/red]")
        return {"error": "SynthesisFailed", "details": str(e)}


async def generate_x_thread(
    all_sections_analysis: List[Dict], runnable_config: RunnableConfig
) -> List[str]:
    """
    Generates a single, overall X-thread summarizing the entire analysis
    by combining insights from all sections.
    """
    print("        - [blue]Generating a single overall X (Twitter) thread...[/blue]")

    # Build a comprehensive context from the titles and summaries of all sections
    full_context = ""
    for i, section in enumerate(all_sections_analysis):
        title = section.get("generated_title", f"Section {i+1}")
        # Take the top 2-3 summary points to keep the context focused
        summary_points = section.get("summary_points", [])[:3]

        full_context += f"## {title}\n"
        for point in summary_points:
            full_context += f"- {point}\n"
        full_context += "\n"

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["best"], temperature=0.5)
    parser = JsonOutputParser()

    # The prompt is updated to reflect that it's analyzing a full document
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert social media strategist, specializing in creating engaging threads on X (formerly Twitter) from podcast content. "
                "You will be given an analysis of a full document, broken into sections with titles and key points. Your job is to synthesize this into a single, cohesive, and engaging thread."
                "Your output must be a JSON object with a single key, 'thread', which contains a list of strings. Each string is a single tweet.\n"
                "- The first tweet must be a strong, compelling hook that summarizes the main theme.\n"
                "- Each subsequent tweet should build on the previous one, pulling the most interesting ideas from the provided context.\n"
                "- Use emojis and good whitespace to make the thread visually appealing and easy to read.\n"
                "- Use numbering (e.g., 1/, 2/, 3/) to clearly indicate the thread structure.\n"
                "- Include 2-3 relevant hashtags at the end of the final tweet.\n"
                "- The last tweet should have a call to action, like asking a question to encourage engagement.\n"
                "{format_instructions}",
            ),
            (
                "human",
                "Based on the following analysis of a full document, create an engaging X thread.\n\n"
                "--- ANALYSIS ---\n{analysis_context}\n--- END ANALYSIS ---",
            ),
        ]
    )
    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke(
            {
                "analysis_context": full_context,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        return result.get("thread", [])
    except Exception as e:
        print(f"        - [red]Error generating overall X thread: {e}[/red]")
        return []


async def generate_blog_post(
    all_sections_analysis: List[Dict], runnable_config: RunnableConfig
) -> str:
    print("       - [blue]Generating Blog Post Draft...[/blue]")

    full_context = ""
    for i, section in enumerate(all_sections_analysis):
        title = section.get("generated_title", f"Section {i+1}")
        summary = "\n".join(section.get("summary_points", []))
        full_context += f"## {title}\n\n{summary}\n\n"

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["best"], temperature=0.6)
    parser = StrOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert content writer, skilled at turning outlines and bullet points into engaging blog posts. "
                "You will be given a structured analysis of a podcast or document. Your task is to synthesize this into a well-written, human-readable article. "
                "Use the section titles as H2 headings. Weave the summary points into coherent paragraphs. Start with a compelling introduction and end with a thoughtful conclusion. "
                "Maintain a professional yet accessible tone.",
            ),
            (
                "human",
                "Please generate a blog post from the following content analysis:\n\n--- ANALYSIS ---\n{analysis_context}\n--- END ANALYSIS ---",
            ),
        ]
    )
    chain = prompt | llm | parser

    try:
        return await chain.ainvoke(
            {"analysis_context": full_context},
            config=runnable_config,
        )
    except Exception as e:
        print(f"       - [red]Error generating blog post: {e}[/red]")
        return "Error: Could not generate blog post."


def find_quote_timestamps(
    quote_text: str, structured_transcript: List[Dict], similarity_threshold: int = 85
) -> Optional[Dict]:
    """
    Searches the structured transcript for a quote using fuzzy string matching
    to find the start and end time. This version correctly extracts the timestamp.
    """
    best_match = {"score": 0, "utterance": None}

    # Clean the quote text for better matching, removing speaker-like prefixes if any
    clean_quote_text = re.sub(r"^[a-zA-Z\s\d'-]+:\s*", "", quote_text).strip()

    for utterance in structured_transcript:
        utterance_text = utterance.get("text")
        if not utterance_text:
            continue

        score = fuzz.partial_ratio(clean_quote_text.lower(), utterance_text.lower())

        if score > best_match["score"]:
            best_match["score"] = score
            best_match["utterance"] = utterance

    if best_match["score"] >= similarity_threshold and best_match["utterance"]:
        found_utterance = best_match["utterance"]

        # --- THIS IS THE KEY FIX ---
        # Correctly get the timestamp in seconds from the found utterance
        time_s = found_utterance.get("timestamp_seconds", -1)

        # Format the time correctly, handling cases with no timestamp
        timestamp_str = (
            f"{time_s // 60:02d}:{time_s % 60:02d}" if time_s >= 0 else "N/A"
        )

        return {
            "quote": quote_text,
            "matched_text": found_utterance.get("text"),
            "score": best_match["score"],
            "start": timestamp_str,
            "end": timestamp_str,  # For a single utterance, start and end are the same
        }

    print(
        f"[yellow]Could not find a good match for quote: '{quote_text[:50]}...'. Best score: {best_match['score']}[/yellow]"
    )
    return None


async def transcribe_audio_from_gcs(
    storage_path: str, user_id: str, job_id: str, model_name: str = "universal"
) -> List[Dict]:
    """
    Transcribes audio from a GCS path, requesting speaker labels,
    and returns a structured list of utterances.
    """
    print(
        Panel(
            f"[bold cyan]🎤 Transcription & Diarization Initiated[/bold cyan]\n"
            f"   - [bold]Job ID:[/bold] {job_id}\n"
            f"   - [bold]Model:[/bold] [yellow]{model_name}[/yellow]",
            title="[bold]AssemblyAI Transcription[/bold]",
            border_style="cyan",
            expand=False,
        )
    )
    try:
        ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
        if not ASSEMBLYAI_API_KEY:
            raise ValueError("ASSEMBLYAI_API_KEY not found in environment variables.")

        print("   [dim]1/4: Downloading audio from GCS...[/dim]")
        storage_client = storage.Client()
        bucket_name = os.getenv("GCP_STORAGE_BUCKET_NAME")
        if not bucket_name:
            raise ValueError("GCP_STORAGE_BUCKET_NAME is not set.")
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(storage_path)
        audio_data = blob.download_as_bytes()
        print("   [green]✓[/green] [dim]Download complete.[/dim]")

        headers = {"authorization": ASSEMBLYAI_API_KEY}
        async with httpx.AsyncClient(timeout=600.0) as client:
            print("   [dim]2/4: Uploading audio to AssemblyAI...[/dim]")
            upload_response = await client.post(
                "https://api.assemblyai.com/v2/upload",
                headers=headers,
                content=audio_data,
            )
            upload_response.raise_for_status()
            audio_url = upload_response.json()["upload_url"]
            print("   [green]✓[/green] [dim]Upload complete.[/dim]")

            print(
                f"   [dim]3/4: Submitting for transcription with '{model_name}' model and diarization...[/dim]"
            )
            payload = {
                "audio_url": audio_url,
                "speech_model": model_name,
                "speaker_labels": True,  # Enable Speaker Diarization
            }
            submit_response = await client.post(
                "https://api.assemblyai.com/v2/transcript",
                json=payload,
                headers=headers,
            )
            submit_response.raise_for_status()
            transcript_id = submit_response.json()["id"]
            print("   [green]✓[/green] [dim]Submission complete.[/dim]")

            print("   [dim]4/4: Polling for results (this may take a moment)...[/dim]")
            while True:
                await asyncio.sleep(5)
                poll_endpoint = (
                    f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
                )
                poll_response = await client.get(poll_endpoint, headers=headers)
                poll_response.raise_for_status()
                result = poll_response.json()

                if result["status"] == "completed":
                    print("   [green]✓[/green] [dim]Polling complete.[/dim]")
                    audio_duration = result.get("audio_duration", 0)
                    if audio_duration is None:
                        audio_duration = 0

                    db_manager.update_job_cost_metrics(
                        user_id, job_id, {"assemblyai_audio_seconds": audio_duration}
                    )

                    # Log the successful result panel
                    print(
                        Panel(
                            f"[bold green]Transcription Successful[/bold green]\n"
                            f"   - [bold]Duration:[/bold] {audio_duration:.2f} seconds\n"
                            f"   - [bold]Model Used:[/bold] {result.get('speech_model')}",
                            title="[bold green]Result[/bold green]",
                            border_style="green",
                            expand=False,
                        )
                    )

                    # Check if utterances were returned
                    if not result.get("utterances"):
                        print(
                            "[bold yellow]LOG:[/bold yellow] Diarization did not return utterances. Creating a fallback structure."
                        )
                        # Fallback: create a single-speaker structure if diarization fails
                        return [{"speaker": "A", "text": result.get("text", "")}]

                    # Log and return the structured utterances
                    print(
                        f"[bold green]LOG:[/bold green] Diarization successful. Found {len(result['utterances'])} utterances."
                    )
                    return result["utterances"]

                elif result["status"] == "failed":
                    raise Exception(
                        f"AssemblyAI transcription failed: {result.get('error')}"
                    )

    except httpx.HTTPStatusError as e:
        print(
            f"[bold red]API Error:[/bold red] {e.response.status_code} - {e.response.text}"
        )
        raise
    except Exception as e:
        print(f"[bold red]An unexpected error occurred:[/bold red] {e}")
        raise


async def _process_single_section(
    section: List[Dict],  # <-- Now accepts a list of utterance objects
    section_index: int,
    user_id: str,
    job_id: str,
    config: Dict,
    runnable_config: RunnableConfig,
    full_canonical_transcript: List[Dict],  # <-- Pass the full transcript for context
) -> Optional[Dict]:
    """
    Helper function, refactored to fully process a single section passed in the canonical format.
    """
    log_prefix = f"  - [Section {section_index + 1}]"

    # Get start and end times from the utterance objects
    start_time_s = section[0].get("start_seconds", -1)
    end_time_s = section[-1].get("end_seconds", -1)

    # Format times for display, handling cases where there are no timestamps
    start_time_str = (
        f"{start_time_s // 60:02d}:{start_time_s % 60:02d}"
        if start_time_s >= 0
        else "N/A"
    )
    end_time_str = (
        f"{end_time_s // 60:02d}:{end_time_s % 60:02d}" if end_time_s >= 0 else "N/A"
    )

    progress_message = f"{log_prefix} Analysis initiated. (Time Range: {start_time_str} - {end_time_str})"
    print(f"      [cyan]L {progress_message}[/cyan]")
    db_manager.log_progress(
        user_id, job_id, f"Analysis for section {section_index + 1} initiated."
    )

    # Check if the result for this section already exists (good for retries)
    section_doc_id = f"section_{section_index:03d}"
    if db_manager.does_section_result_exist(user_id, job_id, section_doc_id):
        log_msg = f"{log_prefix} Result already exists. Skipping."
        print(f"      [green]L {log_msg}[/green]")
        return {"status": "skipped", "index": section_index}

    # Reconstruct the section's text content from the canonical utterances
    # This is the key change: we build the text for the LLM from our clean, structured data
    content_for_llm = "\n".join(
        [f"{utterance['speaker_id']}: {utterance['text']}" for utterance in section]
    )

    analysis_data = await enrich_section_with_analysis(
        section_content=content_for_llm,
        runnable_config=runnable_config,
        job_config=config,
        user_id=user_id,
        job_id=job_id,
        section_index=section_index,
    )

    if not analysis_data:
        # ... (Your existing logic for handling empty analysis is fine)
        return {"status": "skipped_no_data", "index": section_index}

    # Clip generation using the fuzzy matching function
    notable_quotes = analysis_data.get("notable_quotes", [])
    suggested_clips = []
    has_timestamps = start_time_s >= 0

    if has_timestamps and notable_quotes:
        print(f"{log_prefix} Finding timestamps for {len(notable_quotes)} quotes...")
        for quote in notable_quotes:
            # This function now searches the structured canonical transcript
            timestamp_data = find_quote_timestamps(quote, full_canonical_transcript)
            if timestamp_data:
                suggested_clips.append(timestamp_data)

    # Entity enrichment
    context_data = await get_context_for_entities(
        entities=analysis_data.get("key_entities", []),
        transcript_context=content_for_llm,  # Use the reconstructed text for context
        user_id=user_id,
        job_id=job_id,
        section_index=section_index,
    )

    # Contextual briefing
    briefing_data = {}
    if config.get("run_contextual_briefing") and analysis_data.get("verifiable_claims"):
        briefing_data = await generate_contextual_briefing(
            claim_text=analysis_data["verifiable_claims"][0],
            context=content_for_llm,
            user_id=user_id,
            job_id=job_id,
            section_index=section_index,
        )

    # Assemble the final result for this section
    section_result = {
        "start_time": start_time_str,
        "end_time": end_time_str,
        **analysis_data,
        "context_data": context_data,
        "contextual_briefing": briefing_data,
        "suggested_clips": suggested_clips,
    }

    db_manager.save_section_result(user_id, job_id, section_index, section_result)
    db_manager.log_progress(
        user_id, job_id, f"✓ Section {section_index + 1}: Analysis complete and saved."
    )

    return {
        "status": "processed",
        "generated_title": analysis_data.get("generated_title"),
    }


async def run_full_analysis(user_id: str, job_id: str):
    """
    The main worker function, fully implemented with the robust Preprocessing->Canonical->Analysis pipeline.
    This version is complete and contains no placeholders.
    """
    total_start_time = time.monotonic()
    timing_metrics = {}
    MINIMUM_JOB_CHARGE_USD = app_config.MINIMUM_JOB_CHARGE_USD or 0.01

    print(
        Panel(
            f"[bold cyan]🚀 Starting Full Analysis for Job ID:[/bold cyan]\n[white]{job_id}[/white]",
            border_style="cyan",
            expand=False,
        )
    )
    db_manager.log_progress(user_id, job_id, "Analysis initiated...")

    try:
        # Step 1: Get Job Status and Basic Setup
        job_doc = db_manager.get_job_status(user_id, job_id)
        if not job_doc:
            raise ValueError(f"Job {job_id} not found for user {user_id}.")

        current_status = job_doc.get("status")
        if current_status != "QUEUED":
            print(
                f"[bold yellow]LOG: Job has status '{current_status}'. Skipping duplicate execution.[/bold yellow]"
            )
            return

        db_manager.update_job_status(
            user_id, job_id, "PROCESSING", "Step 1/7: Preparing analysis..."
        )
        request_data = job_doc.get("request_data", {})
        config = request_data.get("config", {})
        canonical_transcript = []

        # Step 2: Input Acquisition & Normalization
        storage_path = request_data.get("storagePath")
        if storage_path:
            db_manager.update_job_status(
                user_id, job_id, "PROCESSING", "Step 2/7: Transcribing audio file..."
            )
            utterances = await transcribe_audio_from_gcs(
                storage_path,
                user_id,
                job_id,
                request_data.get("model_choice", "universal"),
            )

            print(
                "[cyan]Step 2a: Converting audio transcript to canonical format...[/cyan]"
            )
            for utt in utterances:
                canonical_transcript.append(
                    {
                        "speaker_id": f"Speaker {utt.get('speaker', 'A')}",
                        "start_seconds": utt.get("start", 0) // 1000,
                        "end_seconds": utt.get("end", 0) // 1000,
                        "text": utt.get("text", ""),
                    }
                )
            timing_metrics["transcription_s"] = time.monotonic() - total_start_time
        else:
            db_manager.update_job_status(
                user_id, job_id, "PROCESSING", "Step 2/7: Processing text input..."
            )
            raw_transcript_text = request_data.get("transcript")
            if not raw_transcript_text:
                raise ValueError("Input text is empty.")

            canonical_transcript = await preprocess_and_normalize_transcript(
                raw_transcript_text
            )

        if not canonical_transcript:
            raise ValueError("Preprocessing failed to produce a usable transcript.")

        db_manager.update_job_status(
            user_id,
            job_id,
            "PROCESSING",
            "Step 3/7: Normalization complete.",
            structured_transcript=canonical_transcript,
        )
        timing_metrics["normalization_s"] = time.monotonic() - total_start_time

        # Step 3: Segment Transcript
        db_manager.log_progress(user_id, job_id, "Step 4/7: Segmenting transcript...")
        start_segmentation = time.monotonic()
        token_tracker = cost_tracking.TokenCostCallbackHandler(user_id, job_id)
        runnable_config = RunnableConfig(callbacks=[token_tracker])

        sections = []

        # --- START: NEW ROUTING LOGIC ---
        # Check if we have a single block of plain text (Use Case 4)
        if (
            len(canonical_transcript) == 1
            and canonical_transcript[0].get("start_seconds", -1) == -1
        ):
            # Use the dedicated chunker for plain text
            chunked_utterances = await chunk_plain_text_with_ai(
                canonical_transcript[0]["text"], runnable_config
            )

            # Treat each chunk as its own section
            sections = [[utt] for utt in chunked_utterances]

        else:
            # --- This is the existing logic for multi-utterance transcripts (Use Cases 1, 2, 3) ---
            boundary_indices = await find_semantic_topic_boundaries_with_ai(
                canonical_transcript, runnable_config, user_id, job_id
            )
            # Always include the start of the transcript as a boundary
            if 0 not in boundary_indices:
                boundary_indices.insert(0, 0)

            sections = create_sections_from_canonical(
                canonical_transcript, boundary_indices
            )
        # --- END: NEW ROUTING LOGIC ---

        sections = merge_short_canonical_sections(sections, min_duration_seconds=180)
        # --- END: ADD THIS MERGING STEP ---

        num_sections = len(sections)
        # Add a filter to remove any potential empty sections, just in case
        sections = [s for s in sections if s]
        if num_sections > len(sections):
            print(
                f"[yellow]Filtered out {num_sections - len(sections)} empty sections.[/yellow]"
            )
            num_sections = len(sections)

        timing_metrics["segmentation_s"] = time.monotonic() - start_segmentation
        db_manager.log_progress(
            user_id,
            job_id,
            f"✓ Transcript merged and segmented into {num_sections} substantive sections.",
        )

        # Step 4: Analyze Sections in Parallel
        section_log_str = f"{num_sections} section{'s' if num_sections != 1 else ''}"
        log_msg = f"Step 5/7: Analyzing {section_log_str} in parallel..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        db_manager.update_job_status(user_id, job_id, "PROCESSING", log_msg)

        start_section_analysis = time.monotonic()
        analysis_tasks = [
            _process_single_section(
                section=section,
                section_index=i,
                user_id=user_id,
                job_id=job_id,
                config=config,
                runnable_config=runnable_config,
                full_canonical_transcript=canonical_transcript,
            )
            for i, section in enumerate(sections)
        ]
        section_processing_results = await asyncio.gather(*analysis_tasks)
        timing_metrics["section_analysis_s"] = time.monotonic() - start_section_analysis

        final_job_title = job_doc.get("title", "Untitled Analysis")
        for result in section_processing_results:
            if (
                result
                and result.get("status") == "processed"
                and result.get("generated_title")
            ):
                final_job_title = result["generated_title"]
                db_manager.update_job_title(user_id, job_id, final_job_title)
                break

        # Step 5: Generate Final Content Assets
        log_msg = "Step 6/7: Generating final content assets..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        db_manager.update_job_status(user_id, job_id, "PROCESSING", log_msg)
        start_final_content = time.monotonic()
        all_section_results = db_manager.get_job_results_from_subcollection(
            user_id, job_id
        )

        if config.get("run_blog_post_generation") and all_section_results:
            blog_post = await generate_blog_post(all_section_results, runnable_config)
            db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                job_id
            ).update({"generated_blog_post": blog_post})
            db_manager.log_progress(user_id, job_id, "✓ Blog post generated and saved.")

        if config.get("run_x_thread_generation") and all_section_results:
            x_thread = await generate_x_thread(all_section_results, runnable_config)
            db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                job_id
            ).update({"generated_overall_x_thread": x_thread})
            db_manager.log_progress(
                user_id, job_id, "✓ Overall X-thread generated and saved."
            )

        timing_metrics["final_content_generation_s"] = (
            time.monotonic() - start_final_content
        )

        # Step 6 & 7: Finalize Results and Cost Calculation
        log_msg = "Step 7/7: Finalizing results and calculating cost..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        db_manager.update_job_status(user_id, job_id, "PROCESSING", log_msg)
        start_finalization = time.monotonic()

        final_llm_metrics = token_tracker.get_metrics()
        db_manager.update_job_cost_metrics(
            user_id,
            job_id,
            {
                "llm_input_tokens_total": final_llm_metrics["llm_input_tokens"],
                "llm_output_tokens_total": final_llm_metrics["llm_output_tokens"],
            },
        )
        final_cost_metrics = db_manager.get_job_cost_metrics(user_id, job_id)

        pre_discount_cost_usd = (
            (final_cost_metrics.get("llm_input_tokens_total", 0) * 0.0000003)
            + (final_cost_metrics.get("llm_output_tokens_total", 0) * 0.0000006)
            + (final_cost_metrics.get("tavily_basic_searches", 0) * 0.008)
            + (final_cost_metrics.get("tavily_advanced_searches", 0) * 0.016)
            + (final_cost_metrics.get("assemblyai_audio_seconds", 0) * 0.0003)
        )
        user_plan = db_manager.get_user_plan(user_id)
        plan_discount_usd = pre_discount_cost_usd * 0.15 if user_plan == "pro" else 0
        final_billed_usd = max(
            MINIMUM_JOB_CHARGE_USD, pre_discount_cost_usd - plan_discount_usd
        )

        db_manager.update_job_cost_metrics(
            user_id,
            job_id,
            {
                "pre_discount_cost_usd": round(pre_discount_cost_usd, 6),
                "plan_discount_usd": round(plan_discount_usd, 6),
                "final_billed_usd": round(final_billed_usd, 6),
            },
        )

        cost_breakdown = {
            "llm_input_tokens": final_cost_metrics.get("llm_input_tokens_total", 0),
            "llm_output_tokens": final_cost_metrics.get("llm_output_tokens_total", 0),
            "tavily_searches": final_cost_metrics.get("tavily_basic_searches", 0)
            + final_cost_metrics.get("tavily_advanced_searches", 0),
            "assemblyai_seconds": final_cost_metrics.get("assemblyai_audio_seconds", 0),
            "pre_discount_cost_usd": round(pre_discount_cost_usd, 6),
            "plan_discount_usd": round(plan_discount_usd, 6),
            "final_billed_usd": round(final_billed_usd, 6),
        }
        usage_record_data = {
            "costInUSD": round(final_billed_usd, 6),
            "type": "audio" if storage_path else "text",
            "usageMetric": (
                cost_breakdown["assemblyai_seconds"]
                if storage_path
                else len(request_data.get("transcript", ""))
            ),
            "breakdown": cost_breakdown,
        }
        db_manager.create_usage_record(user_id, job_id, usage_record_data)

        original_estimate = job_doc.get("estimated_cost_usd", 0)
        settlement_successful = db_manager.settle_job_cost(
            user_id, original_estimate, final_billed_usd
        )
        if not settlement_successful:
            raise Exception("Credit settlement failed.")

        timing_metrics["finalization_s"] = time.monotonic() - start_finalization
        timing_metrics["total_job_s"] = time.monotonic() - total_start_time
        db_manager.update_job_cost_metrics(
            user_id, job_id, {"timing_metrics": timing_metrics}
        )

        db_manager.update_job_status(
            user_id,
            job_id,
            "COMPLETED",
            f"Analysis of {num_sections} sections complete. Final cost: ${round(final_billed_usd, 4)}",
        )
        db_manager.create_notification(user_id, job_id, final_job_title)
        db_manager.log_progress(user_id, job_id, "✅ Analysis Complete.")

        cost_details = (
            f"  - [bold]Subtotal:[/bold] ${pre_discount_cost_usd:.4f} USD\n"
            f"  - [bold]Pro Discount (15%):[/bold] -${plan_discount_usd:.4f} USD\n"
            f"  - [bold]Final Billed Amount:[/bold] ${final_billed_usd:.4f} USD\n\n"
            f"  - [dim]LLM Tokens:[/dim] [dim]{cost_breakdown.get('llm_input_tokens', 0):,} (Input) | {cost_breakdown.get('llm_output_tokens', 0):,} (Output)[/dim]\n"
            f"  - [dim]Tavily Searches:[/dim] [dim]{cost_breakdown.get('tavily_searches', 0)}[/dim]\n"
            f"  - [dim]AssemblyAI Audio:[/dim] [dim]{cost_breakdown.get('assemblyai_seconds', 0):.2f} seconds[/dim]"
        )
        print(
            Panel(
                f"[bold green]Final Cost Metrics for Job ID: {job_id}[/bold green]\n{cost_details}",
                title="[bold green]Metrics[/bold green]",
                border_style="green",
                title_align="left",
            )
        )

        timing_details = "\n".join(
            [
                f"  - [bold]{key.replace('_s', ' (s)'):<30}:[/bold] {value:.2f}"
                for key, value in timing_metrics.items()
            ]
        )
        print(
            Panel(
                f"[bold cyan]Performance Timing for Job ID: {job_id}[/bold cyan]\n{timing_details}",
                title="[bold cyan]Timing[/bold cyan]",
                border_style="cyan",
                title_align="left",
            )
        )

        print(
            Panel(
                f"[bold green]✅ Analysis COMPLETE for Job ID:[/bold green]\n[white]{job_id}[/white]",
                border_style="green",
            )
        )

    except Exception as e:
        error_message = f"An error occurred during analysis: {str(e)}"
        print(
            Panel(
                f"[bold red]❌ ERROR for Job ID: {job_id}[/bold red]\n{error_message}",
                border_style="red",
            )
        )
        db_manager.update_job_status(user_id, job_id, "FAILED", error_message)
        db_manager.log_progress(user_id, job_id, f"❌ Analysis Failed: {error_message}")

        # Ensure pre-authorized credits are refunded on failure
        job_doc_on_fail = db_manager.get_job_status(user_id, job_id)
        if job_doc_on_fail:
            original_estimate = job_doc_on_fail.get("estimated_cost_usd", 0)
            if original_estimate > 0:
                print(
                    f"[yellow]Refunding pre-authorized amount of ${original_estimate} for failed job.[/yellow]"
                )
                db_manager.settle_job_cost(user_id, original_estimate, 0)
