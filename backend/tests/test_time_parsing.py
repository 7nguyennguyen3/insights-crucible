
import sys
import os
import unittest

# Ensure backend/src is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from pipeline.utils.time_parsing import format_seconds_to_timestamp

class TestTimeParsing(unittest.TestCase):
    def test_format_seconds_to_timestamp_int(self):
        self.assertEqual(format_seconds_to_timestamp(0), "00:00")
        self.assertEqual(format_seconds_to_timestamp(65), "01:05")
        self.assertEqual(format_seconds_to_timestamp(3665), "61:05") 
    
    def test_format_seconds_to_timestamp_float(self):
        # This checks the fix for float inputs
        self.assertEqual(format_seconds_to_timestamp(65.5), "01:05")
        self.assertEqual(format_seconds_to_timestamp(123.45), "02:03") 

    def test_format_seconds_to_timestamp_negative(self):
        self.assertEqual(format_seconds_to_timestamp(-1), "N/A")

if __name__ == '__main__':
    unittest.main()
