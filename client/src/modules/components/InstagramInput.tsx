import { useState } from 'react';
import { ResultCard } from './ResultCard';

type Analysis = any;

export function InstagramInput() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let urlString = input.trim();
      if (!urlString.startsWith('http')) urlString = 'https://' + urlString;
      const url = new URL(urlString);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/analyze/post?url=${encodeURIComponent(url.toString())}`);
      const data: Analysis = await res.json();
      setResult(data);
      if (data.error) setError(data.error);
    } catch (e: any) {
      setError('Enter a valid Instagram URL');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">Instagram URL</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="https://www.instagram.com/reel/xxxxx"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          disabled={loading}
          onClick={analyze}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded px-4 text-sm"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-900 rounded p-2">{error}</div>
      )}

      {loading && (
        <div className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900 p-3 h-36" />
      )}

      {result && !loading && (
        <ResultCard data={result} />
      )}
    </div>
  );
}
