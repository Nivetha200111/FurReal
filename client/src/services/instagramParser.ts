export type InstagramTarget =
  | { kind: 'post'; url: string }
  | { kind: 'reel'; reelId: string; url: string }
  | { kind: 'story'; username: string; storyId: string; url: string }
  | { kind: 'profile'; username: string; url: string };

export function parseInstagramInput(input: string): InstagramTarget | null {
  try {
    // Handle URLs without protocol
    let urlString = input.trim();
    if (!urlString.startsWith('http')) {
      urlString = 'https://' + urlString;
    }
    
    const u = new URL(urlString);
    
    // Check if it's an Instagram URL
    if (!u.hostname.includes('instagram.com')) {
      return null;
    }
    
    const parts = u.pathname.split('/').filter(Boolean);
    
    if (parts[0] === 'p' && parts[1]) return { kind: 'post', url: u.toString() };
    if (parts[0] === 'reel' && parts[1]) return { kind: 'reel', reelId: parts[1], url: u.toString() };
    if (parts[0] === 'stories' && parts[1] && parts[2])
      return { kind: 'story', username: parts[1], storyId: parts[2], url: u.toString() };
    if (parts[0]) return { kind: 'profile', username: parts[0], url: u.toString() };
    return null;
  } catch {
    // Treat as username without URL
    const username = input.trim().replace('@', '');
    if (!username) return null;
    return { kind: 'profile', username, url: `https://www.instagram.com/${username}` };
  }
}
