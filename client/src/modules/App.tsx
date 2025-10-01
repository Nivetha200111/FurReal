import { InstagramInput } from '../modules/components/InstagramInput';

export function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">PawPrint AI</h1>
        <p className="text-sm text-neutral-400">Server: online</p>
        <InstagramInput />
      </div>
    </div>
  );
}
