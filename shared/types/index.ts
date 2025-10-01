export interface TimelineData {
  timestampMs: number;
  aiProbability: number; // 0..1
  notes?: string[];
}

export interface TimePattern {
  hour: number;
  dayOfWeek: number;
}

export interface CreatorAnalytics {
  username: string;
  aiContentPercentage: number;
  aiEvolutionTimeline: TimelineData[];
  mostCommonAITypes: string[];
  averageEngagementOnAI: number;
  averageEngagementOnReal: number;
  followerGrowthCorrelation: number;
  hashtagPatterns: string[];
  postingTimePatterns: TimePattern[];
}

export interface InstagramPostRef {
  postId: string;
  url: string;
  postType: 'post' | 'reel' | 'story' | 'igtv';
}

export interface ViralTracker {
  trendingAIVideos: InstagramPostRef[];
  emergingAICreators: { username: string }[];
  viralHashtags: string[];
  aiTrends: Array<{
    style: string;
    popularity: number;
    examples: string[];
  }>;
}
