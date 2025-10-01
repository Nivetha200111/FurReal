export const AI_HASHTAGS = [
  '#AIgenerated', '#Sora', '#RunwayML', '#Midjourney',
  '#AIart', '#AIvideo', '#GenerativeAI', '#NotReal', '#AIAnimals', '#DigitalArt'
];

export interface HashtagAnalysisResult {
  indicatorScore: number; // 0..1
  matched: string[];
}

export function analyzeHashtagsAndCaption(caption: string | undefined, hashtags: string[] | undefined): HashtagAnalysisResult {
  const text = `${caption ?? ''} ${(hashtags ?? []).join(' ')}`.toLowerCase();
  const matched = AI_HASHTAGS.filter(h => text.includes(h.toLowerCase()));
  const indicatorScore = Math.min(1, matched.length * 0.15);
  return { indicatorScore, matched };
}
