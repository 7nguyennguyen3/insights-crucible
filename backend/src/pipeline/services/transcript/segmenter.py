"""
Transcript segmentation services.
"""

from typing import List, Dict
from rich import print
from rich.panel import Panel

from ...interfaces import TranscriptSegmenter, TranscriptUtterance, TranscriptSection
from ...config.constants import DEFAULT_WORDS_PER_SECTION, MERGE_THRESHOLD_RATIO
from ...utils import (
    calculate_dynamic_words_per_section,
    calculate_dynamic_section_duration,
)


class WordCountSegmenter(TranscriptSegmenter):
    """Segments transcript by word count."""
    
    def __init__(self, words_per_section: int = None):
        self.words_per_section = words_per_section or DEFAULT_WORDS_PER_SECTION
    
    def segment(
        self, 
        transcript: List[TranscriptUtterance], 
        **kwargs
    ) -> List[TranscriptSection]:
        """Segment transcript by word count."""
        words_per_section = kwargs.get('words_per_section', self.words_per_section)
        
        print(f"[cyan]🚀 Word-count segmentation ({words_per_section} words/section)...[/cyan]")
        
        # Combine all text
        full_text = " ".join(utt.text for utt in transcript)
        words = full_text.split()
        total_words = len(words)
        
        print(
            Panel(
                f"Total word count detected: [bold cyan]{total_words}[/bold cyan]",
                title="[yellow]Text Analysis[/yellow]",
                border_style="yellow",
                expand=False,
            )
        )
        
        if total_words < words_per_section:
            print("[yellow]Warning: Total words less than words_per_section. One section only.[/yellow]")
        
        sections = []
        start_index = 0
        section_num = 1
        
        while start_index < total_words:
            end_index = start_index + words_per_section
            section_words = words[start_index:end_index]
            section_text = " ".join(section_words)
            
            # Create section with single utterance
            utterance = TranscriptUtterance(
                speaker_id="Narrator",
                start_seconds=-1,
                end_seconds=-1,
                text=section_text,
            )
            
            section = TranscriptSection(
                utterances=[utterance],
                start_time=-1,
                end_time=-1,
            )
            sections.append(section)
            
            print(
                Panel(
                    f"Created Section #{section_num}\n"
                    f"  - Word Range: {start_index} - {min(end_index, total_words)}\n"
                    f"  - Word Count: {len(section_words)}",
                    title="[blue]Section Creation[/blue]",
                    border_style="blue",
                    expand=False,
                )
            )
            
            start_index = end_index
            section_num += 1
        
        print(f"[green]✓ Text split into {len(sections)} sections by word count.[/green]")
        return sections


class DynamicWordSegmenter(WordCountSegmenter):
    """Segments transcript using dynamic word count calculation."""
    
    def segment(
        self, 
        transcript: List[TranscriptUtterance], 
        **kwargs
    ) -> List[TranscriptSection]:
        """Segment with dynamically calculated word count."""
        full_text = " ".join(utt.text for utt in transcript)
        total_chars = len(full_text)
        
        dynamic_words_per_section = calculate_dynamic_words_per_section(total_chars)
        
        print(f"[cyan]Dynamic word count calculated: {dynamic_words_per_section} words/section[/cyan]")
        
        return super().segment(
            transcript, 
            words_per_section=dynamic_words_per_section,
            **kwargs
        )


class TimeBasedSegmenter(TranscriptSegmenter):
    """Segments transcript by duration with intelligent merging."""
    
    def __init__(self, target_duration: int = None):
        self.target_duration = target_duration
    
    def segment(
        self, 
        transcript: List[TranscriptUtterance], 
        **kwargs
    ) -> List[TranscriptSection]:
        """Segment transcript by duration."""
        target_duration = kwargs.get('target_duration', self.target_duration)
        
        if not target_duration:
            # Calculate dynamic duration
            if transcript and transcript[-1].end_seconds > 0:
                total_duration = transcript[-1].end_seconds
                target_duration = calculate_dynamic_section_duration(total_duration)
            else:
                raise ValueError("No target duration provided and cannot calculate from transcript")
        
        print(f"[cyan]🚀 Time-based segmentation ({target_duration}s/section)...[/cyan]")
        
        if not transcript:
            return []
        
        sections = []
        current_utterances = []
        
        for utterance in transcript:
            current_utterances.append(utterance)
            
            if not current_utterances:
                continue
                
            section_start_time = current_utterances[0].start_seconds
            section_end_time = current_utterances[-1].end_seconds
            current_duration = section_end_time - section_start_time
            
            if current_duration >= target_duration:
                section = TranscriptSection(
                    utterances=current_utterances.copy(),
                    start_time=section_start_time,
                    end_time=section_end_time,
                )
                sections.append(section)
                current_utterances = []
        
        # Handle remaining utterances with intelligent merging
        if current_utterances:
            final_duration = (
                current_utterances[-1].end_seconds - current_utterances[0].start_seconds
            )
            
            # If final section is very short, merge with previous
            if sections and final_duration < (target_duration * MERGE_THRESHOLD_RATIO):
                print(
                    f"[yellow]Final section is short ({final_duration}s). "
                    f"Merging with previous section...[/yellow]"
                )
                sections[-1].utterances.extend(current_utterances)
                sections[-1].end_time = current_utterances[-1].end_seconds
            else:
                section = TranscriptSection(
                    utterances=current_utterances,
                    start_time=current_utterances[0].start_seconds,
                    end_time=current_utterances[-1].end_seconds,
                )
                sections.append(section)
        
        if not sections and transcript:
            # Fallback: create single section
            section = TranscriptSection(
                utterances=transcript,
                start_time=transcript[0].start_seconds,
                end_time=transcript[-1].end_seconds,
            )
            sections = [section]
        
        print(f"[green]✓ Transcript split into {len(sections)} time-based sections.[/green]")
        return sections


class MonologueSegmenter(TranscriptSegmenter):
    """Segments monologue using word-level timestamps."""
    
    def __init__(self, words_per_section: int = DEFAULT_WORDS_PER_SECTION):
        self.words_per_section = words_per_section
    
    def segment(
        self, 
        assembly_words: List[Dict], 
        **kwargs
    ) -> List[TranscriptSection]:
        """
        Segments a monologue using AssemblyAI's word-level timestamps.
        """
        words_per_section = kwargs.get('words_per_section', self.words_per_section)
        
        print(f"[cyan]🚀 High-precision monologue segmentation ({words_per_section} words/section)...[/cyan]")
        
        if not assembly_words:
            return []
        
        sections = []
        for i in range(0, len(assembly_words), words_per_section):
            word_chunk = assembly_words[i : i + words_per_section]
            if not word_chunk:
                continue
            
            start_time_ms = word_chunk[0]["start"]
            end_time_ms = word_chunk[-1]["end"]
            section_text = " ".join(word["text"] for word in word_chunk)
            
            utterance = TranscriptUtterance(
                speaker_id="Speaker A",  # Monologue is always one speaker
                start_seconds=start_time_ms // 1000,
                end_seconds=end_time_ms // 1000,
                text=section_text,
            )
            
            section = TranscriptSection(
                utterances=[utterance],
                start_time=start_time_ms // 1000,
                end_time=end_time_ms // 1000,
            )
            sections.append(section)
        
        print(f"[green]✓ Monologue split into {len(sections)} high-precision sections.[/green]")
        return sections