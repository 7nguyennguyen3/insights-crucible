export const secondsToHHMMSS = (totalSeconds: number): string => {
  if (isNaN(totalSeconds)) return "0:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  // Seconds are always padded to two digits.
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    // Hours are the leading unit, so they are not padded.
    const hh = String(hours);
    // Minutes are not the leading unit, so they get padded.
    const mm = String(minutes).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  } else {
    // Minutes are the leading unit, so they are not padded.
    const mm = String(minutes);
    return `${mm}:${ss}`;
  }
};
