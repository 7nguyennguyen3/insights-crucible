import { Mp3Encoder } from "@breezystack/lamejs";

export interface CompressionProgress {
  percent: number;
  stage: "loading" | "decoding" | "encoding" | "complete";
}

export interface CompressionOptions {
  targetBitrate?: number; // kbps, default 128
  minFileSizeForCompression?: number; // bytes, default 50MB
  onProgress?: (progress: CompressionProgress) => void;
}

const DEFAULT_BITRATE = 128;
const DEFAULT_MIN_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Main function to handle both Video extraction and Audio compression
 */
export async function compressAudioFile(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    targetBitrate = DEFAULT_BITRATE,
    minFileSizeForCompression = DEFAULT_MIN_SIZE,
    onProgress,
  } = options;

  // Skip compression for small non-video files
  const isVideo = file.type.startsWith("video/");
  if (!isVideo && file.size < minFileSizeForCompression) {
    return file;
  }

  // Skip if already MP3 and small enough
  if (file.type === "audio/mpeg" && file.size < DEFAULT_MIN_SIZE) {
    return file;
  }

  let audioContext: AudioContext | null = null;

  try {
    console.log(`Processing ${file.name}...`);
    onProgress?.({ percent: 0, stage: "loading" });

    // 1. Read the file into memory
    const arrayBuffer = await file.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      console.warn("File is empty, using original file");
      return file;
    }

    // 2. Decode the audio data (This works for VIDEO files too!)
    // This is the magic step that replaces "video.play()"
    onProgress?.({ percent: 10, stage: "decoding" });
    audioContext = new AudioContext();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (decodeError) {
      console.error("Failed to decode audio data:", decodeError);
      console.warn("File may not contain valid audio, using original file");
      return file;
    }

    // Validate audio buffer
    if (audioBuffer.length === 0 || audioBuffer.numberOfChannels === 0) {
      console.warn("Audio buffer is empty, using original file");
      return file;
    }

    // 3. Prepare for Encoding
    onProgress?.({ percent: 30, stage: "encoding" });
    const mp3Data = await encodeToMp3(audioBuffer, targetBitrate, (percent) => {
      // Map encoding progress (0-100) to overall progress (30-90)
      const totalPercent = 30 + Math.floor(percent * 0.6);
      onProgress?.({ percent: totalPercent, stage: "encoding" });
    });

    // 4. Create Final File
    onProgress?.({ percent: 95, stage: "complete" });
    const mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".mp3";

    onProgress?.({ percent: 100, stage: "complete" });

    return new File([mp3Blob], fileName, {
      type: "audio/mp3",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Audio processing failed:", error);
    // If anything fails (e.g., memory issues), fallback to uploading the original
    return file;
  } finally {
    // Always close the AudioContext to prevent memory leaks
    if (audioContext) {
      await audioContext.close();
    }
  }
}

/**
 * Helper to encode AudioBuffer to MP3 using lamejs
 */
async function encodeToMp3(
  audioBuffer: AudioBuffer,
  bitrate: number,
  onProgress: (percent: number) => void
): Promise<Int8Array[]> {
  return new Promise((resolve, reject) => {
    // Run this in a timeout to let the UI breathe
    setTimeout(() => {
      try {
        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;

        // Get the PCM data from the first channel (mono is usually fine for speech)
        // If you need stereo, you'd need to interleave left/right channels
        const samples = audioBuffer.getChannelData(0);

        // Convert Float32 to Int16
        const pcmData = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          // Clamp the value between -1 and 1
          const s = Math.max(-1, Math.min(1, samples[i]));
          // Scale to 16-bit integer
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const mp3encoder = new Mp3Encoder(1, sampleRate, bitrate);
        const mp3Data: Int8Array[] = [];
        const blockSize = 1152; // Must be multiple of 576
        const totalBlocks = Math.ceil(pcmData.length / blockSize);
        let blocksProcessed = 0;

        for (let i = 0; i < pcmData.length; i += blockSize) {
          const chunk = pcmData.subarray(i, i + blockSize);
          const mp3buf = mp3encoder.encodeBuffer(chunk);
          if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
          }

          blocksProcessed++;
          // Report progress more accurately based on blocks processed
          if (blocksProcessed % 50 === 0 || blocksProcessed === totalBlocks) {
            const progressPercent = Math.floor((blocksProcessed / totalBlocks) * 100);
            onProgress(progressPercent);
          }
        }

        const flushBuf = mp3encoder.flush();
        if (flushBuf.length > 0) {
          mp3Data.push(new Int8Array(flushBuf));
        }

        // Report 100% completion
        onProgress(100);
        resolve(mp3Data);
      } catch (error) {
        reject(error);
      }
    }, 10);
  });
}
