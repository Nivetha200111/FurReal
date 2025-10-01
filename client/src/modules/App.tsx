import { useEffect, useState } from 'react';
import { InstagramInput } from '../modules/components/InstagramInput';

export function App() {
  const [health, setHealth] = useState<string>('checking...');
  useEffect(() => {
    fetch((import.meta.env.VITE_API_BASE_URL || '/api') + '/health')
      .then(r => r.json())
      .then(d => setHealth(d.status || 'ok'))
      .catch(() => setHealth('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">PawPrint AI</h1>
        <p className="text-sm text-neutral-400">Server: {health}</p>
        <InstagramInput />
      </div>
    </div>
  );
}
