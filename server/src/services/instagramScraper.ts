import { chromium, Browser, Page } from 'playwright';
import { z } from 'zod';

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
  duration?: number;
  dimensions?: { width: number; height: number };
}

const ScrapedPostMetaSchema = z.object({
  postId: z.string(),
  shortcode: z.string().optional(),
  postType: z.enum(['post', 'reel', 'story', 'igtv']),
  url: z.string(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  creatorUsername: z.string().optional(),
  creatorId: z.string().optional(),
  likeCount: z.number().optional(),
  commentCount: z.number().optional(),
  viewCount: z.number().optional(),
  postedAt: z.string().optional(),
  duration: z.number().optional(),
  dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
});

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

export async function scrapeInstagramPublic(url: string): Promise<ScrapedPostMeta> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Add stealth measures
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    // Navigate to the post
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Extract post data
    const postData = await page.evaluate(() => {
      const getTextContent = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };
      
      const getAttribute = (selector: string, attr: string): string => {
        const element = document.querySelector(selector);
        return element?.getAttribute(attr) || '';
      };
      
      const getNumber = (selector: string): number => {
        const text = getTextContent(selector);
        const match = text.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, '')) : 0;
      };
      
      // Determine post type from URL
      const pathname = window.location.pathname;
      let postType: 'post' | 'reel' | 'story' | 'igtv' = 'post';
      if (pathname.includes('/reel/')) postType = 'reel';
      else if (pathname.includes('/stories/')) postType = 'story';
      else if (pathname.includes('/tv/')) postType = 'igtv';
      
      // Extract basic info
      const caption = getTextContent('article h1') || getTextContent('[data-testid="post-caption"]');
      const author = getTextContent('header h2') || getTextContent('[data-testid="post-author"]');
      
      // Extract media info
      const videoElement = document.querySelector('video');
      const imageElements = document.querySelectorAll('img[src*="instagram"]');
      
      let videoUrl = '';
      let thumbnailUrl = '';
      let duration = 0;
      let dimensions = { width: 0, height: 0 };
      
      if (videoElement) {
        const src = videoElement.src || videoElement.getAttribute('src');
        if (src) videoUrl = src;
        
        // Get video metadata
        duration = videoElement.duration || 0;
        dimensions = {
          width: videoElement.videoWidth || 0,
          height: videoElement.videoHeight || 0
        };
        
        // Get thumbnail
        const poster = videoElement.getAttribute('poster');
        if (poster) thumbnailUrl = poster;
      } else if (imageElements.length > 0) {
        const firstImg = imageElements[0] as HTMLImageElement;
        const src = firstImg.src || firstImg.getAttribute('src');
        if (src) {
          thumbnailUrl = src;
          dimensions = {
            width: firstImg.naturalWidth || 0,
            height: firstImg.naturalHeight || 0
          };
        }
      }
      
      // Extract engagement metrics
      const likeCount = getNumber('[data-testid="like-count"]') || getNumber('a[href*="/liked_by/"] span');
      const commentCount = getNumber('[data-testid="comment-count"]') || getNumber('a[href*="/comments/"] span');
      const viewCount = getNumber('[data-testid="view-count"]') || getNumber('span[title*="views"]');
      
      // Extract hashtags
      const hashtags: string[] = [];
      const hashtagElements = document.querySelectorAll('a[href*="/explore/tags/"]');
      hashtagElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.startsWith('#')) {
          hashtags.push(text);
        }
      });
      
      // Generate post ID and shortcode from URL
      const urlParts = window.location.pathname.split('/');
      const shortcode = urlParts[urlParts.length - 1] || 'unknown';
      const postId = shortcode;
      
      // Extract timestamp
      const timeElement = document.querySelector('time');
      const postedAt = timeElement?.getAttribute('datetime') || new Date().toISOString();
      
      return {
        postId,
        shortcode,
        postType,
        url: window.location.href,
        videoUrl: videoUrl || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        caption: caption || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        creatorUsername: author || undefined,
        likeCount: likeCount || undefined,
        commentCount: commentCount || undefined,
        viewCount: viewCount || undefined,
        postedAt: postedAt || undefined,
        duration: duration || undefined,
        dimensions: dimensions.width > 0 ? dimensions : undefined
      };
    });
    
    // Validate the extracted data
    const validatedData = ScrapedPostMetaSchema.parse(postData);
    return validatedData;
    
  } catch (error) {
    console.error('Error scraping Instagram post:', error);
    return {
      postId: 'error',
      postType: 'post',
      url,
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

export async function scrapeInstagramProfile(username: string): Promise<{
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  profilePicUrl: string;
} | null> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the profile
    const profileUrl = `https://www.instagram.com/${username}/`;
    await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Extract profile data
    const profileData = await page.evaluate(() => {
      const getTextContent = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };
      
      const getNumber = (selector: string): number => {
        const text = getTextContent(selector);
        const match = text.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, '')) : 0;
      };
      
      const displayName = getTextContent('h2') || getTextContent('[data-testid="profile-name"]');
      const bio = getTextContent('[data-testid="profile-bio"]') || getTextContent('header + div div');
      
      const followers = getNumber('a[href*="/followers/"] span');
      const following = getNumber('a[href*="/following/"] span');
      const posts = getNumber('a[href*="/p/"] span');
      
      const isVerified = !!document.querySelector('[data-testid="verified-badge"]') || 
                        !!document.querySelector('svg[aria-label="Verified"]');
      
      const profilePicElement = document.querySelector('img[alt*="profile picture"]') as HTMLImageElement;
      const profilePicUrl = profilePicElement?.src || '';
      
      return {
        username: window.location.pathname.split('/')[1] || '',
        displayName,
        bio,
        followers,
        following,
        posts,
        isVerified,
        profilePicUrl
      };
    });
    
    return profileData;
    
  } catch (error) {
    console.error('Error scraping Instagram profile:', error);
    return null;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
