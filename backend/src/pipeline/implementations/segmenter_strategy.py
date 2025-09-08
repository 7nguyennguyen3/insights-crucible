"""
Strategy pattern implementation for transcript segmentation.
"""

from typing import List, Dict, Any
from rich import print

from ..interfaces import TranscriptSegmenter, TranscriptUtterance, TranscriptSection
from ..services.transcript import (
    DynamicWordSegmenter,
    TimeBasedSegmenter, 
    MonologueSegmenter,
)


class SegmenterStrategy(TranscriptSegmenter):
    """
    Strategy pattern implementation that chooses the appropriate segmentation
    method based on the characteristics of the input transcript.
    """
    
    def __init__(
        self,
        word_segmenter: DynamicWordSegmenter,
        time_segmenter: TimeBasedSegmenter,
        monologue_segmenter: MonologueSegmenter,
    ):
        self.word_segmenter = word_segmenter
        self.time_segmenter = time_segmenter
        self.monologue_segmenter = monologue_segmenter
    
    def segment(
        self, 
        transcript: List[TranscriptUtterance], 
        **kwargs
    ) -> List[TranscriptSection]:
        """
        Choose segmentation strategy based on transcript characteristics.
        """
        # Check for monologue with word-level data
        assembly_words = kwargs.get('assembly_words')
        if (assembly_words and 
            len(transcript) == 1 and 
            len(transcript[0].text.split()) > 150):
            print("[cyan]Long monologue detected. Using high-precision word-level segmentation...[/cyan]")
            return self.monologue_segmenter.segment(assembly_words, **kwargs)
        
        # Check for timestamped transcript
        has_valid_timestamps = (
            transcript and 
            transcript[-1].end_seconds > 0 and
            any(utt.start_seconds >= 0 for utt in transcript)
        )
        
        if has_valid_timestamps:
            print("[cyan]Timestamped transcript detected. Using dynamic time-based segmentation...[/cyan]")
            total_duration = transcript[-1].end_seconds
            print(f"  -> Content length is ~{total_duration // 60} minutes.")
            return self.time_segmenter.segment(transcript, **kwargs)
        
        # Default to word-based segmentation
        print("[cyan]Plain text detected. Using dynamic word-count segmentation...[/cyan]")
        return self.word_segmenter.segment(transcript, **kwargs)