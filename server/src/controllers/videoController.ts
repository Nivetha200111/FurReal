import { Request, Response } from 'express';
import { z } from 'zod';

const analyzePostQuery = z.object({ url: z.string().url() });

export async function analyzePost(req: Request, res: Response) {
  const parsed = analyzePostQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid url' });
  const { url } = parsed.data;
  return res.json({ message: 'Queued analysis for post', url, jobId: 'mock-job-123' });
}

export async function analyzeReelById(req: Request, res: Response) {
  const { reelId } = req.params;
  if (!reelId) return res.status(400).json({ error: 'Missing reelId' });
  return res.json({ message: 'Queued analysis for reel', reelId, jobId: 'mock-job-124' });
}

export async function analyzeProfile(req: Request, res: Response) {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username' });
  return res.json({ message: 'Queued profile analysis', username, jobId: 'mock-job-125' });
}

export async function analyzeStory(req: Request, res: Response) {
  const { username, storyId } = req.params;
  if (!username || !storyId) return res.status(400).json({ error: 'Missing params' });
  return res.json({ message: 'Queued story analysis', username, storyId, jobId: 'mock-job-126' });
}

export async function getResults(req: Request, res: Response) {
  const { postId } = req.params;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });
  return res.json({ postId, status: 'pending' });
}

export async function getCreatorStats(req: Request, res: Response) {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: 'Missing username' });
  return res.json({ username, aiContentPercentage: 0 });
}

export async function getTrendingCreators(_req: Request, res: Response) {
  return res.json({ creators: [] });
}

export async function exportResults(req: Request, res: Response) {
  const { postId } = req.params;
  const { format = 'json' } = req.query as { format?: string };
  if (!postId) return res.status(400).json({ error: 'Missing postId' });
  return res.json({ postId, format });
}

export async function shareToInstagram(req: Request, res: Response) {
  const { postId } = req.body || {};
  if (!postId) return res.status(400).json({ error: 'Missing postId' });
  return res.json({ message: 'Share asset generated', postId });
}
