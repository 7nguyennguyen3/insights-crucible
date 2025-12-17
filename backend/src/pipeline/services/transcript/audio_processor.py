"""
Audio processing and transcription service.
"""

import os
import asyncio
import time
import json
from datetime import datetime
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
        self, storage_path: str, model_name: str = "universal"
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

            # Download audio from GCS
            download_start = time.time()
            bucket = self.gcs_client.bucket(self.bucket_name)
            blob = bucket.blob(storage_path)
            audio_bytes = await asyncio.to_thread(blob.download_as_bytes)
            download_time = time.time() - download_start
            print(f"   [dim]⏱️  Downloaded from GCS: {download_time:.2f}s[/dim]")

            headers = {"authorization": self.api_key}

            # Upload audio to AssemblyAI
            upload_start = time.time()
            upload_response = await self.httpx_client.post(
                "https://api.assemblyai.com/v2/upload",
                headers=headers,
                content=audio_bytes,
            )
            upload_response.raise_for_status()
            audio_url = upload_response.json()["upload_url"]
            upload_time = time.time() - upload_start
            print(f"   [dim]⏱️  Uploaded to AssemblyAI: {upload_time:.2f}s[/dim]")

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

            # Poll for completion
            poll_start = time.time()
            poll_count = 0
            while True:
                poll_count += 1
                await asyncio.sleep(5)
                poll_endpoint = (
                    f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
                )
                poll_response = await self.httpx_client.get(
                    poll_endpoint, headers=headers
                )
                poll_response.raise_for_status()
                result = poll_response.json()

                if result["status"] == "completed":
                    poll_time = time.time() - poll_start
                    total_time = time.time() - start_time
                    print(
                        f"   [dim]⏱️  Polling: {poll_time:.2f}s ({poll_count} requests)[/dim]"
                    )
                    print(
                        f"   [bold yellow]⏱️  TOTAL TIME: {total_time:.2f}s[/bold yellow]"
                    )
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
                            "utterances": [
                                {"speaker": "A", "text": result.get("text", "")}
                            ],
                            "text": result.get("text", ""),
                            "audio_duration": audio_duration,
                        }

                    print(
                        f"[bold green]LOG:[/bold green] "
                        f"Diarization successful. Found {len(result['utterances'])} utterances."
                    )

                    # Save AssemblyAI response to JSON file for debugging
                    try:
                        debug_dir = os.path.join(os.getcwd(), "debug_assemblyai")
                        os.makedirs(debug_dir, exist_ok=True)

                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        debug_filename = f"assemblyai_response_{transcript_id}_{timestamp}.json"
                        debug_path = os.path.join(debug_dir, debug_filename)

                        # Create debug data with metadata
                        debug_data = {
                            "metadata": {
                                "transcript_id": transcript_id,
                                "timestamp": datetime.now().isoformat(),
                                "storage_path": storage_path,
                                "model_name": model_name,
                                "audio_duration": audio_duration,
                                "utterance_count": len(result.get('utterances', [])),
                                "has_words": "words" in result,
                                "words_count": len(result.get('words', [])) if 'words' in result else 0
                            },
                            "assemblyai_response": result
                        }

                        with open(debug_path, 'w', encoding='utf-8') as f:
                            json.dump(debug_data, f, indent=2, ensure_ascii=False)

                        print(f"[bold yellow]DEBUG:[/bold yellow] Saved AssemblyAI response to {debug_path}")
                    except Exception as e:
                        print(f"[bold red]WARNING:[/bold red] Failed to save debug file: {e}")

                    return result

                elif result["status"] == "failed":
                    raise Exception(
                        f"AssemblyAI transcription failed: {result.get('error')}"
                    )

        except httpx.HTTPStatusError as e:
            print(
                f"[bold red]API Error:[/bold red] {e.response.status_code} - {e.response.text}"
            )
            raise
        except Exception as e:
            print(f"[bold red]An unexpected error occurred:[/bold red] {e}")
            raise
