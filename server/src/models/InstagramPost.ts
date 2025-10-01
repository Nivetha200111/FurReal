export interface InstagramPost {
  id?: number;
  post_id: string;
  shortcode?: string;
  post_type: 'post' | 'reel' | 'story' | 'igtv';
  url: string;
  creator_username?: string;
  creator_id?: string;
  caption?: string;
  hashtags?: string[];
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  posted_at?: string;
  scraped_at?: string;
}
