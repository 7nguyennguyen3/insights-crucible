# from youtube_transcript_api import YouTubeTranscriptApi

# # Replace this with the ID of any video you want to test.
# video_id = "dm2qDrb3UVo"
# print(f"--- Attempting to fetch transcript for video ID: {video_id} ---")

# try:
#     api = YouTubeTranscriptApi()

#     # Fetch the transcript object and convert it to a simple list
#     transcript_object = api.fetch(video_id)
#     transcript_list = transcript_object.to_raw_data()

#     print("\n✅ Success! Transcript fetched.")
#     print("---------------------------------")

#     # Loop through and print every line of the transcript
#     for snippet in transcript_list:
#         start_time = snippet.get("start", 0)
#         text = snippet.get("text", "")
#         # The replace() calls clean up music notes for better readability
#         print(
#             f"[{start_time:.2f}s] {text.replace('[♪♪♪]', '').replace('♪', '').strip()}"
#         )

# except Exception as e:
#     print(f"\n❌ Error: Could not fetch transcript.")
#     print(f"Details: {e}")
