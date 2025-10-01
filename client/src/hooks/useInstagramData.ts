import { useCallback, useState } from 'react';
import { api } from '../services/api';
import { parseInstagramInput, InstagramTarget } from '../services/instagramParser';

export function useInstagramData() {
  const [target, setTarget] = useState<InstagramTarget | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (input: string) => {
    setError(null);
    const parsed = parseInstagramInput(input);
    if (!parsed) {
      setError('Invalid Instagram input');
      return null;
    }
    setTarget(parsed);
    if (parsed.kind === 'post' || parsed.kind === 'reel' || parsed.kind === 'story' || parsed.kind === 'profile') {
      const url = parsed.url;
      const res = await api.analyzePost(url);
      setJobId(res.jobId);
      return res;
    }
    return null;
  }, []);

  return { target, jobId, error, analyze };
}
