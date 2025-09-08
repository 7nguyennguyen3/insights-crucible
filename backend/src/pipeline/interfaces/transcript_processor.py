"""
Abstract interfaces for transcript processing.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class TranscriptUtterance:
    """Canonical transcript utterance format."""
    speaker_id: str
    start_seconds: int
    end_seconds: int
    text: str


@dataclass
class TranscriptSection:
    """A section of transcript utterances."""
    utterances: List[TranscriptUtterance]
    start_time: int
    end_time: int
    
    @property
    def duration_seconds(self) -> int:
        return self.end_time - self.start_time
    
    @property
    def text(self) -> str:
        return " ".join(utt.text for utt in self.utterances)


class TranscriptNormalizer(ABC):
    """Abstract base class for transcript normalization."""
    
    @abstractmethod
    async def normalize(self, raw_text: str) -> List[TranscriptUtterance]:
        """Convert raw transcript text to canonical utterance format."""
        pass


class TranscriptSegmenter(ABC):
    """Abstract base class for transcript segmentation."""
    
    @abstractmethod
    def segment(
        self, 
        transcript: List[TranscriptUtterance], 
        **kwargs
    ) -> List[TranscriptSection]:
        """Segment transcript into sections based on strategy."""
        pass


class AudioProcessor(ABC):
    """Abstract base class for audio processing and transcription."""
    
    @abstractmethod
    async def transcribe(
        self, 
        storage_path: str, 
        model_name: str = "universal"
    ) -> Dict[str, Any]:
        """Transcribe audio file and return structured result."""
        pass