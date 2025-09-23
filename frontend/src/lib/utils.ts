import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts various timestamp formats to ISO string
 * Handles Firestore Timestamps, serialized timestamps, Date objects, and strings
 */
export function convertFirestoreTimestamp(timestamp: any): string {
  if (!timestamp) {
    return new Date().toISOString();
  }

  // Handle Firestore Timestamp objects (has .toDate() method)
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }

  // Handle serialized Firestore Timestamps (from JSON export)
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    const date = new Date(timestamp._seconds * 1000);
    if (timestamp._nanoseconds) {
      date.setMilliseconds(date.getMilliseconds() + Math.floor(timestamp._nanoseconds / 1000000));
    }
    return date.toISOString();
  }

  // Handle Date objects
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  // Handle ISO strings or other string formats
  if (typeof timestamp === 'string') {
    try {
      return new Date(timestamp).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // Handle numbers (Unix timestamps)
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }

  // Fallback to current date
  return new Date().toISOString();
}
