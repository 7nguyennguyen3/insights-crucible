import { getYouTubeVideoId } from "@/app/utils/getYoutubeVideoId";
import { NextRequest, NextResponse } from "next/server";
import Innertube from "youtubei.js";

export async function POST(request: NextRequest) {
  const { youtubeUrl } = await request.json();
  const videoId = getYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);

    const title = videoInfo.basic_info.title || "YouTube Video";
    const thumbnailUrl = videoInfo.basic_info.thumbnail?.[0]?.url || "";
    const duration = videoInfo.basic_info.duration || 0; // Duration in seconds

    return NextResponse.json({ title, thumbnailUrl, duration });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch video metadata." },
      { status: 500 }
    );
  }
}
