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
    Generate quiz questions for the learning_accelerator persona.
    Uses quiz questions from synthesis if available (new simplified approach).
    """
    print("        - [blue]Generating Quiz Questions...[/blue]")
    
    # Check if synthesis data already contains quiz questions (from learning_accelerator)
    if synthesis_data and "quiz_questions" in synthesis_data:
        print("        - [green]Using quiz questions from learning synthesis[/green]")
        
        quiz_questions = synthesis_data["quiz_questions"]
        
        return {
            "quiz_metadata": {
                "total_questions": len(quiz_questions),
                "estimated_time_minutes": len(quiz_questions) * 2,  # 2 minutes per question
                "difficulty_distribution": {"easy": 1, "medium": len(quiz_questions) - 1, "hard": 0},
                "source": "learning_synthesis"
            },
            "questions": quiz_questions,
            "quiz_type": "knowledge_testing"
        }
    
    print("        - [yellow]No synthesis quiz questions found, returning empty result[/yellow]")
    return {"error": "No quiz questions generated. This should be handled by synthesis for learning_accelerator."}
