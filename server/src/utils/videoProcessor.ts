import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface VideoMetadata {
  durationSec?: number;
  width?: number;
  height?: number;
  hasAudio?: boolean;
  fps?: number;
  codec?: string;
  bitrate?: number;
  format?: string;
  size?: number;
}

export async function probeVideoMetadata(filePath: string): Promise<VideoMetadata> {
  try {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
    const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');
    const format = data.format;
    
    return {
      durationSec: parseFloat(format.duration) || 0,
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      hasAudio: !!audioStream,
      fps: eval(videoStream?.r_frame_rate || '0') || 0,
      codec: videoStream?.codec_name || '',
      bitrate: parseInt(format.bit_rate) || 0,
      format: format.format_name || '',
      size: parseInt(format.size) || 0,
    };
  } catch (error) {
    console.error('Error getting video metadata:', error);
    return {
      durationSec: 0,
      width: 0,
      height: 0,
      hasAudio: false,
      fps: 0,
      codec: '',
      bitrate: 0,
      format: '',
      size: 0,
    };
  }
}

export async function ensureStandardFormat(inputPath: string): Promise<string> {
  try {
    const metadata = await probeVideoMetadata(inputPath);
    
    // If already MP4 with H.264, return as-is
    if (metadata.format?.includes('mp4') && metadata.codec === 'h264') {
      return inputPath;
    }
    
    // Transcode to MP4 with H.264
    const outputPath = inputPath.replace(/\.[^.]+$/, '.mp4');
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -movflags +faststart -y "${outputPath}"`;
    await execAsync(command);
    
    return outputPath;
  } catch (error) {
    console.error('Error transcoding video:', error);
    return inputPath; // Return original if transcoding fails
  }
}

export async function extractAudioTrack(inputPath: string, outputPath: string): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract audio as MP3
    const command = `ffmpeg -i "${inputPath}" -vn -acodec mp3 -ab 128k -y "${outputPath}"`;
    await execAsync(command);
    
    return outputPath;
  } catch (error) {
    console.error('Error extracting audio:', error);
    // Create empty file as fallback
    fs.writeFileSync(outputPath, '');
    return outputPath;
  }
}

export async function generateThumbnail(inputPath: string, outputPath: string, timestamp: number = 1): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate thumbnail at specified timestamp
    const command = `ffmpeg -i "${inputPath}" -ss ${timestamp} -vframes 1 -q:v 2 -y "${outputPath}"`;
    await execAsync(command);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error(`Thumbnail generation failed: ${error}`);
  }
}
