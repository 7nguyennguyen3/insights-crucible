"""
Audio processing and transcription service.
"""

import os
import asyncio
import time
from typing import Dict, Any, List
import httpx
from rich import print
from rich.panel import Panel

from ...interfaces import AudioProcessor


class AssemblyAIProcessor(AudioProcessor):
    """AssemblyAI audio processor implementation."""
    
    def __init__(self, api_key: str, httpx_client: httpx.AsyncClient, gcs_client):
        self.api_key = api_key
        self.httpx_client = httpx_client
        self.gcs_client = gcs_client
        self.bucket_name = os.getenv("GCP_STORAGE_BUCKET_NAME")
        
        if not self.bucket_name:
            raise ValueError("GCP_STORAGE_BUCKET_NAME environment variable is required")
    
    async def transcribe(
        self, 
        storage_path: str, 
        model_name: str = "universal"
    ) -> Dict[str, Any]:
        """
        Transcribes audio from GCS path using AssemblyAI,
        requesting speaker labels and returning structured result.
        """
        print(
            Panel(
                f"[bold cyan]🎤 Transcription & Diarization Initiated[/bold cyan]\n"
                f"   - [bold]Storage Path:[/bold] {storage_path}\n"
                f"   - [bold]Model:[/bold] [yellow]{model_name}[/yellow]",
                title="[bold]AssemblyAI Transcription[/bold]",
                border_style="cyan", 
                expand=False,
            )
        )
        
        try:
            start_time = time.time()

            # Generate signed URL for direct access from GCS
            url_start = time.time()
            bucket = self.gcs_client.bucket(self.bucket_name)
            blob = bucket.blob(storage_path)

            # Generate a signed URL that expires in 1 hour
            audio_url = await asyncio.to_thread(
                blob.generate_signed_url,
                version="v4",
                expiration=3600,  # 1 hour
                method="GET"
            )
            url_time = time.time() - url_start
            print(f"   [dim]⏱️  Generated signed URL: {url_time:.2f}s[/dim]")

            headers = {"authorization": self.api_key}

            # Submit transcription request
            submit_start = time.time()
            payload = {
                "audio_url": audio_url,
                "speech_model": model_name,
                "speaker_labels": True,
            }
            submit_response = await self.httpx_client.post(
                "https://api.assemblyai.com/v2/transcript",
                json=payload,
                headers=headers,
            )
            submit_response.raise_for_status()
            transcript_id = submit_response.json()["id"]
            submit_time = time.time() - submit_start
            print(f"   [dim]⏱️  Job submission: {submit_time:.2f}s[/dim]")

            # Poll for completion with adaptive intervals
            poll_start = time.time()
            poll_interval = 1  # Start with 1 second
            max_interval = 5
            poll_count = 0
            while True:
                poll_count += 1
                await asyncio.sleep(poll_interval)
                poll_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
                poll_response = await self.httpx_client.get(poll_endpoint, headers=headers)
                poll_response.raise_for_status()
                result = poll_response.json()

                if result["status"] == "completed":
                    poll_time = time.time() - poll_start
                    total_time = time.time() - start_time
                    print(f"   [dim]⏱️  Polling: {poll_time:.2f}s ({poll_count} requests)[/dim]")
                    print(f"   [bold yellow]⏱️  TOTAL TIME: {total_time:.2f}s[/bold yellow]")
                    print("   [green]✓[/green] [dim]Polling complete.[/dim]")
                    audio_duration = result.get("audio_duration", 0)
                    
                    if audio_duration is None:
                        audio_duration = 0
                    
                    print(
                        Panel(
                            f"[bold green]Transcription Successful[/bold green]\n"
                            f"   - [bold]Duration:[/bold] {audio_duration:.2f} seconds\n"
                            f"   - [bold]Model Used:[/bold] {result.get('speech_model')}",
                            title="[bold green]Result[/bold green]",
                            border_style="green",
                            expand=False,
                        )
                    )
                    
                    # Handle case where diarization fails
                    if not result.get("utterances"):
                        print(
                            "[bold yellow]LOG:[/bold yellow] "
                            "Diarization did not return utterances. Creating fallback structure."
                        )
                        return {
                            "utterances": [{"speaker": "A", "text": result.get("text", "")}],
                            "text": result.get("text", ""),
                            "audio_duration": audio_duration,
                        }
                    
                    print(
                        f"[bold green]LOG:[/bold green] "
                        f"Diarization successful. Found {len(result['utterances'])} utterances."
                    )
                    return result
                
                elif result["status"] == "failed":
                    raise Exception(
                        f"AssemblyAI transcription failed: {result.get('error')}"
                    )

                # Gradually increase polling interval (exponential backoff)
                poll_interval = min(poll_interval * 1.5, max_interval)
        
        except httpx.HTTPStatusError as e:
            print(f"[bold red]API Error:[/bold red] {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            print(f"[bold red]An unexpected error occurred:[/bold red] {e}")
            raise