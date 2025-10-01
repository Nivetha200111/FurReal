export interface DetectionScores {
  aiProbability: number;
  impossibleActionsScore: number;
  anatomicalErrorsScore: number;
  motionArtifactsScore: number;
  temporalInconsistencyScore: number;
  textureAnomaliesScore: number;
  hashtagIndicatorScore: number;
}

export interface DetailedFindings {
  notes: string[];
}

export interface AnalysisResult {
  postId: string;
  scores: DetectionScores;
  detailedFindings: DetailedFindings;
  frameAnalyses: any[];
  processingTimeMs: number;
}

export async function runAIDetectionPipeline(postId: string): Promise<AnalysisResult> {
  // TODO: wire MediaPipe, Transformers.js or Replicate, TensorFlow.js
  return {
    postId,
    scores: {
      aiProbability: 0,
      impossibleActionsScore: 0,
      anatomicalErrorsScore: 0,
      motionArtifactsScore: 0,
      temporalInconsistencyScore: 0,
      textureAnomaliesScore: 0,
      hashtagIndicatorScore: 0,
    },
    detailedFindings: { notes: [] },
    frameAnalyses: [],
    processingTimeMs: 0,
  };
}
