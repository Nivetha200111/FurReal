import { DetectionScores } from '../services/aiDetector.js';

export function computeFinalScore(scores: DetectionScores): number {
  const weights = {
    impossibleActionsScore: 0.25,
    anatomicalErrorsScore: 0.2,
    motionArtifactsScore: 0.15,
    temporalInconsistencyScore: 0.15,
    textureAnomaliesScore: 0.15,
    hashtagIndicatorScore: 0.1,
  } as const;

  const weighted =
    scores.impossibleActionsScore * weights.impossibleActionsScore +
    scores.anatomicalErrorsScore * weights.anatomicalErrorsScore +
    scores.motionArtifactsScore * weights.motionArtifactsScore +
    scores.temporalInconsistencyScore * weights.temporalInconsistencyScore +
    scores.textureAnomaliesScore * weights.textureAnomaliesScore +
    scores.hashtagIndicatorScore * weights.hashtagIndicatorScore;

  return Math.max(0, Math.min(1, weighted));
}
