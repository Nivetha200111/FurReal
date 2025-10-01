export interface Analysis {
  id?: number;
  post_id: string;
  ai_probability: number;
  impossible_actions_score: number;
  anatomical_errors_score: number;
  motion_artifacts_score: number;
  temporal_inconsistency_score: number;
  texture_anomalies_score: number;
  hashtag_indicator_score: number;
  detailed_findings?: any;
  frame_analyses?: any;
  processing_time_ms?: number;
  analyzed_at?: string;
}
