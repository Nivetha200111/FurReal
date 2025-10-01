import { ProbabilityBadge } from './ProbabilityBadge';

export interface ResultData {
  post?: { url: string; type?: string; thumbnail?: string; author?: string; authorUrl?: string; caption?: string; hfCaption?: string };
  summary?: { aiProbability: number; label: string; mode?: string };
  signals?: { hashtagMatches?: string[]; textHints?: string[] };
}

export function ResultCard({ data }: { data: ResultData }) {
  if (!data.post || !data.summary) return null;
  const p = data.summary.aiProbability;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 flex gap-3">
      {data.post.thumbnail && (
        <img src={data.post.thumbnail} alt="thumb" className="w-28 h-36 object-cover rounded" />
      )}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <a href={data.post.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline truncate max-w-[12rem]">{data.post.type?.toUpperCase() || 'POST'}</a>
            {data.post.author && (
              <span className="text-xs text-neutral-500 truncate max-w-[10rem]">by {data.post.author}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ProbabilityBadge p={p} />
            <span className="text-xs text-neutral-400">{data.summary.label}</span>
          </div>
        </div>
        {data.post.caption && (
          <p className="text-sm text-neutral-300 line-clamp-2">{data.post.caption}</p>
        )}
        {data.signals?.hashtagMatches && data.signals.hashtagMatches.length > 0 && (
          <div className="text-xs text-neutral-400">Hashtags: {data.signals.hashtagMatches.join(', ')}</div>
        )}
        {data.summary.mode && (
          <div className="text-[11px] text-neutral-500">Mode: {data.summary.mode}</div>
        )}
      </div>
    </div>
  );
}
