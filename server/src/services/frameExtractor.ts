import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FrameExtractionOptions {
  fps: number;
  outputDir: string;
  maxFrames?: number;
  quality?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
}

export interface FrameExtractionResult {
  framePaths: string[];
  totalFrames: number;
  duration: number;
}

export async function extractFramesWithFfmpeg(videoPath: string, options: FrameExtractionOptions): Promise<FrameExtractionResult> {
  try {
    const { fps, outputDir, maxFrames = 100, quality = 'medium', width, height } = options;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Calculate quality settings
    const qualityMap = {
      low: '2',
      medium: '3',
      high: '5'
    };
    
    const qualityValue = qualityMap[quality];
    
    // Get video duration first
    const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`;
    const { stdout: durationOutput } = await execAsync(durationCommand);
    const duration = parseFloat(durationOutput.trim()) || 0;
    
    // Build ffmpeg command
    let command = `ffmpeg -i "${videoPath}" -vf "fps=${fps}"`;
    
    // Add scaling if specified
    if (width && height) {
      command += `,scale=${width}:${height}`;
    }
    
    // Add quality and output pattern
    command += ` -q:v ${qualityValue} -frames:v ${maxFrames} -y "${path.join(outputDir, 'frame_%04d.jpg')}"`;
    
    await execAsync(command);
    
    // Get list of extracted frames
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('frame_') && file.endsWith('.jpg'))
      .sort()
      .map(file => path.join(outputDir, file));
    
    return {
      framePaths: files,
      totalFrames: files.length,
      duration
    };
  } catch (error) {
    console.error('Error extracting frames:', error);
    return {
      framePaths: [],
      totalFrames: 0,
      duration: 0
    };
  }
}

export async function extractFramesAtTimestamps(
  videoPath: string,
  outputDir: string,
  timestamps: number[],
  options: Omit<FrameExtractionOptions, 'fps'> = { outputDir: '' }
): Promise<FrameExtractionResult> {
  try {
    const { quality = 'medium', width, height } = options;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Calculate quality settings
    const qualityMap = {
      low: '2',
      medium: '3',
      high: '5'
    };
    
    const qualityValue = qualityMap[quality];
    
    const extractedFrames: string[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputPath = path.join(outputDir, `frame_${i.toString().padStart(4, '0')}.jpg`);
      
      // Build ffmpeg command for specific timestamp
      let command = `ffmpeg -i "${videoPath}" -ss ${timestamp}`;
      
      // Add scaling if specified
      if (width && height) {
        command += ` -vf "scale=${width}:${height}"`;
      }
      
      command += ` -vframes 1 -q:v ${qualityValue} -y "${outputPath}"`;
      
      await execAsync(command);
      
      if (fs.existsSync(outputPath)) {
        extractedFrames.push(outputPath);
      }
    }
    
    return {
      framePaths: extractedFrames,
      totalFrames: extractedFrames.length,
      duration: 0
    };
  } catch (error) {
    console.error('Error extracting frames at timestamps:', error);
    return {
      framePaths: [],
      totalFrames: 0,
      duration: 0
    };
  }
}

export async function extractKeyFrames(
  videoPath: string,
  outputDir: string,
  maxFrames: number = 10,
  options: Omit<FrameExtractionOptions, 'fps'> = { outputDir: '' }
): Promise<FrameExtractionResult> {
  try {
    const { quality = 'medium', width, height } = options;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Calculate quality settings
    const qualityMap = {
      low: '2',
      medium: '3',
      high: '5'
    };
    
    const qualityValue = qualityMap[quality];
    
    // Build ffmpeg command for key frame extraction
    let command = `ffmpeg -i "${videoPath}" -vf "select=gt(scene\\,0.3)"`;
    
    // Add scaling if specified
    if (width && height) {
      command += `,scale=${width}:${height}`;
    }
    
    command += ` -vsync vfr -q:v ${qualityValue} -frames:v ${maxFrames} -y "${path.join(outputDir, 'keyframe_%04d.jpg')}"`;
    
    await execAsync(command);
    
    // Get list of extracted key frames
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('keyframe_') && file.endsWith('.jpg'))
      .sort()
      .map(file => path.join(outputDir, file));
    
    return {
      framePaths: files,
      totalFrames: files.length,
      duration: 0
    };
  } catch (error) {
    console.error('Error extracting key frames:', error);
    return {
      framePaths: [],
      totalFrames: 0,
      duration: 0
    };
  }
}
