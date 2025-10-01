import type { VercelRequest, VercelResponse } from '@vercel/node';

function mask(value?: string) {
	if (!value) return null;
	const v = String(value);
	if (v.length <= 8) return '****';
	return `${v.slice(0,4)}...${v.slice(-4)} (len:${v.length})`;
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
	const hf = process.env.HUGGINGFACE_API_KEY;
	res.status(200).json({
		HUGGINGFACE_API_KEY_present: Boolean(hf),
		HUGGINGFACE_API_KEY_masked: mask(hf),
		env: process.env.NODE_ENV || 'unknown'
	});
}
