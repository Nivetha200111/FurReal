import fs from 'fs';

export interface VideoMetadata {
  durationSec?: number;
  width?: number;
  height?: number;
  hasAudio?: boolean;
}

export async function probeVideoMetadata(_filePath: string): Promise<VideoMetadata> {
  // TODO: Use ffprobe to extract metadata
  return {};
}

export async function ensureStandardFormat(inputPath: string): Promise<string> {
  // TODO: Call ffmpeg to transcode to mp4 if needed
  return inputPath;
}

export async function extractAudioTrack(_inputPath: string, outputPath: string): Promise<string> {
  // TODO: Extract audio to outputPath
  fs.writeFileSync(outputPath, '');
  return outputPath;
}
