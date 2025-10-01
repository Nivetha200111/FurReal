export function ProbabilityBadge({ p }: { p: number }) {
  const color = p > 0.8 ? 'bg-red-500/20 text-red-300' : p > 0.55 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300';
  return (
    <span className={`text-xs px-2 py-1 rounded ${color}`}>
      {(p * 100).toFixed(1)}%
    </span>
  );
}
