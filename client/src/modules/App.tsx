import { InstagramInput } from '../modules/components/InstagramInput';

export function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/20 via-blue-100/10 to-cyan-50/20 backdrop-blur-sm">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-blue-200/30 shadow-xl">
          <h1 className="text-3xl font-bold text-blue-900/90 mb-2">FurReal</h1>
          <p className="text-sm text-blue-700/70 mb-4">Server: online</p>
          <InstagramInput />
        </div>
      </div>
    </div>
  );
}
