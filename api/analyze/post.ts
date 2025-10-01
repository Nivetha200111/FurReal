import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const url = req.query.url;
	if (!url || typeof url !== 'string') {
		return res.status(400).json({ error: 'Invalid url' });
	}
	return res.status(200).json({ message: 'Queued analysis for post', url, jobId: 'vercel-mock-job' });
}
