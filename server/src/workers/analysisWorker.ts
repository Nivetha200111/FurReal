import { Queue, Worker, QueueScheduler, JobsOptions, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runAIDetectionPipeline } from '../services/aiDetector.js';
import { scrapeInstagramPublic } from '../services/instagramScraper.js';
import { downloadInstagramVideo } from '../services/videoDownloader.js';
import { extractFramesWithFfmpeg } from '../services/frameExtractor.js';
import { probeVideoMetadata } from '../utils/videoProcessor.js';
import path from 'path';
import fs from 'fs';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const analysisQueueName = 'analysis-queue';
export const analysisQueue = new Queue(analysisQueueName, { connection });
new QueueScheduler(analysisQueueName, { connection });

export interface AnalysisJobData {
  postUrl?: string;
  reelId?: string;
  postId?: string;
  type?: 'post' | 'reel' | 'story' | 'profile';
  username?: string;
  storyId?: string;
}

export interface AnalysisResult {
  postId: string;
  url: string;
  type: string;
  status: 'completed' | 'failed' | 'processing';
  result?: any;
  error?: string;
  processingTime: number;
  metadata?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    hashtags?: string[];
    creatorUsername?: string;
    likeCount?: number;
    commentCount?: number;
    viewCount?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
  };
}

async function processAnalysisJob(job: Job<AnalysisJobData>): Promise<AnalysisResult> {
  const startTime = Date.now();
  const { postUrl, postId, type = 'post' } = job.data;
  
  if (!postUrl) {
    throw new Error('Post URL is required');
  }
  
  try {
    console.log(`Starting analysis for ${type}: ${postUrl}`);
    
    // Step 1: Scrape Instagram post metadata
    const scrapedData = await scrapeInstagramPublic(postUrl);
    console.log(`Scraped metadata for ${scrapedData.postId}`);
    
    // Step 2: Download video if available
    let videoPath: string | undefined;
    if (scrapedData.videoUrl) {
      const cacheDir = path.join(process.cwd(), 'cache', 'videos');
      const videoFileName = `${scrapedData.postId}.mp4`;
      const videoOutputPath = path.join(cacheDir, videoFileName);
      
      console.log(`Downloading video: ${scrapedData.videoUrl}`);
      const downloadResult = await downloadInstagramVideo(scrapedData.videoUrl, videoOutputPath);
      videoPath = downloadResult.filePath;
      console.log(`Video downloaded: ${videoPath}`);
    }
    
    // Step 3: Extract frames if video is available
    let framePaths: string[] = [];
    if (videoPath && fs.existsSync(videoPath)) {
      const frameDir = path.join(process.cwd(), 'cache', 'frames', scrapedData.postId);
      console.log(`Extracting frames to: ${frameDir}`);
      
      const frameResult = await extractFramesWithFfmpeg(videoPath, {
        fps: 1, // 1 frame per second
        outputDir: frameDir,
        maxFrames: 10,
        quality: 'medium',
        width: 640,
        height: 480
      });
      
      framePaths = frameResult.framePaths;
      console.log(`Extracted ${frameResult.totalFrames} frames`);
    }
    
    // Step 4: Get video metadata
    let videoMetadata: any = {};
    if (videoPath && fs.existsSync(videoPath)) {
      videoMetadata = await probeVideoMetadata(videoPath);
      console.log(`Video metadata: ${JSON.stringify(videoMetadata)}`);
    }
    
    // Step 5: Run AI detection pipeline
    console.log(`Running AI detection pipeline for ${scrapedData.postId}`);
    const aiResult = await runAIDetectionPipeline(scrapedData.postId, scrapedData.videoUrl);
    console.log(`AI detection completed: ${aiResult.scores.aiProbability}% AI probability`);
    
    // Step 6: Compile final result
    const processingTime = Date.now() - startTime;
    
    const result: AnalysisResult = {
      postId: scrapedData.postId,
      url: scrapedData.url,
      type: scrapedData.postType,
      status: 'completed',
      result: aiResult,
      processingTime,
      metadata: {
        videoUrl: scrapedData.videoUrl,
        thumbnailUrl: scrapedData.thumbnailUrl,
        caption: scrapedData.caption,
        hashtags: scrapedData.hashtags,
        creatorUsername: scrapedData.creatorUsername,
        likeCount: scrapedData.likeCount,
        commentCount: scrapedData.commentCount,
        viewCount: scrapedData.viewCount,
        duration: scrapedData.duration,
        dimensions: scrapedData.dimensions,
        ...videoMetadata
      }
    };
    
    console.log(`Analysis completed for ${scrapedData.postId} in ${processingTime}ms`);
    return result;
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Analysis job failed for ${postId}:`, error);
    
    return {
      postId: postId || 'unknown',
      url: postUrl,
      type,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      processingTime
    };
  }
}

export const analysisWorker = new Worker<AnalysisJobData>(
  analysisQueueName,
  async (job) => {
    return await processAnalysisJob(job);
  },
  { connection }
);

export async function enqueueAnalysis(data: AnalysisJobData, opts?: JobsOptions) {
  return analysisQueue.add('analyze', data, opts);
}
