CREATE TABLE IF NOT EXISTS instagram_posts (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(100) UNIQUE NOT NULL,
  shortcode VARCHAR(50),
  post_type VARCHAR(20),
  url TEXT NOT NULL,
  creator_username VARCHAR(100),
  creator_id VARCHAR(100),
  caption TEXT,
  hashtags JSONB,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  posted_at TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creators (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  instagram_id VARCHAR(100),
  display_name VARCHAR(200),
  bio TEXT,
  is_verified BOOLEAN,
  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  ai_content_percentage FLOAT,
  last_analyzed TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(100) REFERENCES instagram_posts(post_id),
  ai_probability FLOAT,
  impossible_actions_score FLOAT,
  anatomical_errors_score FLOAT,
  motion_artifacts_score FLOAT,
  temporal_inconsistency_score FLOAT,
  texture_anomalies_score FLOAT,
  hashtag_indicator_score FLOAT,
  detailed_findings JSONB,
  frame_analyses JSONB,
  processing_time_ms INTEGER,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trending_ai_creators (
  id SERIAL PRIMARY KEY,
  creator_username VARCHAR(100),
  ai_post_count INTEGER,
  total_ai_views INTEGER,
  trending_score FLOAT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
