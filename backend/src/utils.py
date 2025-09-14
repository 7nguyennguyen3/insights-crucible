import re
import httpx
from typing import Dict, Optional
import os

def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various YouTube URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]*)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]*)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match and len(match.group(1)) == 11:
            return match.group(1)
    
    return None

async def fetch_youtube_metadata(video_id: str) -> Dict[str, str]:
    """Fetch YouTube video metadata using YouTube Data API v3."""
    api_key = os.getenv('YOUTUBE_API_KEY')
    
    if not api_key:
        print("WARNING: YouTube API key not found. Skipping metadata fetch.")
        return {}
    
    url = f"https://www.googleapis.com/youtube/v3/videos"
    params = {
        'id': video_id,
        'key': api_key,
        'part': 'snippet,contentDetails'
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('items'):
                print(f"WARNING: No YouTube metadata found for video ID: {video_id}")
                return {}
            
            video_item = data['items'][0]
            snippet = video_item.get('snippet', {})
            content_details = video_item.get('contentDetails', {})
            
            # Get the best available thumbnail
            thumbnails = snippet.get('thumbnails', {})
            thumbnail_url = (
                thumbnails.get('high', {}).get('url') or
                thumbnails.get('medium', {}).get('url') or
                thumbnails.get('default', {}).get('url') or
                ""
            )
            
            return {
                'title': snippet.get('title', ''),
                'channel_name': snippet.get('channelTitle', ''),
                'thumbnail_url': thumbnail_url,
                'duration': content_details.get('duration', '')
            }
            
    except Exception as e:
        print(f"ERROR: Failed to fetch YouTube metadata for video {video_id}: {e}")
        return {}

def format_iso_duration_to_readable(iso_duration: str) -> str:
    """Convert ISO 8601 duration (PT12M27S) to readable format (12:27)."""
    if not iso_duration:
        return ""
    
    # Remove PT prefix
    duration = iso_duration[2:]
    
    # Extract hours, minutes, seconds
    hours = 0
    minutes = 0
    seconds = 0
    
    # Parse hours
    if 'H' in duration:
        hours_part, duration = duration.split('H')
        hours = int(hours_part)
    
    # Parse minutes
    if 'M' in duration:
        minutes_part, duration = duration.split('M')
        minutes = int(minutes_part)
    
    # Parse seconds
    if 'S' in duration:
        seconds_part = duration.split('S')[0]
        seconds = int(seconds_part)
    
    # Format output
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"