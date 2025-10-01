const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

async function http<T>(input: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${input}`, {
		headers: { 'Content-Type': 'application/json' },
		...init,
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export const api = {
	analyzePost: (url: string) => http<{ jobId: string; message: string }>(`/analyze/post?url=${encodeURIComponent(url)}`),
	getResults: (postId: string) => http(`/results/${postId}`),
	trendingCreators: () => http(`/trending/ai-creators`),
};