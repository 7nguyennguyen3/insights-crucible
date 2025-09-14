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
            print(f"        - [cyan]Using section-aware multi-quiz format with {multi_quiz_data.get('quiz_metadata', {}).get('total_quizzes', 1)} quizzes[/cyan]")
            return {
                "quiz_metadata": multi_quiz_data.get("quiz_metadata", {}),
                "questions": quiz_questions,
                "quizzes": multi_quiz_data.get("quizzes", []),
                "quiz_type": "section_aware_multi_quiz",
                "generation_method": "section_aware"
            }
        else:
            # Return legacy single quiz format
            print("        - [yellow]Using legacy single quiz format[/yellow]")
            return {
                "quiz_metadata": {
                    "total_questions": len(quiz_questions),
                    "estimated_time_minutes": len(quiz_questions) * 2,  # 2 minutes per question
                    "difficulty_distribution": {"easy": 1, "medium": len(quiz_questions) - 1, "hard": 0},
                    "source": "learning_synthesis"
                },
                "questions": quiz_questions,
                "quiz_type": "knowledge_testing",
                "generation_method": "legacy"
            }
    
    print("        - [yellow]No synthesis quiz questions found, returning empty result[/yellow]")
    return {"error": "No quiz questions generated. This should be handled by synthesis."}


@retry_with_exponential_backoff
async def grade_open_ended_response(
    user_answer: str,
    question: str,
    section_analysis: Dict[str, Any],
    runnable_config: RunnableConfig,
) -> Dict[str, Any]:
    """
    Provide learning-focused feedback on an open-ended response using LLM analysis.
    
    Args:
        user_answer: The user's response to the open-ended question
        question: The original open-ended question
        section_analysis: The section analysis containing context
        runnable_config: LangChain runnable configuration
        
    Returns:
        Dict containing learning-focused feedback without traditional scoring
    """
    print(f"        - [blue]Evaluating open-ended response with learning focus...[/blue]")
    
    # Prepare context for the LLM
    context = {
        "question": question,
        "section_summary": section_analysis.get("1_sentence_summary", ""),
        "key_points": section_analysis.get("key_points", []),
        "lessons_and_concepts": section_analysis.get("lessons_and_concepts", []),
        "notable_quotes": section_analysis.get("notable_quotes", [])
    }
    
    context_json = json.dumps(context, indent=2)
    
    llm, llm_options = clients.get_llm("best-lite", temperature=0.1)
    parser = JsonOutputParser()
    
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert learning coach and educational mentor. Your role is to help learners grow and deepen their understanding, not to judge or score them. 

Focus on providing growth-oriented feedback that:
- Celebrates what the learner has grasped well
- Identifies opportunities for deeper exploration
- Asks thoughtful questions to stimulate critical thinking
- Connects ideas to broader concepts and real-world applications
- Encourages a growth mindset and curiosity

Your output must be a JSON object with this learning-focused structure:
{{
  "understanding_level": "emerging|developing|proficient|advanced",
  "what_you_nailed": ["Specific insights and connections you demonstrated well"],
  "growth_opportunities": ["Specific areas to explore further for deeper understanding"],
  "reflection_prompt": "A single meaningful question for deeper self-reflection",
  "encouragement": "Positive, growth-focused message to motivate continued learning"
}}

Use encouraging, growth-oriented language. Avoid deficit-based phrasing. Instead of "you missed" or "you failed to", use "you might explore" or "consider diving deeper into".

{format_instructions}""",
        ),
        (
            "human",
            """Please provide learning-focused feedback on the following learner response:

--- LEARNER RESPONSE ---
{user_answer}

--- QUESTION ---
{question}

--- SECTION CONTEXT ---
{context_json}

Remember: Your goal is to guide learning and encourage growth, not to score or judge.""",
        ),
    ])
    
    chain = prompt | llm | parser
    
    try:
        result = await chain.ainvoke({
            "user_answer": user_answer,
            "question": question,
            "context_json": context_json,
            "format_instructions": parser.get_format_instructions(),
        }, config=runnable_config)
        
        # Ensure required fields exist with defaults
        required_fields = {
            "understanding_level": "developing",
            "what_you_nailed": ["You engaged thoughtfully with the question"],
            "growth_opportunities": ["Continue exploring the concepts presented"],
            "reflection_prompt": "How might you apply this learning in your daily life?",
            "encouragement": "Great work engaging with this material! Keep exploring and questioning."
        }
        
        # Apply defaults for any missing fields
        for field, default_value in required_fields.items():
            if field not in result:
                result[field] = default_value
        
        # Include the original question in the result for context
        result["original_question"] = question
        
        print(f"        - [green]Learning feedback generated for {result['understanding_level']} level response[/green]")
        return result
        
    except Exception as e:
        print(f"        - [red]Error during feedback generation: {e}[/red]")
        # Return a simplified error response with all required fields
        error_result = {
            "understanding_level": "developing",
            "what_you_nailed": ["You took the time to respond thoughtfully"],
            "growth_opportunities": ["Try again when the system is available"],
            "reflection_prompt": "What's one insight from this content that you want to remember?",
            "encouragement": "Keep exploring and learning! Technical issues won't stop your growth."
        }
        # Include the original question in the result for context
        error_result["original_question"] = question
        return error_result