export interface FrameExtractionOptions {
  fps: number;
  outputDir: string;
}

export interface FrameExtractionResult {
  framePaths: string[];
}

export async function extractFramesWithFfmpeg(videoPath: string, options: FrameExtractionOptions): Promise<FrameExtractionResult> {
  // TODO: Call ffmpeg to extract frames to outputDir
  return { framePaths: [] };
}
