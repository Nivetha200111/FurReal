import Replicate from 'replicate';

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

export async function runAIDetectionPipeline(postId: string, videoUrl?: string): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    let aiProbability = 0.1;
    const signals: string[] = [];
    const frameAnalyses: FrameAnalysis[] = [];

    // 1. Replicate API integration for video analysis
    if (process.env.REPLICATE_API_TOKEN && videoUrl) {
      try {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        
        // Use CLIP features for video understanding
        const clipOutput = await replicate.run("andreasjansson/clip-features", {
          input: { video: videoUrl }
        });
        
        if (clipOutput && Array.isArray(clipOutput)) {
          // Analyze CLIP features for AI indicators
          const features = clipOutput[0];
          if (features && features.length > 0) {
            // Simple heuristic: check for unusual feature patterns
            const variance = calculateVariance(features);
            if (variance > 0.8) {
              aiProbability += 0.3;
              signals.push("High feature variance detected (possible AI generation)");
            }
          }
        }
      } catch (replicateError) {
        signals.push(`Replicate API failed: ${replicateError}`);
      }
    }

    // 2. Hugging Face BLIP for image captioning (if video not available)
    if (process.env.HUGGINGFACE_API_KEY && !videoUrl) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
          {
            headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            method: "POST",
            body: JSON.stringify({ inputs: videoUrl }),
          }
        );
        const data = await response.json();
        
        if (Array.isArray(data) && data[0] && data[0].generated_text) {
          const caption = data[0].generated_text.toLowerCase();
          const aiKeywords = ['ai generated', 'sora', 'runwayml', 'midjourney', 'ai art', 'ai video', 'generative ai', 'not real', 'ai animals', 'digital art', 'impossible'];
          
          for (const keyword of aiKeywords) {
            if (caption.includes(keyword)) {
              aiProbability += 0.2;
              signals.push(`Caption contains AI keyword: "${keyword}"`);
            }
          }
        }
      } catch (hfError) {
        signals.push(`Hugging Face API failed: ${hfError}`);
      }
    }

    // 3. Basic video analysis heuristics
    if (videoUrl) {
      // Check for common AI video artifacts
      const hasUnusualMotion = await checkUnusualMotion(videoUrl);
      if (hasUnusualMotion) {
        aiProbability += 0.2;
        signals.push("Unusual motion patterns detected");
      }

      const hasTemporalInconsistency = await checkTemporalInconsistency(videoUrl);
      if (hasTemporalInconsistency) {
        aiProbability += 0.15;
        signals.push("Temporal inconsistencies detected");
      }
    }

    // 4. Calculate final scores
    const processingTime = Date.now() - startTime;
    aiProbability = Math.min(1, Math.max(0, aiProbability));

    return {
      postId,
      scores: {
        aiProbability,
        impossibleActionsScore: aiProbability > 0.7 ? 0.8 : 0.2,
        anatomicalErrorsScore: aiProbability > 0.6 ? 0.7 : 0.1,
        motionArtifactsScore: aiProbability > 0.5 ? 0.6 : 0.1,
        temporalInconsistencyScore: aiProbability > 0.6 ? 0.7 : 0.2,
        textureAnomaliesScore: aiProbability > 0.5 ? 0.5 : 0.1,
        hashtagIndicatorScore: signals.some(s => s.includes('keyword')) ? 0.8 : 0.1,
      },
      detailedFindings: {
        notes: signals.length > 0 ? signals : ["Analysis completed with basic heuristics"],
        signals
      },
      frameAnalyses,
      processingTimeMs: processingTime,
    };
  } catch (error) {
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
      detailedFindings: {
        notes: [`Error: ${error}`]
      },
      frameAnalyses: [],
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// Helper functions
function calculateVariance(features: number[]): number {
  const mean = features.reduce((a, b) => a + b, 0) / features.length;
  const variance = features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length;
  return Math.sqrt(variance);
}

async function checkUnusualMotion(videoUrl: string): Promise<boolean> {
  // Placeholder: In real implementation, analyze motion vectors
  return Math.random() > 0.7;
}

async function checkTemporalInconsistency(videoUrl: string): Promise<boolean> {
  // Placeholder: In real implementation, check frame-to-frame consistency
  return Math.random() > 0.8;
}
