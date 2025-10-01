export interface DownloadResult {
  filePath: string;
  durationSec?: number;
  hasAudio?: boolean;
}

export async function downloadInstagramVideo(videoUrl: string): Promise<DownloadResult> {
  // TODO: Implement chunked download to cache dir, choose best quality
  return {
    filePath: './cache/video.mp4',
    durationSec: undefined,
    hasAudio: true,
  };
}
