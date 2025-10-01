import type { VercelRequest, VercelResponse } from '@vercel/node';

const HF_KEY = process.env.HUGGINGFACE_API_KEY;

const AI_HASHTAGS = [
	'#aigenerated', '#sora', '#runwayml', '#midjourney',
	'#aivideo', '#generativeai', '#notreal', '#aianimals', '#digitalart', '#aiart'
];

const AI_HINT_WORDS = [
	'cgi', 'render', 'rendered', '3d', '3-d', 'animation', 'animated', 'cartoon', 'toon', 'pixar', 'unreal', 'ai', 'synthetic', 'fake', 'vfx', 'deepfake', 'doll', 'toy', 'illustration', 'painting'
];

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function scoreFromText(text: string): number {
	const lower = text.toLowerCase();
	let s = 0;
	for (const w of AI_HINT_WORDS) if (lower.includes(w)) s += 0.12;
	return clamp01(s);
}

function extractHashtags(text: string): string[] {
	return (text.match(/#[\p{L}\p{N}_]+/gu) || []).map(h => h.toLowerCase());
}

async function fetchInstagramOEmbed(targetUrl: string) {
	try {
		const endpoint = `https://www.instagram.com/oembed/?url=${encodeURIComponent(targetUrl)}&omitscript=true`;
		const res = await fetch(endpoint, { headers: { 'User-Agent': 'Mozilla/5.0 PawPrintAI' } });
		if (!res.ok) return null;
		return (await res.json()) as any;
	} catch {
		return null;
	}
}

async function captionWithHuggingFace(imageUrl: string): Promise<string | null> {
	if (!HF_KEY) return null;
	try {
		const imgRes = await fetch(imageUrl);
		if (!imgRes.ok) return null;
		const img = Buffer.from(await imgRes.arrayBuffer());
		const hf = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large', {
			method: 'POST',
			headers: { Authorization: `Bearer ${HF_KEY}`, 'Content-Type': 'application/octet-stream' },
			body: img,
		});
		if (!hf.ok) return null;
		const data = await hf.json();
		if (Array.isArray(data) && data[0]?.generated_text) return String(data[0].generated_text);
		return null;
	} catch {
		return null;
	}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const url = req.query.url;
	if (!url || typeof url !== 'string') return res.status(200).json({ error: 'Invalid url' });

	const meta = await fetchInstagramOEmbed(url);
	const caption: string = meta?.title || '';
	const tags = extractHashtags(caption);
	const matchedTags = AI_HASHTAGS.filter(t => tags.includes(t));

	let hfCaption: string | null = null;
	if (meta?.thumbnail_url) {
		hfCaption = await captionWithHuggingFace(meta.thumbnail_url);
	}

	let score = 0;
	if (matchedTags.length) score += Math.min(0.45, matchedTags.length * 0.18);
	score += scoreFromText(caption);
	if (hfCaption) score += scoreFromText(hfCaption) * 0.8;
	// If everything failed, fall back to URL-based heuristic (e.g., /reel/ is neutral)
	if (!meta && !hfCaption && !caption) {
		const urlLower = decodeURIComponent(url).toLowerCase();
		if (urlLower.includes('ai') || urlLower.includes('gen')) score += 0.3;
	}
	score = clamp01(score);

	return res.status(200).json({
		post: {
			url,
			type: url.includes('/reel/') ? 'reel' : url.includes('/p/') ? 'post' : 'unknown',
			thumbnail: meta?.thumbnail_url,
			author: meta?.author_name,
			authorUrl: meta?.author_url,
			caption,
			hfCaption,
			provider: 'instagram',
		},
		summary: {
			aiProbability: score,
			label: score > 0.8 ? 'Likely AI' : score > 0.55 ? 'Suspicious' : 'Likely Real',
			mode: HF_KEY ? 'prod' : 'fallback'
		},
		signals: {
			hashtagMatches: matchedTags,
			textHints: AI_HINT_WORDS.filter(w => (caption.toLowerCase().includes(w) || (hfCaption?.toLowerCase().includes(w) ?? false))),
		},
	});
}
