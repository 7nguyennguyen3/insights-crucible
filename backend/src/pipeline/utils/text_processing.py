"""
Text processing utilities.
"""

import re
from typing import List


def clean_line_for_analysis(line: str) -> str:
    """Clean a line of text for analysis by removing timestamps."""
    return re.sub(r"\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*", " ", line).strip()


def get_normalized_cache_key(entity_name: str) -> str:
    """
    Creates a standardized, robust cache key from an entity name.
    Example: "Chief Marketing Officer" -> "chief-marketing-officer"
    """
    if not entity_name:
        return None
    
    # Make it lowercase and remove leading/trailing whitespace
    normalized = entity_name.lower().strip()
    
    # Replace spaces and other common separators with a hyphen
    normalized = re.sub(r"[\s_.]+", "-", normalized)
    
    # Remove any characters that aren't letters, numbers, or hyphens
    normalized = re.sub(r"[^a-z0-9-]", "", normalized)
    
    return normalized


def calculate_dynamic_words_per_section(total_characters: int) -> int:
    """
    Calculates the ideal number of words per section to achieve smooth scaling
    from 1-2 sections for short texts up to a maximum of 10 for very long texts.
    """
    from ..config.constants import (
        CHARS_PER_WORD, MIN_SECTIONS, MAX_SECTIONS, MIN_WORDS_FOR_SPLIT,
        SCALE_START_WORDS, SCALE_END_WORDS
    )
    import math
    
    # Estimate total words from characters
    total_words = total_characters / CHARS_PER_WORD
    
    # Handle edge cases for very short texts
    if total_words < MIN_WORDS_FOR_SPLIT:
        return int(total_words) + 1  # Ensures only one section is created
    
    # Determine the target number of sections using linear scaling
    target_sections: float
    if total_words <= SCALE_START_WORDS:
        target_sections = float(MIN_SECTIONS)
    elif total_words >= SCALE_END_WORDS:
        target_sections = float(MAX_SECTIONS)
    else:
        # Linear interpolation
        progress = (total_words - SCALE_START_WORDS) / (SCALE_END_WORDS - SCALE_START_WORDS)
        target_sections = MIN_SECTIONS + progress * (MAX_SECTIONS - MIN_SECTIONS)
    
    # Calculate words per section needed to hit the target number of sections
    final_num_sections = math.ceil(target_sections)
    
    # Avoid division by zero
    if final_num_sections == 0:
        return int(total_words) + 1
    
    words_per_section = total_words / final_num_sections
    return math.ceil(words_per_section)


def calculate_dynamic_section_duration(total_duration_seconds: int) -> int:
    """
    Calculates the ideal section duration to create between 3 and 10 sections.
    """
    from ..config.constants import (
        MIN_DURATION_SECONDS, SCALE_START_DURATION, SCALE_END_DURATION,
        MIN_SECTIONS, MAX_SECTIONS
    )
    import math
    
    if total_duration_seconds < MIN_DURATION_SECONDS:
        return total_duration_seconds + 1
    
    target_sections: float
    if total_duration_seconds <= SCALE_START_DURATION:
        target_sections = float(MIN_SECTIONS)
    elif total_duration_seconds >= SCALE_END_DURATION:
        target_sections = float(MAX_SECTIONS)
    else:
        progress = (total_duration_seconds - SCALE_START_DURATION) / (
            SCALE_END_DURATION - SCALE_START_DURATION
        )
        target_sections = MIN_SECTIONS + progress * (MAX_SECTIONS - MIN_SECTIONS)
    
    # Use ceiling to slightly overestimate, preventing a tiny leftover section
    return math.ceil(total_duration_seconds / target_sections)