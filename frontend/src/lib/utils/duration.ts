/**
 * Parse ISO 8601 duration string (PT1M30S) to human readable format
 */
export function parseISODuration(duration: string): string {
  if (!duration) return "";
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const [, hours, minutes, seconds] = match;
  const parts: string[] = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && !hours && !minutes) parts.push(`${seconds}s`);

  return parts.join(" ") || "0s";
}

/**
 * Converts seconds to a human-readable format (e.g., 1h 30m 15s).
 * @param totalSeconds The total duration in seconds.
 * @returns A formatted string.
 */
function secondsToHMS(totalSeconds: number): string {
  if (totalSeconds === 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(" ");
}

/**
 * Format duration for display - it can handle ISO 8601 format, or seconds.
 */
export function formatDurationForDisplay(duration?: string | number): string {
  if (duration === null || duration === undefined) return "";

  if (typeof duration === 'number') {
    return secondsToHMS(duration);
  }
  
  // Check if it looks like ISO 8601 duration (PT...)
  if (duration.startsWith("PT")) {
    return parseISODuration(duration);
  }
  
  // Otherwise return as-is (might already be formatted)
  return duration;
}