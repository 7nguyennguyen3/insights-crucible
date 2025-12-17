"""
Time parsing utilities.
"""

from typing import Optional


def parse_and_normalize_time(time_str: str) -> Optional[int]:
    """
    Parses various timestamp formats (e.g., HH:MM:SS, MM:SS, [M:SS - M:SS])
    and returns the total seconds of the START time.
    Returns None if the format is not recognized or cannot be parsed.
    """
    if not isinstance(time_str, str):
        return None

    try:
        # Remove brackets or parentheses for cleaner parsing
        cleaned_str = time_str.strip().strip("[]()") 

        # Handle time ranges - take the part before the hyphen
        if "-" in cleaned_str:
            cleaned_str = cleaned_str.split("-")[0].strip()

        # Split the string by colons
        parts = cleaned_str.split(":")

        # Ensure all parts are digits before converting
        if not all(part.isdigit() for part in parts if part):
            return None

        # Convert parts to integers
        int_parts = list(map(int, parts))

        if len(int_parts) == 3:  # HH:MM:SS
            return int_parts[0] * 3600 + int_parts[1] * 60 + int_parts[2]
        elif len(int_parts) == 2:  # MM:SS
            return int_parts[0] * 60 + int_parts[1]
        elif len(int_parts) == 1:  # SS
            return int_parts[0]

        # If it's not a recognized format, return None
        return None

    except (ValueError, AttributeError):
        # If any conversion fails, gracefully return None
        return None


def format_seconds_to_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS format."""
    if seconds < 0:
        return "N/A"
    seconds = int(seconds)
    return f"{seconds // 60:02d}:{seconds % 60:02d}"