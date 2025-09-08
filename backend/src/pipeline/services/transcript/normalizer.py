"""
Transcript normalization service.
"""

import re
from typing import List, Dict
from rich import print

from ...interfaces import TranscriptNormalizer, TranscriptUtterance
from ...utils import parse_and_normalize_time


class DefaultTranscriptNormalizer(TranscriptNormalizer):
    """Default implementation of transcript normalization."""
    
    async def normalize(self, raw_text: str) -> List[TranscriptUtterance]:
        """
        Takes raw, messy transcript text and converts it into clean, 
        canonical utterance objects.
        """
        print("[cyan]Starting transcript normalization...[/cyan]")
        lines = raw_text.strip().splitlines()
        
        print(f"[bold yellow]DEBUG: Number of lines detected: {len(lines)}[/bold yellow]")
        
        # Regex to capture timestamp, speaker, and text
        line_parser_re = re.compile(
            r"^\s*(\[[:\d.\s-]+\]|\([:\d.]+\)|[:\d.]+)\s*(?:([a-zA-Z\s\d'._-]+):)?\s*(.*)"
        )
        
        canonical_transcript = []
        current_utterance = None
        
        for line in lines:
            if not line.strip():
                continue
                
            match = line_parser_re.match(line)
            
            if match:
                # Save any pending utterance
                if current_utterance:
                    canonical_transcript.append(current_utterance)
                
                timestamp_str, speaker_str, text_str = match.groups()
                timestamp_seconds = parse_and_normalize_time(timestamp_str)
                
                ts = timestamp_seconds if timestamp_seconds is not None else -1
                current_utterance = TranscriptUtterance(
                    speaker_id=(speaker_str.strip() if speaker_str else "Speaker 1"),
                    start_seconds=ts,
                    end_seconds=ts,
                    text=text_str.strip(),
                )
            else:
                # Continuation of previous utterance's text
                if current_utterance:
                    current_utterance.text += " " + line.strip()
        
        # Add the final utterance
        if current_utterance:
            canonical_transcript.append(current_utterance)
        
        # Fallback for plain text
        if not canonical_transcript and raw_text:
            print("[yellow]No structured format detected. Treating as plain text.[/yellow]")
            canonical_transcript.append(
                TranscriptUtterance(
                    speaker_id="Narrator",
                    start_seconds=-1,
                    end_seconds=-1,
                    text=raw_text.replace("\n", " ").strip(),
                )
            )
        
        print(f"[green]✓ Normalization complete. Created {len(canonical_transcript)} utterances.[/green]")
        return canonical_transcript


class YouTubeTranscriptNormalizer(TranscriptNormalizer):
    """Normalizer for YouTube transcript format."""
    
    async def normalize(self, transcript_data: List[Dict]) -> List[TranscriptUtterance]:
        """
        Converts YouTube transcript format to canonical format.
        YouTube format: [{'text': '...', 'start': 1.23, 'duration': 4.56}, ...]
        """
        canonical_transcript = []
        
        if not isinstance(transcript_data, list):
            print("[bold red]ERROR: YouTube transcript data is not a list.[/bold red]")
            return []
        
        for item in transcript_data:
            start_seconds = item.get("start", 0)
            duration = item.get("duration", 0)
            end_seconds = start_seconds + duration
            
            canonical_transcript.append(
                TranscriptUtterance(
                    speaker_id="Speaker A",  # YouTube transcripts don't have speaker info
                    start_seconds=int(start_seconds),
                    end_seconds=int(end_seconds),
                    text=item.get("text", ""),
                )
            )
        
        print(f"[green]✓ Normalized YouTube transcript into {len(canonical_transcript)} utterances.[/green]")
        return canonical_transcript