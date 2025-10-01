export interface ScrapedPostMeta {
  postId: string;
  shortcode?: string;
  postType: 'post' | 'reel' | 'story' | 'igtv';
  url: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  hashtags?: string[];
  creatorUsername?: string;
  creatorId?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  postedAt?: string;
}

export async function scrapeInstagramPublic(url: string): Promise<ScrapedPostMeta> {
  // TODO: Implement Playwright/Puppeteer based scraping with evasion and caching
  return {
    postId: 'unknown',
    postType: 'reel',
    url,
  };
}
