import json
import re
from typing import Dict, List, Tuple, Optional, Union

def seconds_to_mmss(seconds: float) -> str:
    """
    Convert seconds to MM:SS format.
    
    Args:
        seconds: Time in seconds
        
    Returns:
        Time formatted as MM:SS
    """
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def timestamp_to_seconds(timestamp: str) -> float:
    """
    Convert timestamp string to seconds.
    
    Args:
        timestamp: Time in format MM:SS, M:SS, or H:MM:SS
        
    Returns:
        Time in seconds as float
    """
    parts = timestamp.strip().split(':')
    
    if len(parts) == 2:  # MM:SS or M:SS
        minutes, seconds = parts
        return float(minutes) * 60 + float(seconds)
    elif len(parts) == 3:  # H:MM:SS
        hours, minutes, seconds = parts
        return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
    else:
        raise ValueError(f"Invalid timestamp format: {timestamp}")

def convert_string_transcript_to_structured(transcript: str) -> List[Dict]:
    """
    Convert string-based transcript (paste format) to structured format like YouTube transcripts.
    
    Args:
        transcript: String transcript with embedded timestamps
        
    Returns:
        List of structured transcript entries with start, duration, text fields
    """
    if not transcript or not isinstance(transcript, str):
        return []
    
    # Parse the string transcript into (timestamp, text) tuples
    timestamped_lines = parse_transcript(transcript)
    
    if not timestamped_lines:
        return []
    
    structured_entries = []
    
    for i, (timestamp, text) in enumerate(timestamped_lines):
        # Skip empty text
        if not text or not text.strip():
            continue
            
        # Convert timestamp to seconds
        try:
            start_seconds = timestamp_to_seconds(timestamp)
        except ValueError as e:
            print(f"Warning: Skipping invalid timestamp '{timestamp}': {e}")
            continue
        
        # Calculate duration - time until next timestamp or default
        if i + 1 < len(timestamped_lines):
            try:
                next_timestamp = timestamped_lines[i + 1][0]
                next_seconds = timestamp_to_seconds(next_timestamp)
                duration = max(0.1, next_seconds - start_seconds)  # Minimum 0.1 seconds
            except (ValueError, IndexError):
                duration = 5.0  # Default duration if calculation fails
        else:
            # Last segment - use default duration
            duration = 5.0
        
        # Create structured entry
        entry = {
            "start": start_seconds,
            "duration": duration,
            "text": text.strip()
        }
        
        structured_entries.append(entry)
    
    print(f"Converted string transcript to {len(structured_entries)} structured entries")
    return structured_entries

def parse_structured_transcript(transcript: List[Dict]) -> List[Tuple[str, str]]:
    """
    Parse structured transcript (list of dicts with start, duration, text) into (timestamp, text) tuples.
    
    Args:
        transcript: List of transcript entries with start, duration, text fields
        
    Returns:
        List of (timestamp, text) tuples
    """
    timestamped_lines = []
    
    for entry in transcript:
        if isinstance(entry, dict) and 'start' in entry and 'text' in entry:
            start_seconds = entry['start']
            text = entry['text']
            
            # Skip empty text or [Music] entries
            if not text or text.strip() in ['[Music]', '[Applause]', '']:
                continue
                
            timestamp = seconds_to_mmss(start_seconds)
            timestamped_lines.append((timestamp, text.strip()))
    
    return timestamped_lines

def parse_transcript(transcript: str) -> List[Tuple[str, str]]:
    """
    Parse the transcript into a list of (timestamp, text) tuples.
    
    Args:
        transcript: The raw transcript string with timestamps
        
    Returns:
        List of (timestamp, text) tuples
    """
    lines = transcript.split('\n')
    timestamped_lines = []
    
    i = 0
    while i < len(lines):
        # Check if current line is a timestamp
        if re.match(r'^\d+:\d+$', lines[i].strip()):
            timestamp = lines[i].strip()
            i += 1
            # Collect all text until next timestamp or end
            text_lines = []
            while i < len(lines) and not re.match(r'^\d+:\d+$', lines[i].strip()):
                if lines[i].strip():  # Skip empty lines
                    text_lines.append(lines[i].strip())
                i += 1
            if text_lines:
                timestamped_lines.append((timestamp, ' '.join(text_lines)))
        else:
            i += 1
    
    return timestamped_lines

def normalize_text(text: str) -> str:
    """
    Normalize text for matching by removing extra whitespace and normalizing characters.
    
    Args:
        text: The text to normalize
        
    Returns:
        Normalized text
    """
    # Remove extra whitespace and normalize
    normalized = ' '.join(text.split()).strip().lower()
    # Remove common punctuation that might interfere with matching
    normalized = re.sub(r'[^\w\s]', '', normalized)
    return normalized

def _find_phrase_in_transcript(phrase: str, structured_transcript: List[Dict]) -> Optional[int]:
    """
    Find the index of the transcript entry where a phrase begins.
    
    Args:
        phrase: The normalized phrase to find
        structured_transcript: List of transcript entries
        
    Returns:
        Index of the entry where the phrase starts, or None if not found
    """
    if not phrase or not structured_transcript:
        return None
    
    phrase_words = phrase.split()
    if not phrase_words:
        return None
    
    # Build a continuous text from transcript entries for matching
    transcript_words = []
    word_to_entry_map = []  # Maps word index to transcript entry index
    
    for entry_idx, entry in enumerate(structured_transcript):
        if not isinstance(entry, dict) or 'text' not in entry:
            continue
            
        text = entry.get('text', '').strip()
        if not text or text in ['[Music]', '[Applause]']:
            continue
        
        clean_text = normalize_text(text)
        entry_words = clean_text.split()
        
        for word in entry_words:
            transcript_words.append(word)
            word_to_entry_map.append(entry_idx)
    
    # Search for the phrase in the continuous word stream
    if len(phrase_words) > len(transcript_words):
        return None
    
    for i in range(len(transcript_words) - len(phrase_words) + 1):
        # Check if phrase matches at position i
        match = True
        for j, phrase_word in enumerate(phrase_words):
            if transcript_words[i + j] != phrase_word:
                match = False
                break
        
        if match:
            # Return the entry index where this phrase starts
            return word_to_entry_map[i]
    
    return None

def find_quote_timestamp_range(quote: str, structured_transcript: List[Dict]) -> Optional[Dict]:
    """
    Find the timestamp range for a quote in the structured transcript using first/last word matching.
    
    Args:
        quote: The quote to find
        structured_transcript: List of transcript entries with start, duration, text fields
        
    Returns:
        Dict with start, end, duration if found, None otherwise
    """
    if not quote or not structured_transcript:
        return None
    
    # Normalize and split the quote into words
    clean_quote = normalize_text(quote)
    quote_words = clean_quote.split()
    
    if len(quote_words) < 3:  # Need at least 3 words for meaningful matching
        print(f"Quote too short ({len(quote_words)} words): {clean_quote}")
        return None
    
    print(f"Looking for quote range: {clean_quote[:100]}...")
    print(f"Quote has {len(quote_words)} words")
    
    # Try different word counts for first/last word matching (6 down to 3)
    for word_count in range(min(6, len(quote_words)), 2, -1):
        print(f"Trying {word_count}-word matching...")
        
        # Get first N words and last N words
        first_words = quote_words[:word_count]
        last_words = quote_words[-word_count:]
        
        first_phrase = " ".join(first_words)
        last_phrase = " ".join(last_words)
        
        print(f"  First phrase: '{first_phrase}'")
        print(f"  Last phrase: '{last_phrase}'")
        
        # Find positions of first and last phrases
        start_pos = _find_phrase_in_transcript(first_phrase, structured_transcript)
        end_pos = _find_phrase_in_transcript(last_phrase, structured_transcript)
        
        if start_pos is not None and end_pos is not None and end_pos >= start_pos:
            # Calculate the range
            start_entry = structured_transcript[start_pos]
            end_entry = structured_transcript[end_pos]
            
            start_time = start_entry['start']
            end_time = end_entry['start'] + end_entry.get('duration', 5.0)
            
            result = {
                'start': seconds_to_mmss(start_time),
                'end': seconds_to_mmss(end_time),
                'duration': seconds_to_mmss(end_time - start_time)
            }
            
            print(f"Found {word_count}-word match: {result['start']} - {result['end']} (duration: {result['duration']})")
            return result
        else:
            print(f"  No valid range found with {word_count} words (start_pos: {start_pos}, end_pos: {end_pos})")
    
    print("No quote range found with first/last word matching")
    return None

def _find_exact_quote_range(clean_quote: str, structured_transcript: List[Dict]) -> Optional[Dict]:
    """Find exact substring matches across consecutive transcript entries."""
    for i, entry in enumerate(structured_transcript):
        if not isinstance(entry, dict) or 'text' not in entry:
            continue
            
        # Skip music and empty entries
        text = entry.get('text', '').strip()
        if not text or text in ['[Music]', '[Applause]']:
            continue
        
        clean_text = normalize_text(text)
        
        # Check if quote starts in this entry
        if clean_quote.startswith(clean_text) or clean_text in clean_quote:
            # Try to find the full quote across consecutive entries
            return _build_range_from_start(i, clean_quote, structured_transcript)
    
    return None

def _find_sequential_quote_range(quote_words: set, structured_transcript: List[Dict]) -> Optional[Dict]:
    """Find the best sequential range of entries that contain the quote words."""
    best_range = None
    best_score = 0
    
    # Try different window sizes
    for window_size in range(1, min(10, len(structured_transcript) + 1)):
        for start_idx in range(len(structured_transcript) - window_size + 1):
            end_idx = start_idx + window_size
            
            # Collect text from this window
            window_text = ""
            valid_entries = []
            
            for i in range(start_idx, end_idx):
                entry = structured_transcript[i]
                if not isinstance(entry, dict) or 'text' not in entry:
                    continue
                    
                text = entry.get('text', '').strip()
                if text and text not in ['[Music]', '[Applause]']:
                    window_text += " " + text
                    valid_entries.append(entry)
            
            if not valid_entries:
                continue
                
            # Calculate word overlap score
            clean_window_text = normalize_text(window_text)
            window_words = set(clean_window_text.split())
            
            if window_words:
                overlap = len(quote_words.intersection(window_words))
                # Prefer shorter ranges with high overlap
                score = overlap / len(quote_words) - (window_size * 0.05)
                
                if score > best_score and overlap >= len(quote_words) * 0.6:  # At least 60% word match
                    best_score = score
                    first_entry = valid_entries[0]
                    last_entry = valid_entries[-1]
                    
                    start_time = first_entry['start']
                    end_time = last_entry['start'] + last_entry.get('duration', 0)
                    
                    best_range = {
                        'start': seconds_to_mmss(start_time),
                        'end': seconds_to_mmss(end_time),
                        'duration': seconds_to_mmss(end_time - start_time)
                    }
    
    return best_range

def _find_single_best_match(quote_words: set, structured_transcript: List[Dict]) -> Optional[Dict]:
    """Find the single best matching entry and use its duration."""
    best_entry = None
    best_overlap = 0
    
    for entry in structured_transcript:
        if not isinstance(entry, dict) or 'text' not in entry:
            continue
            
        text = entry.get('text', '').strip()
        if not text or text in ['[Music]', '[Applause]']:
            continue
        
        clean_text = normalize_text(text)
        text_words = set(clean_text.split())
        
        if text_words:
            overlap = len(quote_words.intersection(text_words)) / len(quote_words)
            if overlap > best_overlap:
                best_overlap = overlap
                best_entry = entry
    
    if best_entry and best_overlap > 0.5:
        start_time = best_entry['start']
        duration = best_entry.get('duration', 5.0)  # Default 5 seconds if no duration
        end_time = start_time + duration
        
        return {
            'start': seconds_to_mmss(start_time),
            'end': seconds_to_mmss(end_time),
            'duration': seconds_to_mmss(duration)
        }
    
    return None

def _build_range_from_start(start_idx: int, clean_quote: str, structured_transcript: List[Dict]) -> Optional[Dict]:
    """Build a range starting from a specific entry that matches the quote beginning."""
    matched_text = ""
    valid_entries = []
    
    for i in range(start_idx, min(start_idx + 15, len(structured_transcript))):  # Look ahead up to 15 entries
        entry = structured_transcript[i]
        if not isinstance(entry, dict) or 'text' not in entry:
            continue
            
        text = entry.get('text', '').strip()
        if not text or text in ['[Music]', '[Applause]']:
            continue
        
        clean_text = normalize_text(text)
        matched_text += " " + clean_text
        valid_entries.append(entry)
        
        # Check if we've covered enough of the quote
        if len(matched_text.strip()) >= len(clean_quote) * 0.8:  # 80% coverage
            break
    
    if valid_entries:
        first_entry = valid_entries[0]
        last_entry = valid_entries[-1]
        
        start_time = first_entry['start']
        end_time = last_entry['start'] + last_entry.get('duration', 0)
        
        return {
            'start': seconds_to_mmss(start_time),
            'end': seconds_to_mmss(end_time),
            'duration': seconds_to_mmss(end_time - start_time)
        }
    
    return None

def find_quote_timestamp_range_from_structured(quote: str, structured_transcript: List[Dict]) -> Optional[Dict]:
    """
    Find the timestamp range for a quote using structured transcript data.
    
    Args:
        quote: The quote to find
        structured_transcript: List of transcript entries with start, duration, text fields
        
    Returns:
        Dict with start, end, duration if found, None otherwise
        Format: {"start": "04:53", "end": "05:12", "duration": "0:19"}
    """
    return find_quote_timestamp_range(quote, structured_transcript)

def find_quote_timestamp_from_structured(quote: str, structured_transcript: List[Dict]) -> Optional[str]:
    """
    Find the timestamp for a quote using structured transcript data.
    
    Args:
        quote: The quote to find
        structured_transcript: List of transcript entries with start, duration, text fields
        
    Returns:
        The timestamp in MM:SS format if found, None otherwise
    """
    # Use the new range function and extract just the start time for backward compatibility
    range_result = find_quote_timestamp_range_from_structured(quote, structured_transcript)
    return range_result["start"] if range_result else None

def find_quote_timestamp(quote: str, timestamped_lines: List[Tuple[str, str]]) -> Optional[str]:
    """
    Find the timestamp for a given quote by matching it with the transcript.
    
    Args:
        quote: The quote to find
        timestamped_lines: List of (timestamp, text) tuples from the transcript
        
    Returns:
        The timestamp if found, None otherwise
    """
    # Normalize the quote for matching
    clean_quote = normalize_text(quote)
    print(f"Looking for quote: {clean_quote[:100]}...")
    
    # Try exact matching first
    for timestamp, text in timestamped_lines:
        clean_text = normalize_text(text)
        
        # Check if the quote is in this text
        if clean_quote in clean_text:
            print(f"Found exact match at {timestamp}: {clean_text[:100]}...")
            return timestamp
    
    # Try partial matching with word overlap
    quote_words = set(clean_quote.split())
    if not quote_words:
        return None
        
    best_match = None
    best_timestamp = None
    best_overlap = 0
    
    for timestamp, text in timestamped_lines:
        clean_text = normalize_text(text)
        text_words = set(clean_text.split())
        
        if text_words:
            # Calculate word overlap
            overlap = len(quote_words.intersection(text_words)) / len(quote_words)
            # Also consider how much of the text matches the quote
            text_overlap = len(quote_words.intersection(text_words)) / len(text_words)
            
            # Use a combination of both overlaps
            combined_overlap = (overlap + text_overlap) / 2
            
            if combined_overlap > 0.5 and combined_overlap > best_overlap:
                best_overlap = combined_overlap
                best_timestamp = timestamp
                best_match = clean_text
    
    # Return best fuzzy match if found
    if best_timestamp:
        print(f"Found fuzzy match at {best_timestamp} with overlap {best_overlap}: {best_match[:100]}...")
        return best_timestamp
    
    print("No match found")
    return None

def add_timestamps_to_quiz_data(data: Dict) -> Dict:
    """
    Add timestamps to all supporting quotes in the quiz data.
    
    Args:
        data: The quiz data dictionary
        
    Returns:
        Updated quiz data with timestamps
    """
    # Parse the transcript - handle both structured and string formats
    transcript = data.get('transcript')
    if not transcript:
        transcript = data.get('request_data', {}).get('transcript')
    
    if not transcript:
        print("No transcript found in data")
        return data
    
    # Handle structured transcript format (list of dicts)
    if isinstance(transcript, list):
        timestamped_lines = parse_structured_transcript(transcript)
    else:
        # Handle string format
        timestamped_lines = parse_transcript(transcript)
    
    print(f"Parsed {len(timestamped_lines)} timestamped lines from transcript")
    
    # Add timestamps to quiz questions
    if 'generated_quiz_questions' in data:
        quiz_data = data['generated_quiz_questions']
        
        # Process multiple choice questions
        if 'questions' in quiz_data:
            for question in quiz_data['questions']:
                if 'supporting_quote' in question:
                    print(f"\nProcessing question quote: {question['supporting_quote'][:100]}...")
                    timestamp = find_quote_timestamp(
                        question['supporting_quote'], 
                        timestamped_lines
                    )
                    if timestamp:
                        question['timestamp'] = timestamp
        
        # Skip timestamp processing for open-ended questions (no longer contain supporting_quote)
    
    # Add timestamps to results/lessons
    if 'results' in data:
        for result in data['results']:
            if 'lessons_and_concepts' in result:
                for lesson in result['lessons_and_concepts']:
                    if 'supporting_quote' in lesson:
                        print(f"\nProcessing lesson quote: {lesson['supporting_quote'][:100]}...")
                        timestamp = find_quote_timestamp(
                            lesson['supporting_quote'], 
                            timestamped_lines
                        )
                        if timestamp:
                            lesson['quote_timestamp'] = timestamp
    
    return data

def add_timestamps_to_actionable_takeaways(actionable_takeaways: List[Dict], structured_transcript: List[Dict]) -> List[Dict]:
    """
    Add quote_timestamp to actionable_takeaways entries based on structured transcript.
    
    Args:
        actionable_takeaways: List of takeaway objects with supporting_quote fields
        structured_transcript: List of transcript entries with start, duration, text fields
        
    Returns:
        Updated actionable_takeaways with quote_timestamp fields added
    """
    
    if not actionable_takeaways:
        return actionable_takeaways
        
    if not structured_transcript:
        return actionable_takeaways
    
    # Validate transcript format
    if not isinstance(structured_transcript, list):
        print(f"[ERROR] structured_transcript should be a list, got {type(structured_transcript)}")
        return actionable_takeaways
        
    # Check first entry format
    if len(structured_transcript) > 0:
        first_entry = structured_transcript[0]
        if not isinstance(first_entry, dict) or 'start' not in first_entry or 'text' not in first_entry:
            print(f"[ERROR] Invalid transcript entry format. Expected dict with 'start' and 'text', got: {first_entry}")
            return actionable_takeaways
    
    # Create a copy to avoid modifying the original
    updated_takeaways = []
    timestamps_found = 0
    
    for i, takeaway in enumerate(actionable_takeaways):
        updated_takeaway = takeaway.copy()
        
        if not isinstance(takeaway, dict):
            print(f"[WARNING] Takeaway {i} is not a dictionary: {type(takeaway)}")
            updated_takeaways.append(updated_takeaway)
            continue
            
        if 'supporting_quote' not in takeaway:
            print(f"[WARNING] Takeaway {i} missing supporting_quote field. Keys: {list(takeaway.keys())}")
            updated_takeaways.append(updated_takeaway)
            continue
            
        supporting_quote = takeaway['supporting_quote']
        if not supporting_quote:
            print(f"[WARNING] Takeaway {i} has empty supporting_quote")
            updated_takeaways.append(updated_takeaway)
            continue
        
        # Find timestamp range for this quote
        try:
            timestamp_range = find_quote_timestamp_range_from_structured(supporting_quote, structured_transcript)
            
            if timestamp_range:
                updated_takeaway['quote_timestamp'] = timestamp_range
                timestamps_found += 1
                print(f"[+] Added timestamp range {timestamp_range['start']} - {timestamp_range['end']} (duration: {timestamp_range['duration']}) to takeaway quote: {supporting_quote[:50]}...")
            else:
                print(f"[-] No timestamp found for takeaway quote: {supporting_quote[:50]}...")
        except Exception as e:
            print(f"[ERROR] Failed to extract timestamp for takeaway {i}: {e}")
        
        updated_takeaways.append(updated_takeaway)
    
    print(f"[SUMMARY] Successfully added timestamps to {timestamps_found}/{len(actionable_takeaways)} actionable takeaways")
    return updated_takeaways

def add_timestamps_to_lessons_and_concepts(lessons_and_concepts: List[Dict], structured_transcript: List[Dict]) -> List[Dict]:
    """
    Add quote_timestamp to lessons_and_concepts entries based on structured transcript.
    
    Args:
        lessons_and_concepts: List of lesson objects with supporting_quote fields
        structured_transcript: List of transcript entries with start, duration, text fields
        
    Returns:
        Updated lessons_and_concepts with quote_timestamp fields added
    """
    
    if not lessons_and_concepts:
        return lessons_and_concepts
        
    if not structured_transcript:
        return lessons_and_concepts
    
    # Validate transcript format
    if not isinstance(structured_transcript, list):
        print(f"[ERROR] structured_transcript should be a list, got {type(structured_transcript)}")
        return lessons_and_concepts
        
    # Check first entry format
    if len(structured_transcript) > 0:
        first_entry = structured_transcript[0]
        if not isinstance(first_entry, dict) or 'start' not in first_entry or 'text' not in first_entry:
            print(f"[ERROR] Invalid transcript entry format. Expected dict with 'start' and 'text', got: {first_entry}")
            return lessons_and_concepts
    
    # Create a copy to avoid modifying the original
    updated_lessons = []
    timestamps_found = 0
    
    for i, lesson in enumerate(lessons_and_concepts):
        updated_lesson = lesson.copy()
        
        if not isinstance(lesson, dict):
            print(f"[WARNING] Lesson {i} is not a dictionary: {type(lesson)}")
            updated_lessons.append(updated_lesson)
            continue
            
        if 'supporting_quote' not in lesson:
            print(f"[WARNING] Lesson {i} missing supporting_quote field. Keys: {list(lesson.keys())}")
            updated_lessons.append(updated_lesson)
            continue
            
        supporting_quote = lesson['supporting_quote']
        if not supporting_quote:
            print(f"[WARNING] Lesson {i} has empty supporting_quote")
            updated_lessons.append(updated_lesson)
            continue
        
        # Find timestamp range for this quote
        try:
            timestamp_range = find_quote_timestamp_range_from_structured(supporting_quote, structured_transcript)
            
            if timestamp_range:
                updated_lesson['quote_timestamp'] = timestamp_range
                timestamps_found += 1
                print(f"[+] Added timestamp range {timestamp_range['start']} - {timestamp_range['end']} (duration: {timestamp_range['duration']}) to lesson quote: {supporting_quote[:50]}...")
            else:
                print(f"[-] No timestamp found for lesson quote: {supporting_quote[:50]}...")
        except Exception as e:
            print(f"[ERROR] Failed to extract timestamp for lesson {i}: {e}")
        
        updated_lessons.append(updated_lesson)
    
    print(f"[SUMMARY] Successfully added timestamps to {timestamps_found}/{len(lessons_and_concepts)} lessons")
    return updated_lessons


# Example usage
if __name__ == "__main__":
    import os
    # Load the sample data
    file_path = os.path.join('..', '..', 'output_result.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Add timestamps
    updated_data = add_timestamps_to_quiz_data(data)
    
    # Print some results to verify
    print("\nQuiz questions with timestamps:")
    if 'generated_quiz_questions' in updated_data:
        quiz_data = updated_data['generated_quiz_questions']
        if 'questions' in quiz_data:
            for i, question in enumerate(quiz_data['questions']):
                print(f"Question {i+1}:")
                print(f"  Quote: {question.get('supporting_quote', 'N/A')}")
                print(f"  Timestamp: {question.get('timestamp', 'N/A')}")
                print()
    
    print("Lessons with timestamps:")
    if 'results' in updated_data:
        for result in updated_data['results']:
            if 'lessons_and_concepts' in result:
                for i, lesson in enumerate(result['lessons_and_concepts']):
                    print(f"Lesson {i+1}:")
                    print(f"  Quote: {lesson.get('supporting_quote', 'N/A')}")
                    print(f"  Timestamp: {lesson.get('timestamp', 'N/A')}")
                    print()