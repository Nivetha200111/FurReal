export interface Creator {
  id?: number;
  username: string;
  instagram_id?: string;
  display_name?: string;
  bio?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  ai_content_percentage?: number;
  last_analyzed?: string;
}
