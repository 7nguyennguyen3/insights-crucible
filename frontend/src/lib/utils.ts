import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats milliseconds into a HH:MM:SS string.
 * @param ms The time in milliseconds.
 * @param options Control whether to show milliseconds.
 * @returns A formatted time string.
 */
export function formatTimestamp(
  ms: number,
  options: { includeMilliseconds?: boolean } = {}
): string {
  const { includeMilliseconds = false } = options;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  let timeString = "";

  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, "0");
    timeString = `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    timeString = `${paddedMinutes}:${paddedSeconds}`;
  }

  if (includeMilliseconds) {
    const milliseconds = ms % 1000;
    const paddedMilliseconds = String(milliseconds).padStart(3, "0");
    timeString += `.${paddedMilliseconds}`;
  }

  return timeString;
}
