# src/features.py

import os
import json
import asyncio
from typing import List, Dict
from functools import wraps
import time
import random

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableConfig
from google.api_core.exceptions import ResourceExhausted
from tavily import TavilyClient
from firebase_admin import firestore
from rich import print

from src import db_manager
from src.config import app_config


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
    claim_text: str, context: str, user_id: str, job_id: str, section_index: int
) -> Dict:
    """
    Generates a multi-angle briefing for a specific claim by performing parallel
    web searches and synthesizing the results.
    """
    log_prefix = f"             - [Section {section_index + 1}]"
    print(
        f"{log_prefix} [bold purple]Starting 'Context & Perspectives Engine'...[/bold purple]"
    )

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["main"], temperature=0.1)
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
    print("         - [blue]Generating a single overall X (Twitter) thread...[/blue]")
    # ... (function content is unchanged)
    full_context = ""
    for i, section in enumerate(all_sections_analysis):
        title = section.get("generated_title", f"Section {i+1}")
        summary_points = section.get("summary_points", [])[:3]
        full_context += f"## {title}\n"
        for point in summary_points:
            full_context += f"- {point}\n"
        full_context += "\n"

    llm = ChatGoogleGenerativeAI(model=app_config.LLM_MODELS["best"], temperature=0.5)
    parser = JsonOutputParser()

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
        print(f"         - [red]Error generating overall X thread: {e}[/red]")
        return []


async def generate_blog_post(
    all_sections_analysis: List[Dict], runnable_config: RunnableConfig
) -> str:
    """
    Generates a blog post from the analysis.
    """
    print("         - [blue]Generating Blog Post Draft...[/blue]")
    # ... (function content is unchanged)
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
        print(f"         - [red]Error generating blog post: {e}[/red]")
        return "Error: Could not generate blog post."
