import re
import os
from typing import Optional, List, Dict, Any
import time
import random
import json
import httpx
import asyncio
import math
from dotenv import load_dotenv

load_dotenv()


from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain.output_parsers import OutputFixingParser
from rich import print
from rich.panel import Panel
from tavily import TavilyClient
from firebase_admin import firestore
from functools import wraps
from google.api_core.exceptions import ResourceExhausted
from langchain_core.runnables import RunnableConfig

from src import clients
from src import db_manager
from src import cost_tracking
from src.features import (
    generate_blog_post,
    generate_contextual_briefing,
    generate_x_thread,
    generate_linkedin_post,
)


PERSONA_CONFIG = {
    "general": {
        "prompt_system": """You are a master analyst. Your output must be a JSON object. For the provided text, extract the following:
- 'generated_title': A concise, engaging, human-readable title (3-6 words).
- '1_sentence_summary': A single sentence that captures the absolute core message.
- 'summary_points': A list of 3-5 bullet points summarizing the key arguments.
- 'notable_quotes': A list of 1-4 impactful, memorable sentences quoted directly from the text.
- 'actionable_advice': A list of clear, actionable steps a listener could apply.
- 'questions_and_answers': A list of objects, where each object has 'question' and 'answer' keys.
- 'potential_entities': A list of EVERY person, organization, place, or specific concept mentioned.
- 'potential_verifiable_claims': A list of EVERY statement that presents itself as an objective, verifiable fact. Do not include opinions or advice.
- 'topics_and_keywords': A list of the most important keywords.
{format_instructions}""",
        "output_keys": {
            "title": "generated_title",
            "summary": "1_sentence_summary",
            "quotes": "notable_quotes",
            "entities": "potential_entities",
            "claims": "potential_verifiable_claims",
        },
        "final_assets": ["x_thread", "blog_post", "linkedin_post"],
    },
    "consultant": {
        "prompt_system": """You are a Senior Consultant at a top-tier firm like McKinsey, Bain, or BCG. Your task is to analyze the following client interview transcript SECTION. 
Your tone should be professional, concise, and direct. Your output must be a structured JSON object. For the provided text SECTION, extract the following:
- 'section_title': A concise, scannable title for this section (3-6 words max).
- 'executive_summary': A single, hard-hitting sentence summarizing the core finding for a CEO.
- 'client_pain_points': A list of the critical business problems, challenges, or frustrations mentioned by the client in this section.
- 'strategic_opportunities': A list of potential business opportunities, growth levers, or new initiatives identified from the text in this section.
- 'key_stakeholders_mentioned': A list of key people, roles, or departments mentioned (e.g., 'CFO', 'Marketing Department').
- 'critical_quotes': A list of 1-3 direct quotes from this section that are perfect for putting on a slide to emphasize a point.
- 'open_questions': A list of unresolved questions or areas needing further investigation based on this section.
{format_instructions}""",
        "output_keys": {
            "title": "section_title",
            "summary": "executive_summary",
            "quotes": "critical_quotes",
            "entities": "key_stakeholders_mentioned",
            "claims": "open_questions",
        },
        "final_assets": ["slide_deck", "blog_post", "x_thread", "linkedin_post"],
    },
}


def segment_monologue_with_word_timestamps(
    assembly_words: List[Dict], words_per_section: int = 750
) -> List[List[Dict]]:
    """
    Segments a monologue using AssemblyAI's word-level timestamps to create
    sections with precise start and end times.
    """
    print(
        f"[cyan]🚀 Activating high-precision monologue segmentation ({words_per_section} words/section)...[/cyan]"
    )
    if not assembly_words:
        return []

    sections = []
    for i in range(0, len(assembly_words), words_per_section):
        word_chunk = assembly_words[i : i + words_per_section]
        if not word_chunk:
            continue

        # Get the start time of the first word and end time of the last word
        start_time_ms = word_chunk[0]["start"]
        end_time_ms = word_chunk[-1]["end"]

        # Create the section's text by joining the words
        section_text = " ".join(word["text"] for word in word_chunk)

        # Create the canonical utterance for this section
        section_utterance = {
            "speaker_id": "Speaker A",  # Monologue is always one speaker
            "start_seconds": start_time_ms // 1000,
            "end_seconds": end_time_ms // 1000,
            "text": section_text,
        }

        # Each section is a list containing the single utterance
        sections.append([section_utterance])

    print(
        f"[green]✓ Monologue successfully split into {len(sections)} high-precision sections.[/green]"
    )
    return sections


def _get_dynamic_words_per_section(total_characters: int) -> int:
    """
    Calculates the ideal number of words per section to achieve a smooth scaling
    from 1-2 sections for short texts up to a maximum of 12 for very long texts.

    This logic is designed to work with the `segment_by_word_count` function.
    It determines a target number of sections and then calculates the word count
    per section needed to divide the total text evenly into that many chunks,
    preventing the creation of a tiny, leftover final section.
    """
    # --- Configuration Constants ---
    # The average number of characters per word. 5.0 is a standard English estimate.
    CHARS_PER_WORD = 5.0
    # The minimum number of sections for any text that's long enough to be split.
    MIN_SECTIONS = 1
    # The absolute maximum number of sections to create, to avoid overwhelming the user.
    MAX_SECTIONS = 10
    # The number of words below which we will not split the text at all (~3 mins of speech).
    MIN_WORDS_FOR_SPLIT = 1000
    # The number of words at which we start scaling up the number of sections (~10 mins).
    SCALE_START_WORDS = 1500
    # The number of words at which we hit the maximum number of sections (~3 hours).
    SCALE_END_WORDS = 27000

    # 1. Estimate total words from characters.
    total_words = total_characters / CHARS_PER_WORD

    # 2. Handle edge cases for very short texts.
    # If the text is too short, make the "words_per_section" larger than the text
    # itself to guarantee it's treated as a single section by the calling function.
    if total_words < MIN_WORDS_FOR_SPLIT:
        return int(total_words) + 1  # Ensures only one section is created.

    # 3. Determine the target number of sections using linear scaling.
    target_sections: float
    if total_words <= SCALE_START_WORDS:
        # For texts just long enough to split, use the minimum number of sections.
        target_sections = float(MIN_SECTIONS)
    elif total_words >= SCALE_END_WORDS:
        # For very long texts, clamp to the maximum number of sections.
        target_sections = float(MAX_SECTIONS)
    else:
        # Linearly interpolate the number of sections between the start and end word counts.
        # This creates a smooth increase in section count as text length grows.
        progress = (total_words - SCALE_START_WORDS) / (
            SCALE_END_WORDS - SCALE_START_WORDS
        )
        target_sections = MIN_SECTIONS + progress * (MAX_SECTIONS - MIN_SECTIONS)

    # 4. Calculate the words per section needed to hit the target number of sections.
    # We use math.ceil() on the target sections to determine our final section count.
    final_num_sections = math.ceil(target_sections)

    # Avoid division by zero, though this case is unlikely with the logic above.
    if final_num_sections == 0:
        return int(total_words) + 1

    # By dividing total words by the desired number of sections, we get a chunk size
    # that ensures all chunks are of nearly equal size.
    words_per_section = total_words / final_num_sections

    # Return the ceiling of the result to ensure the loop in the calling function
    # terminates correctly and the last section isn't oversized.
    return math.ceil(words_per_section)


def _get_normalized_cache_key(entity_name: str) -> str:
    """
    Creates a standardized, robust cache key from an entity name without NLTK.
    Example: "Chief Marketing Officer" -> "chief-marketing-officer"
    """
    if not entity_name:
        return None
    # 1. Make it lowercase and remove leading/trailing whitespace.
    normalized = entity_name.lower().strip()
    # 2. Replace spaces and other common separators with a hyphen.
    normalized = re.sub(r"[\s_.]+", "-", normalized)
    # 3. Remove any characters that aren't letters, numbers, or hyphens.
    normalized = re.sub(r"[^a-z0-9-]", "", normalized)
    return normalized


def normalize_youtube_transcript(transcript_data: List[Dict]) -> List[Dict]:
    """
    Converts a raw YouTube transcript object into the canonical format.
    YouTube format: [{'text': '...', 'start': 1.23, 'duration': 4.56}, ...]
    """
    canonical_transcript = []
    if not isinstance(transcript_data, list):
        print("[bold red]ERROR: YouTube transcript data is not a list.[/bold red]")
        return []

    for item in transcript_data:
        start_seconds = item.get("start", 0)
        duration = item.get("duration", 0)
        end_seconds = start_seconds + duration
        canonical_transcript.append(
            {
                "speaker_id": "Speaker A",  # YouTube transcripts don't have speaker info
                "start_seconds": int(start_seconds),
                "end_seconds": int(end_seconds),
                "text": item.get("text", ""),
            }
        )
    print(
        f"[green]✓ Normalized YouTube transcript into {len(canonical_transcript)} canonical utterances.[/green]"
    )
    return canonical_transcript


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


def clean_line_for_analysis(line: str) -> str:
    return re.sub(r"\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*", " ", line).strip()


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

    # ADD THIS LINE TO DEBUG
    print(
        f"[bold yellow]DEBUG: Number of lines detected by splitlines(): {len(lines)}[/bold yellow]"
    )

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


def segment_by_word_count(
    raw_text: str, words_per_section: int = 500
) -> List[List[Dict]]:
    """
    Segments a plain-text transcript into sections of a fixed word count.
    This version is robust and works directly with words, ignoring newlines.
    Includes detailed logging.
    """
    print(
        f"[cyan]🚀 Activating robust word-count segmentation ({words_per_section} words/section)...[/cyan]"
    )

    words = raw_text.split()
    total_words = len(words)

    print(
        Panel(
            f"Total word count detected: [bold cyan]{total_words}[/bold cyan]",
            title="[yellow]Initial Text Analysis[/yellow]",
            border_style="yellow",
            expand=False,
        )
    )

    if total_words < words_per_section:
        print(
            "[yellow]Warning: Total word count is less than `words_per_section`. Only one section will be created.[/yellow]"
        )

    sections = []
    start_index = 0
    section_num = 1

    while start_index < total_words:
        end_index = start_index + words_per_section
        section_words = words[start_index:end_index]
        section_text = " ".join(section_words)

        # Format the section into the canonical structure the pipeline expects
        section_utterances = [
            {
                "speaker_id": "Narrator",
                "start_seconds": -1,
                "end_seconds": -1,
                "text": section_text,
            }
        ]
        sections.append(section_utterances)

        print(
            Panel(
                f"Created Section #{section_num}\n"
                f"  - Word Range: {start_index} - {min(end_index, total_words)}\n"
                f"  - Word Count: {len(section_words)}",
                title=f"[blue]Section Creation[/blue]",
                border_style="blue",
                expand=False,
            )
        )

        start_index = end_index
        section_num += 1

    print(
        f"[green]✓ Text successfully split into {len(sections)} sections based on word count.[/green]"
    )
    return sections


async def analyze_content(
    section_content: str, runnable_config: RunnableConfig, persona: str
) -> Dict:
    """
    Performs broad analysis on text, tailored to the given persona.
    """
    # Default to 'general' if an unknown persona is passed
    config = PERSONA_CONFIG.get(persona, PERSONA_CONFIG["general"])

    print(
        f"     - [yellow]Phase 1: Performing broad '{persona}'-focused analysis...[/yellow]"
    )

    llm, llm_options = clients.get_llm("best-lite", temperature=0.2)
    parser = JsonOutputParser()
    fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=llm)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                config["prompt_system"].format(
                    format_instructions=parser.get_format_instructions()
                ),
            ),
            ("human", "--- TEXT TO ANALYZE ---\n{content}\n--- END TEXT ---"),
        ]
    )

    chain = prompt | llm | fixing_parser
    return await chain.ainvoke({"content": section_content}, config=runnable_config)


async def generate_final_title(
    synthesis_or_argument_data: Dict, runnable_config: RunnableConfig
) -> str:
    """
    Generates a final, overarching title based on a high-level synthesis
    or argument structure of the entire document.

    Args:
        synthesis_or_argument_data: The output from either perform_meta_synthesis or generate_argument_structure.
        runnable_config: The LangChain runnable configuration.

    Returns:
        A single, compelling title string.
    """
    print("  - [blue]Generating final holistic title from Pass 2 analysis...[/blue]")

    # If the Pass 2 analysis failed or was empty, return a default.
    if not synthesis_or_argument_data:
        return "Untitled Analysis"

    llm, llm_options = clients.get_llm("best-lite", temperature=0.4)
    parser = StrOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a master copywriter. Based on the following high-level summary of a document, create one single, concise, and engaging title for the entire document. The title should be 3-6 words long.",
            ),
            (
                "human",
                """Here is the document's high-level analysis:
--- ANALYSIS ---
{analysis_context}
--- END ANALYSIS ---

Provide only the title text and nothing else.""",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        title = await chain.ainvoke(
            {"analysis_context": json.dumps(synthesis_or_argument_data)},
            config=runnable_config,
        )
        # Clean up any potential quotation marks from the output
        return title.strip().strip('"')
    except Exception as e:
        print(f"  - [red]Error generating final title: {e}. Using a default.[/red]")
        return "Insight Analysis"


async def generate_slide_deck_outline(
    all_sections_analysis: List[Dict],
    synthesis_results: Dict,
    runnable_config: RunnableConfig,
) -> List[Dict]:
    """
    Generates a logical slide deck outline using the high-level synthesis results
    to create a compelling narrative, supported by details from the section-by-section analysis.
    """
    print(
        "     - [blue]Generating Client-Ready Slide Deck Outline using Synthesis Results...[/blue]"
    )

    # If the synthesis pass didn't run or failed, fall back to the old method
    if not synthesis_results:
        print(
            "     - [yellow]Synthesis results not found. Falling back to simple consolidation.[/yellow]"
        )
        # Consolidate the key findings from all sections into a single context (old method)
        full_context = ""
        for i, section in enumerate(all_sections_analysis):
            title = section.get("executive_summary", f"Key Finding {i+1}")
            pain_points = "\n".join(
                [f"- {p}" for p in section.get("client_pain_points", [])]
            )
            opportunities = "\n".join(
                [f"- {o}" for o in section.get("strategic_opportunities", [])]
            )
            full_context += f"## {title}\n\n**Pain Points:**\n{pain_points}\n\n**Opportunities:**\n{opportunities}\n\n"
    else:
        # The new, preferred context is the rich synthesis result
        full_context = json.dumps(synthesis_results, indent=2)

    llm, llm_options = clients.get_llm("best-lite", temperature=0.2)
    parser = JsonOutputParser()

    # The prompt is updated to leverage the synthesis results for a better narrative
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a Partner at a top-tier consulting firm. You have been provided with a high-level strategic synthesis of a client engagement, including overarching themes, a narrative arc, and key contradictions. Your task is to use this synthesis to create a compelling narrative for a final client presentation slide deck.

- Use the 'narrative_arc' to structure the overall story of the presentation (e.g., Situation, Complication, Resolution).
- Use the 'overarching_themes' and 'key_contradictions' to create the core content slides that prove your argument.
- Keep slide titles concise and action-oriented.
- Ensure bullet points are direct and impactful.

Your output must be a JSON object with a single key, 'slide_deck', which is a list of objects. Each object represents one slide and must have 'slide_title' and 'slide_bullets' (a list of strings) keys.
{format_instructions}""",
            ),
            (
                "human",
                """Based on the following high-level synthesis, create a logical slide deck outline:

--- STRATEGIC SYNTHESIS ---
{analysis_context}
--- END SYNTHESIS ---""",
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
        return result.get("slide_deck", [])
    except Exception as e:
        print(f"     - [red]Error generating slide deck outline: {e}[/red]")
        return []


async def filter_entities(
    potential_entities: List[str],
    section_content: str,
    runnable_config: RunnableConfig,
    section_index: int,
) -> List[str]:
    """
    Phase 2: Filters a list of potential entities down to the most important ones.
    Enhanced with data validation to handle unexpected LLM output formats.
    """
    if not potential_entities:
        return []

    log_prefix = f"  - [Section {section_index + 1}]"
    print(
        f"{log_prefix} [yellow]Phase 2: Filtering {len(potential_entities)} potential entities...[/yellow]"
    )

    llm, llm_options = clients.get_llm("main", temperature=0.1)
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

        print(
            f"{log_prefix} [blue]DEBUG: LLM result from entity filtering: {result}[/blue]"
        )

        key_entities_found = result.get("entities", [])

        # --- NEW VALIDATION LOGIC ---
        # This block checks the format and fixes it if necessary.
        validated_entities = []
        if key_entities_found and isinstance(key_entities_found[0], dict):
            # This handles the error case where the LLM returns a list of dictionaries
            print(
                f"{log_prefix} [yellow]LLM returned a list of dicts. Normalizing to list of strings...[/yellow]"
            )
            for item in key_entities_found:
                # Look for a key that contains the entity name
                if "entity" in item:
                    validated_entities.append(item["entity"])
                elif "name" in item:
                    validated_entities.append(item["name"])
        else:
            # This handles the normal case where the LLM returns a list of strings
            validated_entities = [
                entity for entity in key_entities_found if isinstance(entity, str)
            ]

        print(
            f"{log_prefix} [green]✓ Found {len(validated_entities)} key entities: {validated_entities}[/green]"
        )

        return validated_entities

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

    llm, llm_options = clients.get_llm("main", temperature=0.1)
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
    persona: str,
) -> Dict:
    """
    Orchestrates the analysis of a single section and returns both the
    analysis data and the cost metrics incurred.
    """
    log_prefix = f"     - [Section {section_index + 1}]"
    persona_cfg = PERSONA_CONFIG.get(persona, PERSONA_CONFIG["general"])
    content_for_llm = "\n".join(
        [clean_line_for_analysis(line) for line in section_content.splitlines()]
    )

    # This will hold cost metrics specifically from this function's operations.
    total_costs = {"tavily_searches": 0}

    try:
        broad_analysis = await analyze_content(
            content_for_llm, runnable_config, persona=persona
        )
        if not broad_analysis:
            return {"analysis_data": {}, "cost_metrics": total_costs}
    except Exception as e:
        log_msg = f"{log_prefix} [red]Error during Phase 1 (Broad Analysis): {e}[/red]"
        print(log_msg)
        db_manager.log_progress(user_id, job_id, log_msg)
        return {"analysis_data": {}, "cost_metrics": total_costs}

    entities_key = persona_cfg["output_keys"]["entities"]
    claims_key = persona_cfg["output_keys"]["claims"]
    potential_entities = broad_analysis.get(entities_key, [])
    potential_claims = broad_analysis.get(claims_key, [])
    # --- MODIFICATION START ---
    # This function no longer generates briefings. It only filters the best claim
    # for this specific section and passes it up for the global selection later.
    claim_for_section = ""
    if potential_claims:
        if persona == "consultant":
            # For consultants, the "claim" is just the first open question
            claim_for_section = potential_claims[0]
        else:
            # For general persona, we still filter to find the best claim IN THIS SECTION
            claim_for_section = await filter_claim(
                potential_claims, content_for_llm, runnable_config, section_index
            )

    # The only async task now is entity filtering.
    key_entities = await filter_entities(
        potential_entities, content_for_llm, runnable_config, section_index
    )

    final_analysis = broad_analysis
    final_analysis["key_entities"] = key_entities if key_entities else []

    # This key is now used to pass up the best claim from this section.
    final_analysis["verifiable_claims"] = (
        [claim_for_section] if claim_for_section else []
    )
    # This is no longer generated here, so it's an empty object.
    final_analysis["contextual_briefing"] = {}
    final_analysis.pop(entities_key, None)
    final_analysis.pop(claims_key, None)

    # Return both the analysis and the aggregated costs
    return {"analysis_data": final_analysis, "cost_metrics": total_costs}


@retry_with_exponential_backoff
async def get_context_for_entities(
    entities: List[str],
    transcript_context: str,
    user_id: str,
    job_id: str,
    section_index: int,
) -> Dict[str, Any]:
    """
    Fetches context for entities and returns the explanations along with cost metrics.
    """
    cost_metrics = {"tavily_searches": 0}
    final_explanations = {}

    if not entities:
        return {"explanations": {}, "cost_metrics": cost_metrics}

    log_prefix = f"         - [Section {section_index + 1}]"
    print(f"{log_prefix} [cyan]Starting Context Enrichment...[/cyan]")

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
                final_explanations[entity] = doc.to_dict().get("explanation")
            else:
                entities_to_fetch.append(entity)
        except Exception as e:
            print(
                f"{log_prefix}      - [red]Error accessing Firestore for entity '{entity}': {e}[/red]"
            )
            entities_to_fetch.append(entity)

    if not entities_to_fetch:
        print(f"{log_prefix}    - [green]All entities found in cache. Done.[/green]")
        return {"explanations": final_explanations, "cost_metrics": cost_metrics}

    print(
        f"{log_prefix}    - 2. Searching web concurrently for {len(entities_to_fetch)} cache misses..."
    )

    # --- Tier 2: Concurrent Web Search ---
    llm, llm_options = clients.get_llm("best-lite", temperature=0.1)
    tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    query_gen_prompt = ChatPromptTemplate.from_template(
        "You are a search query generator. Create a single, concise search query to explain the term '{topic}' using the provided context. "
        "CRITICAL: Your output must be ONLY the search query string. Do not add any explanation, formatting, titles, or introductory text like 'Here is a query:'. The query must be under 50 words.\n\n"
        "CONTEXT:\n{context}"
    )
    query_gen_chain = query_gen_prompt | llm | StrOutputParser()
    query_gen_tasks = [
        query_gen_chain.ainvoke({"topic": entity, "context": transcript_context})
        for entity in entities_to_fetch
    ]
    smart_queries = await asyncio.gather(*query_gen_tasks)

    print(f"{log_prefix} [blue]DEBUG: Generated smart queries: {smart_queries}[/blue]")

    search_tasks = [
        asyncio.to_thread(
            tavily_client.search,
            query=query.strip().split("\n")[0][:390],
            search_depth="basic",
        )
        for query in smart_queries
        if query and query.strip()
    ]
    search_results_list = await asyncio.gather(*search_tasks)

    # Correctly count searches and populate the results list
    cost_metrics["tavily_searches"] = len(search_results_list)
    all_search_results = []
    for result_group in search_results_list:
        all_search_results.extend(result_group.get("results", []))

    unique_results = list(
        {result["url"]: result for result in all_search_results}.values()
    )

    if not unique_results:
        print(
            f"{log_prefix}    - [yellow]Web search returned no results. Aborting enrichment for remaining entities.[/yellow]"
        )
        return {"explanations": final_explanations, "cost_metrics": cost_metrics}

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

    return {"explanations": final_explanations, "cost_metrics": cost_metrics}


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
            raise ValueError("ASSEMBLYAI_API_KEY not found.")

        bucket_name = os.getenv("GCP_STORAGE_BUCKET_NAME")
        if not bucket_name:
            raise ValueError("GCP_STORAGE_BUCKET_NAME is not set.")

        # 1. Use the pre-loaded GCS client
        bucket = clients.gcs_client.bucket(bucket_name)
        blob = bucket.blob(storage_path)
        audio_bytes = await asyncio.to_thread(blob.download_as_bytes)

        headers = {"authorization": ASSEMBLYAI_API_KEY}

        # 2. Use the pre-loaded HTTPX client directly
        upload_response = await clients.httpx_client.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            content=audio_bytes,
        )
        upload_response.raise_for_status()
        audio_url = upload_response.json()["upload_url"]

        payload = {
            "audio_url": audio_url,
            "speech_model": model_name,
            "speaker_labels": True,
        }
        submit_response = await clients.httpx_client.post(
            "https://api.assemblyai.com/v2/transcript",
            json=payload,
            headers=headers,
        )
        submit_response.raise_for_status()
        transcript_id = submit_response.json()["id"]

        while True:
            await asyncio.sleep(5)
            poll_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
            poll_response = await clients.httpx_client.get(
                poll_endpoint, headers=headers
            )
            poll_response.raise_for_status()
            result = poll_response.json()

            if result["status"] == "completed":
                print("   [green]✓[/green] [dim]Polling complete.[/dim]")
                audio_duration = result.get("audio_duration", 0)
                if audio_duration is None:
                    audio_duration = 0

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

                if not result.get("utterances"):
                    print(
                        "[bold yellow]LOG:[/bold yellow] Diarization did not return utterances. Creating a fallback structure."
                    )
                    return [{"speaker": "A", "text": result.get("text", "")}]

                print(
                    f"[bold green]LOG:[/bold green] Diarization successful. Found {len(result['utterances'])} utterances."
                )
                return result

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


async def _select_best_claim_for_global_briefing(
    all_claims: List[str],
    synthesis_or_argument_data: Dict,
    runnable_config: RunnableConfig,
) -> str:
    """
    From a list of all claims, select the single most impactful one
    using the high-level synthesis as context.
    """
    if not all_claims:
        return ""

    print(
        f"\n[magenta]🧠 Selecting best claim from {len(all_claims)} candidates for global briefing...[/magenta]"
    )

    llm, llm_options = clients.get_llm("best-lite", temperature=0.0)
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a senior editor. You have been given a high-level strategic analysis of a document and a list of specific claims made within it. "
                "Your task is to select the SINGLE most important, insightful, and thematically central claim from the list. "
                "This claim will be used for a detailed briefing, so it should be a substantive statement. "
                "Your output must be a JSON object with a single key 'best_claim' containing the chosen string.\n{format_instructions}",
            ),
            (
                "human",
                "HIGH-LEVEL ANALYSIS (for context):\n{high_level_context}\n\nLIST OF POTENTIAL CLAIMS TO CHOOSE FROM:\n{claim_list}",
            ),
        ]
    )
    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke(
            {
                "high_level_context": json.dumps(synthesis_or_argument_data),
                "claim_list": json.dumps(list(set(all_claims))),
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        best_claim = result.get("best_claim", "")
        print(f"  [green]✓ Best claim selected: '{best_claim[:80]}...'[/green]")
        return best_claim
    except Exception as e:
        print(
            f"[red]Could not select best overall claim: {e}. Defaulting to first claim.[/red]"
        )
        return all_claims[0] if all_claims else ""


async def _process_single_section(
    section: List[Dict],
    section_index: int,
    user_id: str,
    job_id: str,
    config: Dict,
    runnable_config: RunnableConfig,
    full_canonical_transcript: List[Dict],
    persona: str,
) -> Optional[Dict]:
    """
    Orchestrates the full analysis of a single section and returns the results
    along with ALL cost metrics incurred during processing.
    """
    log_prefix = f"  - [Section {section_index + 1}]"
    start_time_s = section[0].get("start_seconds", -1)
    end_time_s = section[-1].get("end_seconds", -1)
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

    section_doc_id = f"section_{section_index:03d}"
    if db_manager.does_section_result_exist(user_id, job_id, section_doc_id):
        log_msg = f"{log_prefix} Result already exists. Skipping."
        print(f"      [green]L {log_msg}[/green]")
        existing_data = db_manager.get_section_result(user_id, job_id, section_doc_id)
        return {"status": "skipped", "full_analysis": existing_data, "cost_metrics": {}}

    content_for_llm = "\n".join(
        [f"{utterance['speaker_id']}: {utterance['text']}" for utterance in section]
    )

    # --- THIS IS THE CORRECTED LOGIC ---
    enrichment_result = await enrich_section_with_analysis(
        section_content=content_for_llm,
        runnable_config=runnable_config,
        job_config=config,
        user_id=user_id,
        job_id=job_id,
        section_index=section_index,
        persona=persona,
    )

    analysis_data = enrichment_result.get("analysis_data", {})
    section_cost_metrics = enrichment_result.get("cost_metrics", {})

    if not analysis_data:
        return {"status": "skipped_no_data", "index": section_index, "cost_metrics": {}}

    # This call gets costs for ENTITY lookups
    context_result = await get_context_for_entities(
        entities=analysis_data.get("key_entities", []),
        transcript_context=content_for_llm,
        user_id=user_id,
        job_id=job_id,
        section_index=section_index,
    )

    # Combine the costs from entity lookups and briefing lookups
    entity_costs = context_result.get("cost_metrics", {})
    for key, value in entity_costs.items():
        section_cost_metrics[key] = section_cost_metrics.get(key, 0) + value

    key_entities_list = analysis_data.get("key_entities", [])
    explanations_map = context_result.get("explanations", {})

    # Build the new, clean array of objects
    entities_array = []
    for entity_name in key_entities_list:
        entities_array.append(
            {
                "name": entity_name,
                "explanation": explanations_map.get(
                    entity_name, "No explanation found."
                ),
            }
        )

    # Remove the old, redundant key from the main analysis data
    analysis_data.pop("key_entities", None)

    # Assemble the final result with the new 'entities' array
    section_result = {
        "start_time": start_time_str,
        "end_time": end_time_str,
        **analysis_data,
        "entities": entities_array,  # Use the new, clean array
    }

    db_manager.save_section_result(user_id, job_id, section_index, section_result)
    db_manager.log_progress(
        user_id, job_id, f"✓ Section {section_index + 1}: Analysis complete and saved."
    )

    # Return the final analysis AND the COMBINED cost metrics
    return {
        "status": "processed",
        "full_analysis": section_result,
        "cost_metrics": section_cost_metrics,
    }


async def perform_meta_synthesis(
    all_sections_analysis: List[Dict], runnable_config: RunnableConfig
) -> Dict:
    """
    Performs a "Pass 2" meta-analysis on the combined results of the initial section-by-section extraction.
    This function identifies overarching themes, contradictions, and a narrative arc across the entire document.

    Args:
        all_sections_analysis: A list of the result dictionaries from each section's analysis.
        runnable_config: The LangChain runnable configuration for tracking.

    Returns:
        A dictionary containing the high-level synthesized insights.
    """
    print(
        Panel(
            "[bold magenta]🧠 Meta-Synthesis Initiated[/bold magenta]\n"
            "   - Analyzing connections across all document sections...",
            title="[bold]Pass 2: Synthesis[/bold]",
            border_style="magenta",
            expand=False,
        )
    )

    # Consolidate the analysis from all sections into a single, clean context for the LLM
    # We use JSON to maintain the structure, which is more robust than simple text.
    consolidated_context = json.dumps(all_sections_analysis, indent=2)

    llm, llm_options = clients.get_llm("best-lite", temperature=0.3)
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a Partner-level strategic analyst at a top-tier consulting firm. You have been provided with a structured JSON object containing a detailed, section-by-section analysis of a client interview or document. Your task is to perform a meta-analysis to synthesize high-level strategic insights that span across the entire document. Do not simply summarize the sections; your job is to find the hidden connections between them.

Your output must be a JSON object with the following keys:
- 'overarching_themes': A list of 2-4 of the most critical, high-level strategic themes that are present throughout the document.
- 'narrative_arc': A brief paragraph describing the core story of the document. Identify the central conflict (the primary business problem), the cascading effects of this problem, the key turning point or insight, and the ultimate strategic choice or opportunity presented.
- 'key_contradictions': A list of objects, where each object highlights a significant contradiction or tension found between different sections of the document. Each object should have 'point_a', 'point_b', and 'analysis' keys.
- 'unifying_insights': A list of 2-3 novel insights that can only be understood by looking at the document as a whole, not from any single section.
{format_instructions}""",
            ),
            (
                "human",
                """Based on the following consolidated section-by-section analysis, please perform your meta-analysis and provide the synthesized insights.

--- CONSOLIDATED ANALYSIS (JSON) ---
{consolidated_analysis}
--- END CONSOLIDATED ANALYSIS ---""",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        synthesis_results = await chain.ainvoke(
            {
                "consolidated_analysis": consolidated_context,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        print(
            "[green]✓ Meta-Synthesis complete. High-level insights generated.[/green]"
        )
        return synthesis_results
    except Exception as e:
        print(
            f"[bold red]Error during meta-synthesis: {e}. Returning an empty synthesis object.[/bold red]"
        )
        return {}


async def generate_intermediate_summary(
    analysis_chunk: List[Dict], runnable_config: RunnableConfig
) -> Dict:
    """
    Takes a chunk of 3-5 detailed section analyses and synthesizes them
    into a single, higher-level summary object. This is the "Reduce L1" step.
    """
    print(
        f"  - [magenta]Generating intermediate summary for a chunk of {len(analysis_chunk)} sections...[/magenta]"
    )

    # Consolidate the chunk of analyses into a JSON string for the prompt
    consolidated_chunk_context = json.dumps(analysis_chunk, indent=2)

    llm, llm_options = clients.get_llm("best-lite", temperature=0.1)
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert analyst. You will be given a JSON object containing the analysis of a few consecutive sections from a larger document. 
Your task is to synthesize these sections into a single, concise summary object.

Based ONLY on the provided JSON context, you must extract the following:
- 'main_thesis': A single sentence stating the central argument of THIS CHUNK.
- 'supporting_arguments': A list of the key points used to build the case within THIS CHUNK.
- 'counterarguments_mentioned': A list of opposing viewpoints mentioned within THIS CHUNK.

Your output must be a single, valid JSON object.
{format_instructions}""",
            ),
            (
                "human",
                """Please analyze the following consolidated analysis chunk and extract the required information.

--- ANALYSIS CHUNK (JSON) ---
{chunk_context}
--- END ANALYSIS CHUNK ---""",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        summary_result = await chain.ainvoke(
            {
                "chunk_context": consolidated_chunk_context,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        return summary_result
    except Exception as e:
        print(
            f"[bold red]Error generating intermediate summary for chunk: {e}. Skipping chunk.[/bold red]"
        )
        return {}


async def generate_argument_structure(
    # MODIFICATION 1: Change the input from raw text to the list of section analyses.
    all_sections_analysis: List[Dict],
    runnable_config: RunnableConfig,
) -> Dict:
    """
    Performs a "Pass 2" analysis on the COMBINED SECTION ANALYSES to deconstruct
    its logical structure for a general audience.
    """
    print(
        Panel(
            "[bold cyan]🏛️ Argument Structure Analysis Initiated[/bold cyan]\n"
            "  - Deconstructing the document's logical framework...",
            title="[bold]Pass 2: Argument Structure[/bold]",
            border_style="cyan",
            expand=False,
        )
    )

    # MODIFICATION 2: Convert the structured analysis data to a JSON string.
    # This is more robust and memory-friendly than joining raw text.
    consolidated_context = json.dumps(all_sections_analysis, indent=2)

    llm, llm_options = clients.get_llm("best-lite", temperature=0.1)
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                # MODIFICATION 3: Update the prompt to tell the LLM it's receiving a JSON analysis, not raw text.
                """You are an expert in rhetoric and logical analysis. You have been given a structured JSON containing a section-by-section analysis of a document. Your task is to deconstruct the core argument of the original document based on this analysis. Identify the primary thesis, supporting points, and any counterarguments.

Your output must be a JSON object with the following keys:
- 'main_thesis': A single, clear sentence stating the central argument or primary message of the entire text.
- 'supporting_arguments': A list of 3-5 strings, where each string is a key point or piece of evidence the author uses to build their case.
- 'counterarguments_mentioned': A list of strings for any opposing viewpoints or counterarguments the author discusses in the text. If none are mentioned, return an empty list.
{format_instructions}""",
            ),
            (
                "human",
                """Please analyze the following consolidated analysis and extract the original document's argument structure.

--- CONSOLIDATED ANALYSIS (JSON) ---
{structured_analysis}
--- END ANALYSIS ---""",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        argument_results = await chain.ainvoke(
            {
                # MODIFICATION 4: Pass the consolidated JSON context to the prompt.
                "structured_analysis": consolidated_context,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
        print("[green]✓ Argument structure analysis complete.[/green]")
        return argument_results
    except Exception as e:
        print(
            f"[bold red]Error during argument structure generation: {e}. Returning an empty object.[/bold red]"
        )
        return {}


def get_dynamic_section_duration(total_duration_seconds: int) -> int:
    """
    Calculates the ideal section duration to create between 3 and 10 sections.
    """
    if total_duration_seconds < 900:  # If content is under 15 minutes
        return total_duration_seconds + 1

    min_sections = 3
    max_sections = 10
    scale_start_duration = 1800  # 30 minutes
    scale_end_duration = 7200  # 2 hours

    target_sections: float
    if total_duration_seconds <= scale_start_duration:
        target_sections = float(min_sections)
    elif total_duration_seconds >= scale_end_duration:
        target_sections = float(max_sections)
    else:
        progress = (total_duration_seconds - scale_start_duration) / (
            scale_end_duration - scale_start_duration
        )
        target_sections = min_sections + progress * (max_sections - min_sections)

    # --- THE FIX ---
    # Use ceiling to slightly overestimate, preventing a tiny leftover section.
    return math.ceil(total_duration_seconds / target_sections)


def create_sections_by_duration(
    canonical_transcript: List[Dict], target_duration: int
) -> List[List[Dict]]:
    """
    Splits a canonical transcript into sections of a minimum target duration
    with intelligent merging for the final section.
    """
    print(
        f"[cyan]🚀 Activating time-based segmentation ({target_duration}s/section)...[/cyan]"
    )
    if not canonical_transcript:
        return []

    sections = []
    current_section = []

    for utterance in canonical_transcript:
        current_section.append(utterance)
        section_start_time = current_section[0]["start_seconds"]
        section_end_time = current_section[-1]["end_seconds"]
        current_duration = section_end_time - section_start_time

        if current_duration >= target_duration:
            sections.append(current_section)
            current_section = []

    # --- THE SMARTER MERGING FIX ---
    if current_section:
        # Calculate the duration of the final, leftover section
        final_section_duration = (
            current_section[-1]["end_seconds"] - current_section[0]["start_seconds"]
        )

        # If the last section is very short (e.g., < 50% of target), merge it backward
        if sections and final_section_duration < (target_duration * 0.5):
            print(
                f"[yellow]Final section is very short ({final_section_duration}s). Merging with previous section...[/yellow]"
            )
            sections[-1].extend(current_section)
        else:
            sections.append(current_section)
    # --- END FIX ---

    if not sections:
        return [canonical_transcript]

    print(
        f"[green]✓ Transcript successfully split into {len(sections)} time-based sections.[/green]"
    )
    return sections


async def run_full_analysis(user_id: str, job_id: str, persona: str):
    """
    The main worker function, fully implemented with the robust two-pass
    Preprocessing -> Extraction -> Synthesis pipeline, driven by the specified analysis persona.
    """

    total_start_time = time.monotonic()
    timing_metrics = {}
    storage_path = None
    final_cost_metrics = {"tavily_searches": 0, "assemblyai_audio_seconds": 0}

    # Get the configuration for the specified persona, defaulting to 'general'
    persona_cfg = PERSONA_CONFIG.get(persona, PERSONA_CONFIG["general"])

    print(
        Panel(
            f"[bold cyan]🚀 Starting Full Analysis for Job ID:[/bold cyan]\n[white]{job_id}[/white]\n[bold]Persona:[/bold] [yellow]{persona}[/yellow]",
            border_style="cyan",
            expand=False,
        )
    )
    db_manager.log_progress(
        user_id, job_id, f"Analysis initiated with '{persona}' persona..."
    )

    try:
        # Step 1: Get Job Status and Basic Setup
        job_doc = db_manager.get_job_status(user_id, job_id)
        if not job_doc:
            raise ValueError(f"Job {job_id} not found for user {user_id}.")

        if job_doc.get("status") != "QUEUED":
            print(
                f"[bold yellow]LOG: Job has status '{job_doc.get('status')}'. Skipping duplicate execution.[/bold yellow]"
            )
            return

        db_manager.update_job_status(
            user_id, job_id, "PROCESSING", "Step 2/7: Preparing transcript..."
        )
        request_data = job_doc.get("request_data", {})
        config = request_data.get("config", {})
        transcript_id = request_data.get("transcript_id")
        storage_path = request_data.get("storagePath")
        raw_transcript_text = request_data.get("transcript")
        transcription_result = None
        canonical_transcript = []

        # Step 2: Input Acquisition & Normalization
        storage_path = request_data.get("storagePath")
        transcription_result = (
            None  # Will hold the full AssemblyAI result if applicable
        )

        if transcript_id:
            print(
                f"INFO:     Job {job_id} is a YouTube job. Fetching cached transcript..."
            )
            db_manager.log_progress(
                user_id, job_id, "Fetching cached YouTube transcript..."
            )

            # --- START: MODIFIED LOGIC ---
            cached_data = db_manager.get_cached_transcript(transcript_id)

            if not cached_data:
                raise ValueError(
                    f"Cached transcript for ID {transcript_id} not found or expired."
                )

            raw_youtube_transcript = cached_data.get("structured_transcript")

            if isinstance(raw_youtube_transcript, list):
                # This is the new path for structured transcripts
                canonical_transcript = normalize_youtube_transcript(
                    raw_youtube_transcript
                )
            elif isinstance(raw_youtube_transcript, str):
                # This is the fallback for plain text transcripts
                canonical_transcript = await preprocess_and_normalize_transcript(
                    raw_youtube_transcript
                )
            else:
                raise ValueError(
                    f"Cached transcript for ID {transcript_id} has an invalid format."
                )
            # --- END: MODIFIED LOGIC ---

        elif storage_path:
            db_manager.update_job_status(
                user_id, job_id, "PROCESSING", "Step 2/7: Transcribing audio file..."
            )
            # This call now returns the full result dictionary from AssemblyAI
            transcription_result = await transcribe_audio_from_gcs(
                storage_path,
                user_id,
                job_id,
                request_data.get("model_choice", "universal"),
            )

            if transcription_result:
                audio_duration_seconds = transcription_result.get("audio_duration")
                if audio_duration_seconds:
                    final_cost_metrics["assemblyai_audio_seconds"] = (
                        audio_duration_seconds
                    )

            # Gracefully handle if transcription failed or returned an unexpected format
            utterances = transcription_result.get("utterances", [])
            if not utterances and transcription_result.get("text"):
                # Fallback for non-diarized transcripts
                utterances = [
                    {
                        "text": transcription_result.get("text", ""),
                        "start": 0,
                        "end": transcription_result.get("audio_duration", 0) * 1000,
                    }
                ]

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

            # Un-escape newline characters for proper parsing
            corrected_text = raw_transcript_text.replace("\\n", "\n")

            # Pass the corrected text to the robust parser
            canonical_transcript = await preprocess_and_normalize_transcript(
                corrected_text
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

        # --- REFACTORED SECTION START ---

        # Step 3: Segment Transcript
        db_manager.log_progress(user_id, job_id, "Step 4/7: Segmenting transcript...")
        start_segmentation = time.monotonic()
        token_tracker = cost_tracking.TokenCostCallbackHandler(user_id, job_id)
        runnable_config = RunnableConfig(callbacks=[token_tracker])

        sections = []
        num_sections = 0

        # This check is for audio files that result in one long monologue
        is_long_single_utterance = (
            storage_path
            and transcription_result.get("words")
            and len(canonical_transcript) == 1
            and len(canonical_transcript[0].get("text", "").split()) > 150
        )

        # This check is for any transcript that has valid timestamps
        has_timestamps = (
            canonical_transcript and canonical_transcript[-1].get("end_seconds", 0) > 0
        )

        if is_long_single_utterance:
            print(
                "[cyan]Long monologue detected. Using high-precision word-level segmentation...[/cyan]"
            )
            sections = segment_monologue_with_word_timestamps(
                transcription_result["words"], words_per_section=750
            )
            num_sections = len(sections)

        elif has_timestamps:
            print(
                "[cyan]Timestamped transcript detected. Using dynamic time-based segmentation...[/cyan]"
            )
            total_duration_seconds = canonical_transcript[-1]["end_seconds"]

            dynamic_min_duration = get_dynamic_section_duration(total_duration_seconds)

            print(
                f"  -> Content length is ~{total_duration_seconds // 60} minutes. Using target section size of ~{dynamic_min_duration // 60} minutes."
            )

            # 2. Create sections directly from the duration. NO AI is called.
            sections = create_sections_by_duration(
                canonical_transcript, dynamic_min_duration
            )
            num_sections = len(sections)

        else:
            # This correctly handles the PLAIN TEXT case
            print(
                "[cyan]Plain text detected. Using dynamic word-count segmentation...[/cyan]"
            )

            full_text = " ".join([utt.get("text", "") for utt in canonical_transcript])
            total_chars = len(full_text)

            words_per_section = _get_dynamic_words_per_section(total_chars)

            sections = segment_by_word_count(
                full_text, words_per_section=words_per_section
            )
            num_sections = len(sections)

        sections = [s for s in sections if s]  # Clean out any empty sections

        timing_metrics["segmentation_s"] = time.monotonic() - start_segmentation
        db_manager.log_progress(
            user_id,
            job_id,
            f"✓ Transcript segmented into {num_sections} substantive sections.",
        )
        # Step 4 (Pass 1): Analyze Sections in Parallel for Extraction
        log_msg = f"Step 5/7: Analyzing {num_sections} section{'s' if num_sections != 1 else ''} in parallel..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        db_manager.update_job_status(user_id, job_id, "PROCESSING", log_msg)

        semaphore = asyncio.Semaphore(5)

        async def process_with_semaphore(section, i):
            """Wrapper to acquire semaphore before running the task."""
            async with semaphore:
                return await _process_single_section(
                    section=section,
                    section_index=i,
                    user_id=user_id,
                    job_id=job_id,
                    config=config,
                    runnable_config=runnable_config,
                    full_canonical_transcript=canonical_transcript,
                    persona=persona,
                )

        start_section_analysis = time.monotonic()
        analysis_tasks = [
            process_with_semaphore(section, i) for i, section in enumerate(sections)
        ]
        section_processing_results = await asyncio.gather(*analysis_tasks)
        for res in section_processing_results:
            if res and res.get("cost_metrics"):
                for key, value in res["cost_metrics"].items():
                    final_cost_metrics[key] = final_cost_metrics.get(key, 0) + value

        all_section_analyses = [
            res["full_analysis"]
            for res in section_processing_results
            if res and res.get("full_analysis")
        ]
        timing_metrics["section_analysis_s"] = time.monotonic() - start_section_analysis

        # Step 4.5 (Pass 2): Perform Meta-Synthesis Across All Sections
        synthesis_results = {}
        argument_structure_results = {}
        pass_2_data = {}

        if all_section_analyses:
            # For the consultant, run the deep synthesis
            if persona == "consultant":
                start_synthesis = time.monotonic()
                synthesis_results = await perform_meta_synthesis(
                    all_section_analyses, runnable_config
                )
                timing_metrics["synthesis_pass_s"] = time.monotonic() - start_synthesis
                db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                    job_id
                ).update({"synthesis_results": synthesis_results})
                db_manager.log_progress(
                    user_id, job_id, "✓ High-level synthesis pass complete."
                )
                pass_2_data = synthesis_results

            # For the general user, run the argument structure analysis
            elif persona == "general":
                start_argument_analysis = time.monotonic()
                # Consolidate the text from all sections for this analysis

                print(
                    Panel(
                        "[bold cyan]🧠 Initiating Map-Reduce for Argument Structure[/bold cyan]\n  1. (Map) Summarize section chunks in parallel.\n  2. (Reduce) Synthesize summaries into final argument.",
                        title="[bold]Pass 2: Map-Reduce[/bold]",
                        border_style="cyan",
                        expand=False,
                    )
                )

                chunk_size = 5  # Process 5 section analyses at a time
                analysis_chunks = [
                    all_section_analyses[i : i + chunk_size]
                    for i in range(0, len(all_section_analyses), chunk_size)
                ]
                print(
                    f"[cyan]Pass 2: Grouped {len(all_section_analyses)} section analyses into {len(analysis_chunks)} chunks.[/cyan]"
                )

                # 2. Process chunks in parallel to get intermediate summaries
                summary_tasks = [
                    generate_intermediate_summary(chunk, runnable_config)
                    for chunk in analysis_chunks
                ]
                intermediate_summaries = await asyncio.gather(*summary_tasks)

                # Filter out any chunks that may have failed
                valid_summaries = [s for s in intermediate_summaries if s]

                print(
                    f"  [green]✓ Phase 1 (Map) Complete: Generated {len(valid_summaries)} intermediate summaries.[/green]"
                )

                # 3. Perform the final synthesis on the intermediate summaries
                if valid_summaries:
                    argument_structure_results = await generate_argument_structure(
                        valid_summaries,
                        runnable_config,  # Pass the SUMMARIES, not the original analyses
                    )
                else:
                    print(
                        "[bold red]Argument analysis skipped: No valid intermediate summaries were generated.[/bold red]"
                    )
                    argument_structure_results = {}

                timing_metrics["argument_analysis_s"] = (
                    time.monotonic() - start_argument_analysis
                )

                db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                    job_id
                ).update({"argument_structure": argument_structure_results})

                pass_2_data = argument_structure_results

        if config.get("run_contextual_briefing") and all_section_analyses:
            log_msg = "Step 5b: Generating Global Contextual Briefing..."
            print(f"[magenta]\n{log_msg}[/magenta]")
            db_manager.log_progress(user_id, job_id, log_msg)
            start_briefing_time = time.monotonic()

            # 1. Aggregate all claims from all sections
            all_claims = [
                claim
                for analysis in all_section_analyses
                if analysis.get("verifiable_claims")
                for claim in analysis["verifiable_claims"]
            ]

            if all_claims:
                # 2. Select the best overall claim using Pass 2 data as context
                best_overall_claim = await _select_best_claim_for_global_briefing(
                    all_claims, pass_2_data, runnable_config
                )

                # 3. Generate the single, global briefing if a claim was found
                if best_overall_claim:
                    # We need the full text for the briefing's context
                    full_text_content = "\n\n".join(
                        "\n".join(
                            f"{utt['speaker_id']}: {utt['text']}" for utt in section
                        )
                        for section in sections
                    )

                    # Using section_index=-1 as a sentinel for a global briefing
                    briefing_result_wrapper = await generate_contextual_briefing(
                        claim_text=best_overall_claim,
                        context=full_text_content,
                        user_id=user_id,
                        job_id=job_id,
                        section_index=-1,  # Indicates a global briefing
                    )

                    global_briefing_data = briefing_result_wrapper.get("briefing", {})
                    briefing_costs = briefing_result_wrapper.get("cost_metrics", {})

                    # 4. Save the result and update costs
                    if global_briefing_data:
                        briefing_payload = {
                            "claim_text": best_overall_claim,
                            "briefing_data": global_briefing_data,
                        }

                    # Save the new payload
                    db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                        job_id
                    ).update({"global_contextual_briefing": briefing_payload})
                    for key, value in briefing_costs.items():
                        final_cost_metrics[key] = final_cost_metrics.get(key, 0) + value

                    db_manager.log_progress(
                        user_id, job_id, "✓ Global contextual briefing generated."
                    )
                    timing_metrics["global_briefing_s"] = (
                        time.monotonic() - start_briefing_time
                    )

        # Update Job Title based on first section's analysis
        final_job_title = await generate_final_title(pass_2_data, runnable_config)
        db_manager.update_job_title(user_id, job_id, final_job_title)
        db_manager.log_progress(
            user_id, job_id, "✓ Final title generated from holistic analysis."
        )

        # Step 5: Generate Final Content Assets using Synthesis Results
        log_msg = "Step 6/7: Generating final content assets..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        db_manager.update_job_status(user_id, job_id, "PROCESSING", log_msg)
        start_final_content = time.monotonic()

        if "slide_deck" in persona_cfg["final_assets"] and config.get(
            "run_slide_deck_generation", True
        ):
            slide_deck = await generate_slide_deck_outline(
                all_section_analyses, synthesis_results, runnable_config
            )
            db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                job_id
            ).update({"generated_slide_outline": slide_deck})
            db_manager.log_progress(
                user_id, job_id, "✓ Client slide deck outline generated and saved."
            )

        if "blog_post" in persona_cfg["final_assets"] and config.get(
            "run_blog_post_generation"
        ):
            blog_post = await generate_blog_post(all_section_analyses, runnable_config)
            db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                job_id
            ).update({"generated_blog_post": blog_post})
            db_manager.log_progress(user_id, job_id, "✓ Blog post generated and saved.")

        if "x_thread" in persona_cfg["final_assets"] and config.get(
            "run_x_thread_generation"
        ):
            x_thread = await generate_x_thread(all_section_analyses, runnable_config)
            db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                job_id
            ).update({"generated_overall_x_thread": x_thread})
            db_manager.log_progress(
                user_id, job_id, "✓ Overall X-thread generated and saved."
            )

        if "linkedin_post" in persona_cfg["final_assets"] and config.get(
            "run_linkedin_post_generation"
        ):
            linkedin_post = await generate_linkedin_post(
                all_section_analyses, runnable_config
            )
            db_manager.db.collection(f"saas_users/{user_id}/jobs").document(
                job_id
            ).update({"generated_linkedin_post": linkedin_post})
            db_manager.log_progress(
                user_id, job_id, "✓ LinkedIn post generated and saved."
            )

        timing_metrics["final_content_generation_s"] = (
            time.monotonic() - start_final_content
        )

        # Step 7: Finalize and Log All Metrics for Analytics
        log_msg = "Step 7/7: Finalizing results and logging analytics..."
        print(f"[magenta]\n{log_msg}[/magenta]")
        db_manager.update_job_status(user_id, job_id, "PROCESSING", log_msg)

        # --- Calculate Final Metrics ---
        start_finalization = time.monotonic()

        # Calculate final timing first, so you can include it in the record
        timing_metrics["finalization_s"] = time.monotonic() - start_finalization
        timing_metrics["total_job_s"] = time.monotonic() - total_start_time

        final_llm_metrics = token_tracker.get_metrics()
        internal_cost_usd = (
            (final_llm_metrics.get("llm_input_tokens", 0) * 0.0000003)
            + (final_llm_metrics.get("llm_output_tokens", 0) * 0.0000006)
            + (final_cost_metrics.get("tavily_searches", 0) * 0.008)
            + (final_cost_metrics.get("assemblyai_audio_seconds", 0) * 0.0003)
        )

        usage_record_data = {
            "userId": user_id,
            "jobId": job_id,
            "type": "audio" if storage_path else "text",
            "persona": persona,
            "internalCostUSD": round(internal_cost_usd, 6),
            "totalCompletionSeconds": round(timing_metrics["total_job_s"], 2),
            "inputDurationSeconds": request_data.get("duration_seconds", 0),
            "timingBreakdownSeconds": {
                key.replace("_s", ""): round(value, 2)
                for key, value in timing_metrics.items()
                if key != "total_job_s"  # Avoid duplicating the total
            },
            "breakdown": {
                "llm_input_tokens": final_llm_metrics.get("llm_input_tokens", 0),
                "llm_output_tokens": final_llm_metrics.get("llm_output_tokens", 0),
                "total_llm_requests": final_llm_metrics.get("llm_calls", 0),
                "assemblyai_seconds": final_cost_metrics.get(
                    "assemblyai_audio_seconds", 0
                ),
                "tavily_searches": final_cost_metrics.get("tavily_searches", 0),
            },
        }

        # Save the single, consolidated analytics record
        db_manager.create_usage_record(user_id, job_id, usage_record_data)

        # --- Finalize Job Status ---
        db_manager.update_job_status(
            user_id,
            job_id,
            "COMPLETED",
            f"Analysis of {num_sections} sections complete.",
        )
        db_manager.create_notification(user_id, job_id, final_job_title)
        db_manager.log_progress(user_id, job_id, "✅ Analysis Complete.")

        print(
            Panel(
                "\n".join(
                    [
                        f"  - {key.replace('_s', '').replace('_', ' ').capitalize():<30}: {value:.2f}s"
                        for key, value in timing_metrics.items()
                        if key != "total_job_s"
                    ]
                    + [
                        "-" * 40,
                        f"  - {'Total job time':<30}: {timing_metrics.get('total_job_s', 0):.2f}s",
                    ]
                ),
                title="[bold yellow]⏱️ Performance Metrics[/bold yellow]",
                border_style="yellow",
                expand=False,
            )
        )

        print(
            Panel(
                "\n".join(
                    [
                        f"  - {'LLM Input Tokens':<30}: {final_llm_metrics.get('llm_input_tokens', 0):,}",
                        f"  - {'LLM Output Tokens':<30}: {final_llm_metrics.get('llm_output_tokens', 0):,}",
                        f"  - {'Total LLM Requests':<30}: {final_llm_metrics.get('llm_calls', 0)}",
                        f"  - {'Tavily Searches':<30}: {final_cost_metrics.get('tavily_searches', 0)}",
                        f"  - {'AssemblyAI Audio':<30}: {final_cost_metrics.get('assemblyai_audio_seconds', 0):.2f}s",
                        "-" * 40,
                        f"  - {'Estimated Internal Cost':<30}: ${internal_cost_usd:.6f}",
                    ]
                ),
                title="[bold green]💰 Cost & Usage Metrics[/bold green]",
                border_style="green",
                expand=False,
            )
        )

        # --- Simplified final logging ---
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

        print(f"[yellow]Issuing refund for job {job_id}...[/yellow]")
        db_manager.refund_analysis_credit(user_id)

    finally:
        if storage_path:
            print(f"[cyan]Job processing finished. Cleaning up source file...[/cyan]")
            db_manager.delete_gcs_file(storage_path)
