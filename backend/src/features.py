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
        if "verify_claim" in func.__name__:
            return {"summary": "Failed after multiple retries.", "perspectives": []}
        else:
            return {}

    return wrapper


# Simplified Learning Accelerator Content Generator


@retry_with_exponential_backoff
async def generate_quiz_questions(
    all_sections_analysis: List[Dict],
    runnable_config: RunnableConfig,
    synthesis_data: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """
    Generate quiz questions for analysis personas.
    Now supports both new multi-quiz and legacy single quiz formats.
    """
    print("        - [blue]Generating Quiz Questions...[/blue]")

    # Check if synthesis data already contains quiz questions from synthesis
    if synthesis_data and "quiz_questions" in synthesis_data:
        print("        - [green]Using quiz questions from learning synthesis[/green]")

        quiz_questions = synthesis_data["quiz_questions"]
        generation_method = synthesis_data.get("generation_method", "legacy")
        multi_quiz_data = synthesis_data.get("multi_quiz_data", {})

        if generation_method == "section_aware" and multi_quiz_data:
            # Return new multi-quiz format
            print(
                f"        - [cyan]Using section-aware multi-quiz format with {multi_quiz_data.get('quiz_metadata', {}).get('total_quizzes', 1)} quizzes[/cyan]"
            )
            return {
                "quiz_metadata": multi_quiz_data.get("quiz_metadata", {}),
                "questions": quiz_questions,
                "quizzes": multi_quiz_data.get("quizzes", []),
                "quiz_type": "section_aware_multi_quiz",
                "generation_method": "section_aware",
            }
        else:
            # Return legacy single quiz format
            print("        - [yellow]Using legacy single quiz format[/yellow]")
            return {
                "quiz_metadata": {
                    "total_questions": len(quiz_questions),
                    "estimated_time_minutes": len(quiz_questions)
                    * 1,  # 1 minute per question
                    "difficulty_distribution": {
                        "easy": 1,
                        "medium": len(quiz_questions) - 1,
                        "hard": 0,
                    },
                    "source": "learning_synthesis",
                },
                "questions": quiz_questions,
                "quiz_type": "knowledge_testing",
                "generation_method": "legacy",
            }

    print(
        "        - [yellow]No synthesis quiz questions found, returning empty result[/yellow]"
    )
    return {
        "error": "No quiz questions generated. This should be handled by synthesis."
    }


@retry_with_exponential_backoff
async def grade_open_ended_response(
    user_answer: str,
    question: str,
    question_metadata: Dict[str, Any],  # NEW: What user could know
    runnable_config: RunnableConfig,
    transcript_excerpt: str = None,  # NEW: Relevant content section
) -> Dict[str, Any]:
    """
    Provide fair, transparent feedback based only on disclosed criteria.

    Args:
        user_answer: The user's response
        question: The full question as shown to user (with context)
        question_metadata: The evaluation criteria that were shown to user
        transcript_excerpt: Relevant section of original content
        runnable_config: LangChain configuration

    Returns:
        Dict containing fair, criteria-aligned feedback
    """
    print(f"        - [blue]Evaluating response with transparent criteria...[/blue]")

    # Extract what the user was explicitly told to address
    evaluation_criteria = question_metadata.get("evaluation_criteria", [])
    insight_principle = question_metadata.get("insight_principle", "")
    supporting_quote = question_metadata.get("supporting_quote", "")

    llm, llm_options = clients.get_llm("best-lite", temperature=0.1)
    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a fair and transparent learning evaluator. You grade ONLY based on criteria that were disclosed to the learner.

CRITICAL RULES:
1. Only evaluate based on the criteria explicitly shown in the question
2. Do NOT penalize for missing information that wasn't requested
3. Do NOT expect knowledge beyond what the question asked for
4. Focus on whether they addressed the specific points they were asked to address

Your evaluation should be based on:
- Did they address the specific points listed in "In your answer, please address"?
- Do they show understanding of the principle that was explicitly mentioned?
- Is their reasoning sound based on what was asked?

Your output must be a JSON object with:
{{
  "understanding_level": "emerging|developing|proficient|advanced",
  "what_you_nailed": ["Specific things you addressed well from the requested points"],
  "growth_opportunities": ["Ways to better address the specific points that were asked"],
  "reflection_prompt": "A question to deepen thinking about the disclosed concept",
  "encouragement": "Positive message focused on their engagement with the specific topic"
}}

Understanding levels:
- emerging: Attempted to address the points but missed key aspects
- developing: Addressed most requested points with basic understanding
- proficient: Clearly addressed all requested points with good understanding
- advanced: Went beyond addressing the points with exceptional insight

{format_instructions}""",
            ),
            (
                "human",
                """Evaluate this response based ONLY on the disclosed criteria:

--- THE QUESTION AS SHOWN TO USER ---
{question}

--- EVALUATION CRITERIA (shown to user) ---
The user was asked to address:
{criteria_list}

--- USER'S ANSWER ---
{user_answer}

--- RELEVANT CONTEXT ---
Principle being explored: {insight_principle}
Supporting quote: {supporting_quote}

Remember: Grade ONLY on whether they addressed what was explicitly asked. Be fair.""",
            ),
        ]
    )

    # Format criteria for prompt
    criteria_list = "\n".join([f"• {criterion}" for criterion in evaluation_criteria])

    chain = prompt | llm | parser

    try:
        result = await chain.ainvoke(
            {
                "question": question,
                "criteria_list": criteria_list,
                "user_answer": user_answer,
                "insight_principle": insight_principle,
                "supporting_quote": supporting_quote,
                "format_instructions": parser.get_format_instructions(),
            },
            config=runnable_config,
        )

        # Add transparency note to feedback
        result["grading_transparency"] = {
            "criteria_used": evaluation_criteria,
            "principle_tested": insight_principle,
            "note": "You were evaluated only on the points explicitly mentioned in the question",
        }

        # Include original question for reference
        result["original_question"] = question

        print(
            f"        - [green]Fair evaluation completed: {result['understanding_level']}[/green]"
        )
        return result

    except Exception as e:
        print(f"        - [red]Error during evaluation: {e}[/red]")
        return {
            "understanding_level": "developing",
            "what_you_nailed": ["You engaged with the question"],
            "growth_opportunities": [
                "Review the specific points requested in the question"
            ],
            "reflection_prompt": "What aspect of this concept would you like to explore further?",
            "encouragement": "Keep learning and growing!",
            "original_question": question,
            "error": True,
        }
