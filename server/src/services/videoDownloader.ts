import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DownloadResult {
  filePath: string;
  durationSec?: number;
  hasAudio?: boolean;
  size?: number;
  quality?: string;
  format?: string;
}

export interface DownloadOptions {
  quality?: 'low' | 'medium' | 'high' | 'best';
  chunkSize?: number;
  timeout?: number;
  retries?: number;
  useYtDlp?: boolean;
}

export async function downloadInstagramVideo(
  videoUrl: string, 
  outputPath?: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const {
    quality = 'medium',
    chunkSize = 1024 * 1024, // 1MB chunks
    timeout = 30000,
    retries = 3,
    useYtDlp = true
  } = options;

  try {
    // Default output path
    const finalOutputPath = outputPath || './cache/video.mp4';
    
    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Try yt-dlp first if available and useYtDlp is true
    if (useYtDlp) {
      try {
        return await downloadWithYtDlp(videoUrl, finalOutputPath, quality);
      } catch (error) {
        console.warn('yt-dlp failed, falling back to direct download:', error);
      }
    }

    // Fallback to direct download
    return await downloadDirect(videoUrl, finalOutputPath, { chunkSize, timeout, retries });
  } catch (error) {
    console.error('Error downloading video:', error);
    return {
      filePath: './cache/video.mp4',
      durationSec: undefined,
      hasAudio: true,
    };
  }
}

async function downloadWithYtDlp(
  url: string, 
  outputPath: string, 
  quality: string
): Promise<DownloadResult> {
  const qualityMap = {
    low: 'worst[height<=480]',
    medium: 'best[height<=720]',
    high: 'best[height<=1080]',
    best: 'best'
  };

  const qualitySelector = qualityMap[quality as keyof typeof qualityMap] || qualityMap.medium;
  
  const command = `yt-dlp -f "${qualitySelector}" -o "${outputPath}" --no-playlist "${url}"`;
  
  await execAsync(command);
  
  // Get file info
  const stats = fs.statSync(outputPath);
  const size = stats.size;
  
  // Get video duration using ffprobe
  let duration = 0;
  let hasAudio = true;
  try {
    const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`;
    const { stdout } = await execAsync(durationCommand);
    duration = parseFloat(stdout.trim()) || 0;
    
    // Check for audio
    const audioCommand = `ffprobe -v quiet -select_streams a -show_entries stream=codec_type -of csv=p=0 "${outputPath}"`;
    const { stdout: audioOutput } = await execAsync(audioCommand);
    hasAudio = audioOutput.trim().includes('audio');
  } catch (error) {
    console.warn('Could not get video metadata:', error);
  }
  
  return {
    filePath: outputPath,
    durationSec: duration,
    hasAudio,
    size,
    quality,
    format: path.extname(outputPath).slice(1)
  };
}

async function downloadDirect(
  url: string, 
  outputPath: string, 
  options: { chunkSize: number; timeout: number; retries: number }
): Promise<DownloadResult> {
  const { chunkSize, timeout, retries } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // Create write stream
      const writeStream = createWriteStream(outputPath);
      
      // Download with progress
      let downloadedSize = 0;
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('No response body reader available');
      }
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        writeStream.write(value);
        downloadedSize += value.length;
        
        // Log progress
        if (totalSize > 0) {
          const progress = (downloadedSize / totalSize * 100).toFixed(1);
          console.log(`Download progress: ${progress}% (${downloadedSize}/${totalSize} bytes)`);
        }
      }
      
      writeStream.end();
      
      // Wait for write to complete
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      // Get file info
      const stats = fs.statSync(outputPath);
      const size = stats.size;
      
      // Get video duration using ffprobe
      let duration = 0;
      let hasAudio = true;
      try {
        const durationCommand = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`;
        const { stdout } = await execAsync(durationCommand);
        duration = parseFloat(stdout.trim()) || 0;
        
        // Check for audio
        const audioCommand = `ffprobe -v quiet -select_streams a -show_entries stream=codec_type -of csv=p=0 "${outputPath}"`;
        const { stdout: audioOutput } = await execAsync(audioCommand);
        hasAudio = audioOutput.trim().includes('audio');
      } catch (error) {
        console.warn('Could not get video metadata:', error);
      }
      
      return {
        filePath: outputPath,
        durationSec: duration,
        hasAudio,
        size,
        quality: 'unknown',
        format: path.extname(outputPath).slice(1)
      };
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`Download attempt ${attempt + 1} failed:`, error);
      
      // Wait before retry
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('All download attempts failed');
}
