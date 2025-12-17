"""
Simple timestamp extraction for supporting quotes in actionable takeaways.
"""

import re
from typing import List, Dict, Any, Optional
from thefuzz import fuzz


def convert_string_transcript_to_structured(transcript: str):
    """
    Converts a string transcript to structured format for paste jobs.
    For paste jobs, we return the original transcript string since
    the pipeline expects raw transcript data.
    """
    return transcript




def create_concatenated_blocks(
    structured_transcript: List[Dict[str, Any]], max_block_entries: int = 5
) -> List[Dict[str, Any]]:
    """
    Create concatenated text blocks from adjacent transcript entries to handle quotes spanning multiple entries.

    Args:
        structured_transcript: List of transcript entries
        max_block_entries: Maximum number of entries to concatenate in each block

    Returns:
        List of blocks with concatenated text and start timestamp of first entry
    """
    if not structured_transcript:
        return []

    blocks = []

    for i in range(len(structured_transcript)):
        # Create blocks of different sizes (1 to max_block_entries)
        for block_size in range(
            1, min(max_block_entries + 1, len(structured_transcript) - i + 1)
        ):
            end_index = i + block_size
            block_entries = structured_transcript[i:end_index]

            # Concatenate text from all entries in this block
            block_text = " ".join(
                entry.get("text", "")
                for entry in block_entries
                if isinstance(entry, dict) and "text" in entry
            )

            if block_text.strip():
                blocks.append(
                    {
                        "text": block_text,
                        "start": block_entries[0].get("start", 0),
                        "start_index": i,
                        "end_index": end_index - 1,
                        "block_size": block_size,
                    }
                )

    return blocks


def format_timestamp(seconds: float) -> str:
    """
    Convert seconds to MM:SS format.

    Args:
        seconds: Time in seconds

    Returns:
        Formatted time string in MM:SS format
    """
    if isinstance(seconds, (int, float)):
        minutes = int(seconds // 60)
        seconds_int = int(seconds % 60)
        return f"{minutes:02d}:{seconds_int:02d}"
    return str(seconds)


def find_quote_timestamp(
    supporting_quote: str, structured_transcript: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Find timestamp for a supporting quote by matching words in the transcript.
    Now handles quotes that span multiple transcript entries.

    Args:
        supporting_quote: The quote text to find
        structured_transcript: List of transcript entries with 'text', 'start', 'duration' fields

    Returns:
        Dictionary with 'start' timestamp if found, None otherwise
    """
    if not supporting_quote or not structured_transcript:
        return None

    # Normalize the quote text
    normalized_quote = re.sub(r"[^\w\s]", "", supporting_quote.lower())
    normalized_quote = " ".join(normalized_quote.split())
    quote_words = normalized_quote.split()

    if len(quote_words) < 3:
        return None

    # Create concatenated blocks from transcript entries
    concatenated_blocks = create_concatenated_blocks(structured_transcript)

    # Try matching with decreasing word counts (6, 5, 4, 3)
    for word_count in range(min(6, len(quote_words)), 2, -1):
        search_words = quote_words[:word_count]
        search_text = " ".join(search_words)

        # Search through concatenated blocks (prioritize smaller blocks first for accuracy)
        for block in sorted(concatenated_blocks, key=lambda x: x["block_size"]):
            block_text = re.sub(r"[^\w\s]", "", block.get("text", "").lower())
            block_text = " ".join(block_text.split())

            # Check if search text is found in this block
            if search_text in block_text:
                # Get start time from first segment
                start_seconds = block.get("start", 0)
                start_time = format_timestamp(start_seconds)

                return {"start": start_time}

    return None




def find_fuzzy_transcript_match(transcript, query, score_cutoff=85):
    """
    Finds the best fuzzy match for a query within a transcript.

    This function is resilient to minor errors (like missing or wrong words)
    in the transcript by using a sliding window and fuzzy matching.

    Args:
        transcript (list[dict]): A list of utterance dictionaries.
        query (str): The search query from the user.
        score_cutoff (int): The minimum similarity score (0-100) to consider a match.

    Returns:
        list[dict] or None: A list of the matching utterance dictionaries,
                            or None if no satisfactory match is found.
    """
    if not transcript or not query:
        return None

    # --- Pre-processing for better matching ---
    # Normalize whitespace and clean both the query and transcript text.
    clean_query = re.sub(r'\s+', ' ', query).strip().lower()

    # Create a clean version of the transcript text for searching
    # while keeping the original data intact.
    for utterance in transcript:
        utterance['clean_text'] = re.sub(r'\s+', ' ', utterance['text']).strip().lower()

    # --- Sliding Window Search ---
    best_match = {
        "score": 0,
        "start_index": -1,
        "end_index": -1
    }

    query_len = len(clean_query.split())

    # First, try to find matches that start at the beginning of the query
    # Look for where the query begins in the transcript
    query_start_words = clean_query.split()[:4]  # First 4 words of query
    query_start_text = " ".join(query_start_words)

    # Iterate through all possible starting points of a match
    for i in range(len(transcript)):
        # Create a "window" of utterances to test against the query
        # We test windows that are roughly the same word-length as the query
        # to find the most relevant segment. We add a small buffer (+3 words).
        for j in range(i, len(transcript)):
            window_utterances = transcript[i : j + 1]
            combined_text = " ".join([u['clean_text'] for u in window_utterances])

            # Stop expanding the window if it's much longer than the query
            if len(combined_text.split()) > query_len + 3:
                break

            # Use partial_ratio for better results with substring-like matches
            score = fuzz.partial_ratio(clean_query, combined_text)

            # Bonus for matches that contain the beginning of the query
            start_bonus = 0
            # Check if the start words appear in order (more flexible matching)
            query_start_words_found = 0
            last_found_index = -1
            for word in query_start_words:
                word_index = combined_text.find(word, last_found_index + 1)
                if word_index != -1:
                    query_start_words_found += 1
                    last_found_index = word_index
                else:
                    break  # Must be in order

            # Give bonus based on how many start words are found in order
            if query_start_words_found >= 3:  # At least 3 out of 4 start words
                start_bonus = 15
            elif query_start_words_found >= 2:  # At least 2 start words
                start_bonus = 10

            # Bonus for earlier positions (prefer earlier matches when scores are close)
            position_bonus = max(0, 5 - i)  # Earlier positions get small bonus

            total_score = score + start_bonus + position_bonus

            if total_score > best_match["score"]:
                best_match["score"] = total_score
                best_match["start_index"] = i
                best_match["end_index"] = j

    # --- Return the result ---
    # Adjust cutoff to account for potential bonuses (max bonus is ~15 points)
    adjusted_cutoff = score_cutoff
    if best_match["score"] >= adjusted_cutoff:
        start = best_match["start_index"]
        end = best_match["end_index"] + 1

        # Return the original utterance objects, removing the temporary clean_text
        result_utterances = transcript[start:end]
        for u in result_utterances:
            del u['clean_text']

        return result_utterances
    else:
        # Clean up all utterances if no match is found
        for u in transcript:
             if 'clean_text' in u:
                del u['clean_text']
        return None


def find_quote_timestamp_with_fuzzy_fallback(
    supporting_quote: str, structured_transcript: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Enhanced version of find_quote_timestamp that uses fuzzy matching as a fallback.

    Args:
        supporting_quote: The quote text to find
        structured_transcript: List of transcript entries with 'text', 'start', 'duration' fields

    Returns:
        Dictionary with 'start' timestamp if found, None otherwise
    """
    # First try the exact matching approach
    result = find_quote_timestamp(supporting_quote, structured_transcript)
    if result:
        return result

    # If exact matching fails, try fuzzy matching
    fuzzy_matches = find_fuzzy_transcript_match(structured_transcript, supporting_quote)
    if fuzzy_matches:
        # Return the start time of the first matching utterance
        start_seconds = fuzzy_matches[0].get("start", 0)
        start_time = format_timestamp(start_seconds)
        return {"start": start_time}

    return None


def add_timestamps_to_actionable_takeaways(
    actionable_takeaways: List[Dict[str, Any]],
    structured_transcript: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Add timestamps to actionable takeaways by matching supporting quotes with transcript.

    Args:
        actionable_takeaways: List of takeaway dictionaries with 'supporting_quote' field
        structured_transcript: List of transcript entries with timing data

    Returns:
        Enhanced takeaways with 'quote_timestamp' field added where matches found
    """
    if not actionable_takeaways or not structured_transcript:
        return actionable_takeaways

    enhanced_takeaways = []
    matches_found = 0

    for takeaway in actionable_takeaways:
        if not isinstance(takeaway, dict):
            enhanced_takeaways.append(takeaway)
            continue

        # Copy the takeaway
        enhanced_takeaway = takeaway.copy()

        # Try to find timestamp for the supporting quote
        supporting_quote = takeaway.get("supporting_quote", "")
        if supporting_quote:
            timestamp_info = find_quote_timestamp_with_fuzzy_fallback(
                supporting_quote, structured_transcript
            )
            if timestamp_info:
                enhanced_takeaway["quote_timestamp"] = timestamp_info
                matches_found += 1

        enhanced_takeaways.append(enhanced_takeaway)

    print(
        f"[green]Timestamp extraction: Found {matches_found}/{len(actionable_takeaways)} quote timestamps[/green]"
    )

    return enhanced_takeaways


def add_timestamps_to_notable_quotes(
    notable_quotes: List[Dict[str, Any]],
    structured_transcript: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Add precise timestamps to notable quotes by matching quote text with transcript.

    This function is used for podcaster persona to find exact timestamps for shareable quotes.

    Args:
        notable_quotes: List of quote dictionaries with 'quote' and 'context' fields
        structured_transcript: List of transcript entries with timing data

    Returns:
        Enhanced quotes with 'timestamp' field updated to exact match location
    """
    if not notable_quotes or not structured_transcript:
        return notable_quotes

    enhanced_quotes = []
    matches_found = 0

    for quote_obj in notable_quotes:
        if not isinstance(quote_obj, dict):
            enhanced_quotes.append(quote_obj)
            continue

        # Copy the quote object
        enhanced_quote = quote_obj.copy()

        # Try to find timestamp for the quote text
        quote_text = quote_obj.get("quote", "")
        if quote_text:
            timestamp_info = find_quote_timestamp_with_fuzzy_fallback(
                quote_text, structured_transcript
            )
            if timestamp_info:
                # Update the timestamp field with the exact match
                enhanced_quote["timestamp"] = timestamp_info.get("start", enhanced_quote.get("timestamp", "00:00"))
                matches_found += 1

        enhanced_quotes.append(enhanced_quote)

    print(
        f"[green]Notable quote timestamp extraction: Found {matches_found}/{len(notable_quotes)} exact timestamps[/green]"
    )

    return enhanced_quotes
