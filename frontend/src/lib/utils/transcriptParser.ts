import { Utterance } from "@/app/_global/interface";

/**
 * Converts time string (e.g., "1:23", "0:45") to seconds
 */
function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Parses raw transcript text into structured Utterance array
 * Handles format like:
 * 0:00
 * Transcriber: Anna Kalynchuk Reviewer: Michael Nystrom
 * 0:19
 * I'm angry.
 * 0:22
 * And I'm angry because I wish I knew this when I was younger.
 */
export function parseRawTranscript(rawTranscript: string): Utterance[] {
  if (!rawTranscript?.trim()) {
    return [];
  }

  const lines = rawTranscript.split('\n').map(line => line.trim()).filter(Boolean);
  const utterances: Utterance[] = [];
  
  let currentTimestamp = '';
  let currentStart = 0;
  let textBuffer: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a timestamp (format: "0:00", "1:23", etc.)
    const timestampMatch = line.match(/^(\d+:\d+)$/);
    
    if (timestampMatch) {
      // If we have accumulated text, save it as an utterance
      if (textBuffer.length > 0 && currentTimestamp) {
        const text = textBuffer.join(' ');
        // Skip transcriber/reviewer lines
        if (!text.toLowerCase().includes('transcriber:') &&
            !text.toLowerCase().includes('reviewer:')) {
          utterances.push({
            // No speaker field for parsed transcript sources
            text: text,
            start: currentStart,
          });
        }
        textBuffer = [];
      }
      
      // Set new timestamp
      currentTimestamp = timestampMatch[1];
      currentStart = timeToSeconds(currentTimestamp);
    } else {
      // This is text content, add to buffer
      textBuffer.push(line);
    }
  }
  
  // Don't forget the last utterance if there's remaining text
  if (textBuffer.length > 0 && currentTimestamp) {
    const text = textBuffer.join(' ');
    if (!text.toLowerCase().includes('transcriber:') &&
        !text.toLowerCase().includes('reviewer:')) {
      utterances.push({
        // No speaker field for parsed transcript sources
        text: text,
        start: currentStart,
      });
    }
  }
  
  // Set end times based on next utterance's start time
  for (let i = 0; i < utterances.length - 1; i++) {
    utterances[i].end = utterances[i + 1].start;
  }
  
  return utterances;
}

/**
 * Parses upload transcript format with speaker information into structured Utterance array
 * Handles format: [{duration, start, text, speaker}, ...]
 */
export function parseUploadTranscript(uploadTranscript: any[]): Utterance[] {
  if (!Array.isArray(uploadTranscript)) {
    return [];
  }

  const utterances: Utterance[] = [];

  for (const item of uploadTranscript) {
    if (item.text && typeof item.text === 'string') {
      const text = item.text.trim();
      if (text) {
        utterances.push({
          speaker: item.speaker, // Preserve speaker information from upload sources
          text: text,
          start: Math.floor(item.start || 0),
          end: Math.floor((item.start || 0) + (item.duration || 0))
        });
      }
    }
  }

  return utterances;
}

/**
 * Parses YouTube transcript format into structured Utterance array
 * Handles format: [{duration, start, text}, ...]
 */
export function parseYouTubeTranscript(youtubeTranscript: any[]): Utterance[] {
  if (!Array.isArray(youtubeTranscript)) {
    return [];
  }

  const utterances: Utterance[] = [];

  for (const item of youtubeTranscript) {
    // Skip non-text items like [Music] or [Applause]
    if (item.text && typeof item.text === 'string') {
      const text = item.text.trim();
      if (text && !text.match(/^\[.*\]$/)) { // Skip bracketed items like [Music]
        const utterance = {
          // No speaker field for YouTube transcripts
          text: text,
          start: Math.floor(item.start || 0),
          end: Math.floor((item.start || 0) + (item.duration || 0))
        };
        utterances.push(utterance);
      }
    }
  }

  return utterances;
}

/**
 * Gets structured transcript from job data, checking multiple locations and formats
 * For upload sources, the transcript includes speaker information (e.g., "A", "B")
 * For other sources (YouTube, paste), speaker information is not available
 */
export function getStructuredTranscript(jobData: any): Utterance[] {

  // Priority 1: Use structured_transcript if available (preferred format)
  // This contains speaker info for upload sources
  if (jobData?.structured_transcript && Array.isArray(jobData.structured_transcript)) {
    return jobData.structured_transcript;
  }

  // Priority 2: Check for transcript format at root level
  if (jobData?.transcript && Array.isArray(jobData.transcript)) {
    // Determine if this is an upload source by checking request_data
    const isUploadSource = jobData?.request_data?.source_type === 'upload';

    if (isUploadSource) {
      // Use upload parser to preserve speaker information
      return parseUploadTranscript(jobData.transcript);
    } else {
      // Use YouTube parser for other sources
      return parseYouTubeTranscript(jobData.transcript);
    }
  }

  // Priority 3: Fall back to parsing raw transcript from request_data (paste sources)
  const rawTranscript = jobData?.request_data?.transcript;
  if (rawTranscript && typeof rawTranscript === 'string') {
    return parseRawTranscript(rawTranscript);
  }

  // Priority 4: Check for raw transcript at root level (legacy support)
  if (jobData?.transcript && typeof jobData.transcript === 'string') {
    return parseRawTranscript(jobData.transcript);
  }

  return [];
}