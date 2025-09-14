"""
Unit tests for text processing utilities in pipeline/utils/text_processing.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import unittest
from unittest.mock import patch, Mock
import math

# Mock the config constants module
with patch.dict('sys.modules', {
    '..config.constants': Mock()
}):
    # Create mock constants
    mock_constants = Mock()
    mock_constants.CHARS_PER_WORD = 5
    mock_constants.MIN_SECTIONS = 3
    mock_constants.MAX_SECTIONS = 10
    mock_constants.MIN_WORDS_FOR_SPLIT = 100
    mock_constants.SCALE_START_WORDS = 500
    mock_constants.SCALE_END_WORDS = 5000
    mock_constants.MIN_DURATION_SECONDS = 300
    mock_constants.SCALE_START_DURATION = 600
    mock_constants.SCALE_END_DURATION = 3600
    
    sys.modules['pipeline.config.constants'] = mock_constants
    
    from pipeline.utils.text_processing import (
        clean_line_for_analysis,
        get_normalized_cache_key,
        calculate_dynamic_words_per_section,
        calculate_dynamic_section_duration
    )


class TestCleanLineForAnalysis(unittest.TestCase):
    """Test clean_line_for_analysis function."""
    
    def test_clean_line_basic_timestamp(self):
        """Test cleaning line with basic timestamp."""
        input_line = "This is some text 05:30 with timestamp"
        expected = "This is some text with timestamp"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_multiple_timestamps(self):
        """Test cleaning line with multiple timestamps."""
        input_line = "Start 01:15 middle 03:45 end 12:30 text"
        expected = "Start middle end text"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_hms_format(self):
        """Test cleaning line with HH:MM:SS format timestamp."""
        input_line = "Text with 01:23:45 longer timestamp"
        expected = "Text with longer timestamp"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_no_timestamps(self):
        """Test cleaning line with no timestamps."""
        input_line = "This line has no timestamps"
        expected = "This line has no timestamps"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_empty_string(self):
        """Test cleaning empty string."""
        input_line = ""
        expected = ""
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_only_timestamp(self):
        """Test cleaning line that is only a timestamp."""
        input_line = "05:30"
        expected = ""
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_timestamp_with_spaces(self):
        """Test cleaning line with timestamp surrounded by spaces."""
        input_line = "Text   05:30   more text"
        expected = "Text more text"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_timestamp_at_start(self):
        """Test cleaning line with timestamp at start."""
        input_line = "05:30 This text starts with timestamp"
        expected = "This text starts with timestamp"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_timestamp_at_end(self):
        """Test cleaning line with timestamp at end."""
        input_line = "This text ends with timestamp 05:30"
        expected = "This text ends with timestamp"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)
    
    def test_clean_line_malformed_timestamps(self):
        """Test cleaning line with malformed timestamps that shouldn't match."""
        input_line = "Text with 5:30 and 05:3 and 123:45 timestamps"
        expected = "Text with 5:30 and 05:3 and 123:45 timestamps"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)  # These shouldn't be cleaned as they don't match pattern
    
    def test_clean_line_valid_edge_cases(self):
        """Test cleaning line with valid edge case timestamps."""
        input_line = "Text 00:00 and 99:59 and 00:00:01 and 23:59:59"
        expected = "Text and and and"
        result = clean_line_for_analysis(input_line)
        self.assertEqual(result, expected)


class TestGetNormalizedCacheKey(unittest.TestCase):
    """Test get_normalized_cache_key function."""
    
    def test_normalize_basic_string(self):
        """Test normalizing a basic string."""
        input_name = "Chief Marketing Officer"
        expected = "chief-marketing-officer"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_with_underscores(self):
        """Test normalizing string with underscores."""
        input_name = "data_scientist_role"
        expected = "data-scientist-role"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_with_dots(self):
        """Test normalizing string with dots."""
        input_name = "Dr. John Smith Jr."
        expected = "dr-john-smith-jr"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_with_special_characters(self):
        """Test normalizing string with various special characters."""
        input_name = "CEO & Founder (Tech)"
        expected = "ceo-founder-tech"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_multiple_spaces(self):
        """Test normalizing string with multiple consecutive spaces."""
        input_name = "Software    Engineer    Lead"
        expected = "software-engineer-lead"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_leading_trailing_spaces(self):
        """Test normalizing string with leading/trailing whitespace."""
        input_name = "   Product Manager   "
        expected = "product-manager"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_empty_string(self):
        """Test normalizing empty string."""
        input_name = ""
        result = get_normalized_cache_key(input_name)
        self.assertIsNone(result)
    
    def test_normalize_none_input(self):
        """Test normalizing None input."""
        input_name = None
        result = get_normalized_cache_key(input_name)
        self.assertIsNone(result)
    
    def test_normalize_only_special_characters(self):
        """Test normalizing string with only special characters."""
        input_name = "!@#$%^&*()"
        expected = ""
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_numbers_and_letters(self):
        """Test normalizing string with numbers and letters."""
        input_name = "Engineer Level 2"
        expected = "engineer-level-2"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_mixed_case(self):
        """Test normalizing string with mixed case."""
        input_name = "SenIoR DevElOper"
        expected = "senior-developer"
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)
    
    def test_normalize_unicode_characters(self):
        """Test normalizing string with unicode characters."""
        input_name = "Señor Engineer"
        expected = "seor-engineer"  # Non-ASCII characters removed
        result = get_normalized_cache_key(input_name)
        self.assertEqual(result, expected)


class TestCalculateDynamicWordsPerSection(unittest.TestCase):
    """Test calculate_dynamic_words_per_section function."""
    
    def test_very_short_text(self):
        """Test calculation for very short text."""
        # Text with 50 characters (10 words at 5 chars per word)
        total_characters = 50
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should return words + 1 to ensure only one section
        expected = 11  # 10 words + 1
        self.assertEqual(result, expected)
    
    def test_short_text_below_split_threshold(self):
        """Test calculation for text below minimum split threshold."""
        # Text with 400 characters (80 words) - below MIN_WORDS_FOR_SPLIT (100)
        total_characters = 400
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should return words + 1 to ensure only one section
        expected = 81  # 80 words + 1
        self.assertEqual(result, expected)
    
    def test_text_at_scale_start(self):
        """Test calculation for text at scale start threshold."""
        # Text with 2500 characters (500 words) - at SCALE_START_WORDS
        total_characters = 2500
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should target MIN_SECTIONS (3), so 500 / 3 = 166.67, rounded up to 167
        expected = math.ceil(500 / 3)
        self.assertEqual(result, expected)
    
    def test_text_at_scale_end(self):
        """Test calculation for text at scale end threshold."""
        # Text with 25000 characters (5000 words) - at SCALE_END_WORDS
        total_characters = 25000
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should target MAX_SECTIONS (10), so 5000 / 10 = 500
        expected = 500
        self.assertEqual(result, expected)
    
    def test_text_above_scale_end(self):
        """Test calculation for very long text above scale end."""
        # Text with 50000 characters (10000 words) - above SCALE_END_WORDS
        total_characters = 50000
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should still target MAX_SECTIONS (10), so 10000 / 10 = 1000
        expected = 1000
        self.assertEqual(result, expected)
    
    def test_text_in_scale_range(self):
        """Test calculation for text in the middle of scale range."""
        # Text with 12500 characters (2500 words) - middle of scale range
        total_characters = 12500
        total_words = 2500
        
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should interpolate between MIN_SECTIONS and MAX_SECTIONS
        # Progress = (2500 - 500) / (5000 - 500) = 2000 / 4500 ≈ 0.444
        # Target sections = 3 + 0.444 * (10 - 3) = 3 + 0.444 * 7 ≈ 6.11
        # Rounded up = 7 sections
        # Words per section = 2500 / 7 ≈ 357.14, rounded up = 358
        progress = (total_words - 500) / (5000 - 500)
        target_sections = 3 + progress * (10 - 3)
        final_sections = math.ceil(target_sections)
        expected = math.ceil(total_words / final_sections)
        
        self.assertEqual(result, expected)
    
    def test_zero_characters(self):
        """Test calculation for zero characters."""
        total_characters = 0
        result = calculate_dynamic_words_per_section(total_characters)
        
        # Should return 1 to avoid division by zero
        expected = 1
        self.assertEqual(result, expected)
    
    def test_edge_case_one_character(self):
        """Test calculation for one character."""
        total_characters = 1
        result = calculate_dynamic_words_per_section(total_characters)
        
        # 1 character = 0.2 words, below threshold, so should return 1
        expected = 1
        self.assertEqual(result, expected)


class TestCalculateDynamicSectionDuration(unittest.TestCase):
    """Test calculate_dynamic_section_duration function."""
    
    def test_very_short_duration(self):
        """Test calculation for very short duration."""
        # 200 seconds - below MIN_DURATION_SECONDS (300)
        total_duration = 200
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should return duration + 1 to ensure only one section
        expected = 201
        self.assertEqual(result, expected)
    
    def test_duration_at_scale_start(self):
        """Test calculation for duration at scale start threshold."""
        # 600 seconds - at SCALE_START_DURATION
        total_duration = 600
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should target MIN_SECTIONS (3), so 600 / 3 = 200
        expected = math.ceil(600 / 3)
        self.assertEqual(result, expected)
    
    def test_duration_at_scale_end(self):
        """Test calculation for duration at scale end threshold."""
        # 3600 seconds - at SCALE_END_DURATION
        total_duration = 3600
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should target MAX_SECTIONS (10), so 3600 / 10 = 360
        expected = math.ceil(3600 / 10)
        self.assertEqual(result, expected)
    
    def test_duration_above_scale_end(self):
        """Test calculation for very long duration above scale end."""
        # 7200 seconds - above SCALE_END_DURATION
        total_duration = 7200
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should still target MAX_SECTIONS (10), so 7200 / 10 = 720
        expected = math.ceil(7200 / 10)
        self.assertEqual(result, expected)
    
    def test_duration_in_scale_range(self):
        """Test calculation for duration in the middle of scale range."""
        # 1800 seconds - middle of scale range
        total_duration = 1800
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should interpolate between MIN_SECTIONS and MAX_SECTIONS
        # Progress = (1800 - 600) / (3600 - 600) = 1200 / 3000 = 0.4
        # Target sections = 3 + 0.4 * (10 - 3) = 3 + 0.4 * 7 = 5.8
        # Duration per section = 1800 / 5.8 ≈ 310.34, rounded up = 311
        progress = (total_duration - 600) / (3600 - 600)
        target_sections = 3 + progress * (10 - 3)
        expected = math.ceil(total_duration / target_sections)
        
        self.assertEqual(result, expected)
    
    def test_zero_duration(self):
        """Test calculation for zero duration."""
        total_duration = 0
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should return 1 to avoid division by zero
        expected = 1
        self.assertEqual(result, expected)
    
    def test_duration_below_minimum(self):
        """Test calculation for duration below minimum threshold."""
        # 100 seconds - below MIN_DURATION_SECONDS (300)
        total_duration = 100
        result = calculate_dynamic_section_duration(total_duration)
        
        # Should return duration + 1
        expected = 101
        self.assertEqual(result, expected)
    
    def test_duration_edge_cases(self):
        """Test calculation for various edge case durations."""
        # Test at exact thresholds
        test_cases = [
            (299, 300),  # Just below minimum
            (300, 100),  # At minimum (300 / 3 = 100)
            (601, 201),  # Just above scale start (601 / 3 ≈ 200.33, ceil = 201)
            (3599, 360), # Just below scale end
        ]
        
        for duration, expected_base in test_cases:
            result = calculate_dynamic_section_duration(duration)
            # Allow for ceiling function variations
            self.assertGreaterEqual(result, expected_base - 1)
            self.assertLessEqual(result, expected_base + 1)


class TestTextProcessingIntegration(unittest.TestCase):
    """Test integration scenarios for text processing utilities."""
    
    def test_function_imports(self):
        """Test that all functions are properly imported."""
        # Verify functions exist and are callable
        self.assertTrue(callable(clean_line_for_analysis))
        self.assertTrue(callable(get_normalized_cache_key))
        self.assertTrue(callable(calculate_dynamic_words_per_section))
        self.assertTrue(callable(calculate_dynamic_section_duration))
    
    def test_realistic_content_processing(self):
        """Test processing realistic content with multiple functions."""
        # Simulate processing a realistic piece of content
        content_lines = [
            "00:30 Welcome to our discussion about machine learning",
            "02:15 Today we'll cover Deep Learning algorithms",
            "05:45 Neural networks are fundamental to AI",
            "10:20 Let's discuss the CEO & CTO perspectives"
        ]
        
        # Clean all lines
        cleaned_lines = [clean_line_for_analysis(line) for line in content_lines]
        expected_cleaned = [
            "Welcome to our discussion about machine learning",
            "Today we'll cover Deep Learning algorithms",
            "Neural networks are fundamental to AI",
            "Let's discuss the CEO & CTO perspectives"
        ]
        self.assertEqual(cleaned_lines, expected_cleaned)
        
        # Calculate section parameters
        total_content = " ".join(cleaned_lines)
        total_chars = len(total_content)
        words_per_section = calculate_dynamic_words_per_section(total_chars)
        
        # Should handle small content appropriately
        self.assertGreater(words_per_section, 0)
        
        # Normalize entity names that might be extracted
        entities = ["CEO & CTO", "Deep Learning", "Neural Networks"]
        normalized_entities = [get_normalized_cache_key(entity) for entity in entities]
        expected_normalized = ["ceo-cto", "deep-learning", "neural-networks"]
        self.assertEqual(normalized_entities, expected_normalized)
    
    def test_scaling_behavior_consistency(self):
        """Test that scaling functions behave consistently across ranges."""
        # Test that larger inputs generally result in proportionally larger sections
        small_chars = 1000   # 200 words
        medium_chars = 10000 # 2000 words  
        large_chars = 30000  # 6000 words
        
        small_words_per_section = calculate_dynamic_words_per_section(small_chars)
        medium_words_per_section = calculate_dynamic_words_per_section(medium_chars)
        large_words_per_section = calculate_dynamic_words_per_section(large_chars)
        
        # Larger content should generally have larger sections (more words per section)
        self.assertLess(small_words_per_section, large_words_per_section)
        
        # Test duration scaling similarly
        small_duration = 300    # 5 minutes
        medium_duration = 1800  # 30 minutes
        large_duration = 5400   # 90 minutes
        
        small_section_duration = calculate_dynamic_section_duration(small_duration)
        medium_section_duration = calculate_dynamic_section_duration(medium_duration)
        large_section_duration = calculate_dynamic_section_duration(large_duration)
        
        # Larger total duration should generally have larger section durations
        self.assertLess(small_section_duration, large_section_duration)


if __name__ == "__main__":
    unittest.main(verbosity=2)