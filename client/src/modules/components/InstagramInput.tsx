import { useState } from 'react';

export function InstagramInput() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = new URL(input);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/post?url=${encodeURIComponent(url.toString())}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError('Enter a valid Instagram URL');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <pre className="bg-neutral-900 border border-neutral-800 rounded p-3 text-xs overflow-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
