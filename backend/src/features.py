# src/features.py

import os
import json
import asyncio
from typing import List, Dict, Any
from functools import wraps
import time
import random

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig
from google.api_core.exceptions import ResourceExhausted
from tavily import TavilyClient
from rich import print

from src import clients


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


@retry_with_exponential_backoff
async def generate_contextual_briefing(
    claim_text: str,
    context: str,
    user_id: str,
    job_id: str,
    section_index: int,
) -> Dict:
    """
    Generates a multi-angle briefing for a specific claim by performing parallel
    web searches and synthesizing the results.
    NOW RETURNS COST METRICS.
    """
    if section_index == -1:
        log_prefix = "             - [Global Briefing]"
        print(
            f"{log_prefix} [bold purple]Starting 'Global Context & Perspectives Engine'...[/bold purple]"
        )
    else:
        log_prefix = f"                 - [Section {section_index + 1}]"
        print(
            f"{log_prefix} [bold purple]Starting 'Context & Perspectives Engine'...[/bold purple]"
        )

    llm, llm_options = clients.get_llm("best-lite", temperature=0.0)
    parser = JsonOutputParser()

    print(f"{log_prefix}   - Generating diverse queries for: '{claim_text[:60]}...'")
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
            f"{log_prefix}   - [red]Failed to generate valid search queries: {e}. Using raw claim as a fallback.[/red]"
        )
        search_queries = [claim_text]

    print(
        f"{log_prefix}   - Searching Tavily with {len(search_queries)} queries in parallel..."
    )
    all_search_results = []

    # --- START OF CORRECTION 1 ---
    num_searches_performed = 0
    # --- END OF CORRECTION 1 ---

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

        # --- START OF CORRECTION 2 ---
        num_searches_performed = len(search_tasks)
        # --- END OF CORRECTION 2 ---

        search_results_list = await asyncio.gather(*search_tasks)

        for result_group in search_results_list:
            all_search_results.extend(result_group.get("results", []))
            # THE ERRONEOUS LINE BELOW HAS BEEN DELETED

        unique_results = list(
            {result["url"]: result for result in all_search_results}.values()
        )

    except Exception as e:
        print(
            f"{log_prefix}  - [red]An error occurred during web search fallback: {e}[/red]"
        )
        return {
            "briefing": {"error": "SearchExecutionFailed", "details": str(e)},
            "cost_metrics": {"tavily_searches": num_searches_performed},
        }

    if not unique_results:
        return {
            "briefing": {
                "error": "NoSearchResults",
                "details": "Web search returned no results for the generated queries.",
            },
            "cost_metrics": {"tavily_searches": num_searches_performed},
        }

    print(
        f"{log_prefix}   - Synthesizing briefing from {len(unique_results)} unique sources..."
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
        # --- START OF CORRECTION 3 ---
        return {
            "briefing": briefing,
            "cost_metrics": {"tavily_searches": num_searches_performed},
        }
        # --- END OF CORRECTION 3 ---

    except Exception as e:
        print(f"{log_prefix}   - [red]Error during briefing synthesis: {e}[/red]")
        return {
            "briefing": {"error": "SynthesisFailed", "details": str(e)},
            "cost_metrics": {"tavily_searches": num_searches_performed},
        }


@retry_with_exponential_backoff
async def generate_x_thread(
    all_sections_analysis: List[Dict],
    runnable_config: RunnableConfig,
) -> List[str]:
    """
    Generates a world-class X-thread from the analysis, engineered for
    engagement and virality based on a strategic playbook.
    """
    print("        - [blue]Generating World-Class X (Twitter) Thread...[/blue]")

    # Context building remains the same
    full_context = ""
    for i, section in enumerate(all_sections_analysis):
        title = section.get("generated_title", f"Section {i+1}")
        # Taking top 3 summary points per section to keep context manageable
        summary_points = section.get("summary_points", [])[:3]
        full_context += f"## {title}\n"
        for point in summary_points:
            full_context += f"- {point}\n"
        full_context += "\n"

    llm, llm_options = clients.get_llm("best-lite", temperature=0.5)
    # The JsonOutputParser is perfect for our needs.
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                # --- THIS IS THE CRITICAL IMPROVEMENT ---
                # The new prompt directly encodes the principles from your new research plan.
                """You are an expert content engineer specializing in creating viral threads on X (formerly Twitter). Your task is to transform the provided analysis into a single, cohesive, world-class thread designed for maximum engagement.

Your output MUST be a JSON object with a single key, 'thread', which contains a list of strings. Each string is a single tweet.

**WORLD-CLASS THREAD DIRECTIVES:**

1.  **THE HOOK (First Tweet):** This is the most critical tweet. It must be engineered to stop the scroll.
    * **Choose a Hook Archetype:** Select an appropriate formula (e.g., Problem-Solving, Storytelling, Controversial, List-Based, Authority-Building).
    * **Create a Curiosity Gap:** It must promise value and create an information gap without giving everything away.
    * **Signal a Thread:** Start or end the hook with "🧵" or "1/".

2.  **NARRATIVE & FLOW:**
    * **Cohesive Arc:** Structure the thread with a clear beginning, middle, and end (e.g., using Problem-Agitation-Solution or a chronological deep dive). Do not just list facts.
    * **Progressive Disclosure:** Each tweet must build on the last, revealing information layer by layer. One core idea per tweet.
    * **Dynamic Pacing:** Vary the tweet length. Use short, punchy one-liners for emphasis and slightly longer tweets for context.

3.  **FORMATTING & STYLE:**
    * **Readability:** Use ample whitespace and line breaks to make tweets scannable.
    * **Visual Anchors:** Use emojis sparingly to add personality and break up text. Use numbered or bulleted lists (using • or -) for clarity.
    * **Shareable Nuggets:** Craft at least one tweet in the middle of the thread to be a self-contained, shareable nugget of wisdom.

4.  **ENGAGEMENT MECHANICS:**
    * **Embedded Question:** Include one open-ended, thought-provoking question mid-thread to drive replies and conversation.
    * **Pattern Interrupt:** If appropriate, include an unexpected element like a sudden shift in tone or a personal aside to re-engage the reader.

5.  **THE CLOSER (Final Tweet):**
    * **Summarize & Close Loop:** Provide a concise "TL;DR" summary of the thread's core message and tie it back to the promise made in the hook.
    * **Compelling CTA:** End with a clear, specific Call to Action. Ask a question, encourage a retweet, or prompt a follow.
    * **Hashtags:** Include 2-3 relevant hashtags at the very end.

{format_instructions}
""",
            ),
            (
                "human",
                "Based on the following document analysis, create an engaging, world-class X thread using the principles of content engineering.\n\n"
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


@retry_with_exponential_backoff
async def generate_blog_post(
    all_sections_analysis: List[Dict],
    runnable_config: RunnableConfig,
) -> Dict[str, Any]:
    """
    Generates a world-class blog post from the analysis as a structured JSON object,
    based on a comprehensive content strategy blueprint.
    """
    print("        - [blue]Generating World-Class Blog Post Draft...[/blue]")

    # Context building remains the same
    full_context = ""
    for i, section in enumerate(all_sections_analysis):
        title = section.get("generated_title") or section.get(
            "section_title", f"Section {i+1}"
        )
        summary_list = (
            section.get("summary_points")
            or section.get("client_pain_points")
            or section.get("strategic_opportunities", [])
        )
        summary = "\n".join([f"- {point}" for point in summary_list])
        full_context += f"## {title}\n\n{summary}\n\n"

    llm, llm_options = clients.get_llm("best-lite", temperature=0.4)
    # The JsonOutputParser is perfect for our needs.
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert content strategist...

**JSON CONTENT BLOCK SCHEMA:**
Each block object in the 'content' array must have a 'type' key. Supported types are:
- 'heading': `{{ "type": "heading", "level": 2 | 3, "text": "..." }}`
- 'paragraph': `{{ "type": "paragraph", "text": "..." }}`
- 'list': `{{ "type": "list", "style": "unordered" | "ordered", "items": ["...", "..."] }}`
- 'quote': `{{ "type": "quote", "text": "A powerful, citable quote.", "author": "Source/Expert" }}`
- 'visual_suggestion': `{{ "type": "visual_suggestion", "description": "..." }}`
- 'cta': `{{ "type": "cta", "text": "..." }}`

**WORLD-CLASS CONTENT DIRECTIVES:**
1.  **Strategic Goal:** This post must be the definitive resource on the topic. It should aim to build trust and solve a real problem, not just attract clicks.
2.  **Headline & Intro:** The main `title` must be intriguing and benefit-driven. The first one or two paragraphs must hook the reader using a formula like PAS (Problem-Agitate-Solution) or by creating a strong information gap.
3.  **Tone & Readability:** Adopt an authentic, authoritative, yet conversational tone. **Crucially, use short paragraphs (2-3 sentences max).** Bold key phrases to make the content highly scannable.
4.  **Depth & Originality:** Weave the analysis points into a comprehensive and persuasive narrative. Don't just list facts. Provide actionable advice and unique perspectives.
5.  **Structure & Flow:** Use the section titles from the analysis as H2 headings. Guide the reader logically from introduction to conclusion.
6.  **Visuals as Assets:** Proactively insert `visual_suggestion` blocks where a custom graphic, chart, or annotated screenshot would enhance comprehension or act as a "citation magnet" to attract backlinks. Do NOT suggest generic stock photos.
7.  **Engagement & CTA:** Conclude with a strong summary paragraph followed by a specific, compelling `cta` block that drives a clear next step or a thought-provoking question to encourage interaction.

{format_instructions}
""",
            ),
            (
                "human",
                "Using the principles of world-class content creation, generate a structured JSON blog post from the following content analysis:\n\n--- ANALYSIS ---\n{analysis_context}\n--- END ANALYSIS ---",
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        return await chain.ainvoke(
            {
                "analysis_context": full_context,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )
    except Exception as e:
        print(f"        - [red]Error generating blog post: {e}[/red]")
        return {"error": "Could not generate blog post.", "details": str(e)}
