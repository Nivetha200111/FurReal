export interface InstagramSession {
  sessionId?: string;
  userAgent?: string;
  proxyUrl?: string;
}

export function getInstagramSession(): InstagramSession {
  return {
    sessionId: process.env.INSTAGRAM_SESSION_ID,
    userAgent: process.env.USER_AGENT_ROTATION === 'true' ? undefined : undefined,
    proxyUrl: process.env.PROXY_URL,
  };
}
