"""
Retry and error handling utilities.
"""

import time
import random
from functools import wraps
from typing import Callable, Any
import json
from google.api_core.exceptions import ResourceExhausted
from rich import print


def retry_with_exponential_backoff(
    max_retries: int = 5,
    base_delay: int = 2,
    return_empty_dict_on_failure: bool = True
):
    """
    Decorator for retrying functions with exponential backoff.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            delay = base_delay
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
                        f"[yellow]{error_type}. Retrying in {wait_time:.2f} seconds... "
                        f"(Attempt {attempt + 1}/{max_retries})[/yellow]"
                    )
                    time.sleep(wait_time)
                    delay *= 2
                except Exception as e:
                    print(
                        f"[bold red]An unexpected error occurred in '{func.__name__}': {e}. "
                        f"Skipping retries for this call.[/bold red]"
                    )
                    break
                    
            print(
                f"[bold red]Max retries reached or fatal error occurred for '{func.__name__}'. "
                f"Returning a default value.[/bold red]"
            )
            
            if return_empty_dict_on_failure:
                # Special handling for specific function types
                if (
                    "verify_claim" in func.__name__
                    or "generate_contextual_briefing" in func.__name__
                ):
                    return {"summary": "Failed after multiple retries.", "perspectives": []}
                else:
                    return {}
            return None
                    
        return wrapper
    return decorator