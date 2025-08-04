// src/ap/api/youtube/metadata/route.ts
import { getYouTubeVideoId } from "@/app/utils/getYoutubeVideoId";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { youtubeUrl } = await request.json();
  const videoId = getYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // Use the API Key from your environment variables
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YouTube API key is not set.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      // Forward the error from Google's API
      console.error("YouTube API Error:", data.error);
      return NextResponse.json(
        { error: "Failed to fetch from YouTube API." },
        { status: 500 }
      );
    }

    const videoItem = data.items?.[0];

    if (!videoItem) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    const title = videoItem.snippet.title || "YouTube Video";
    // The API provides multiple thumbnail resolutions. 'high' or 'medium' are good choices.
    const thumbnailUrl =
      videoItem.snippet.thumbnails.high?.url ||
      videoItem.snippet.thumbnails.default?.url ||
      "";

    // The duration is in ISO 8601 format (e.g., "PT2M34S"). You'll need to parse this.
    // For simplicity, we'll just pass it along for now or you can add a parsing library.
    const durationISO = videoItem.contentDetails.duration;
    // You would need a function to convert ISO 8601 to seconds if needed.

    return NextResponse.json({ title, thumbnailUrl, duration: durationISO });
  } catch (error: any) {
    console.error("Server-side fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video metadata." },
      { status: 500 }
    );
  }
}
