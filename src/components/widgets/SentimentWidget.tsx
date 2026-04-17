import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AIReputationFindings } from '@/types/aiOutputs';

interface SentimentWidgetProps {
  findings: unknown;
}

export function SentimentWidget({ findings }: SentimentWidgetProps) {
  const f = findings as AIReputationFindings | null;
  if (!f?.sentimentBreakdown) return null;

  const data = [
    { name: 'Positive', value: f.sentimentBreakdown.positive, fill: '#22c55e' },
    { name: 'Neutral', value: f.sentimentBreakdown.neutral, fill: '#94a3b8' },
    { name: 'Negative', value: f.sentimentBreakdown.negative, fill: '#ef4444' },
  ];

  return (
    <div className="rounded-lg border bg-white p-4 space-y-4">
      <h3 className="font-semibold text-sm">Review Sentiment</h3>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
          <Tooltip formatter={(v: number) => [`${v}%`]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {(f.positiveThemes?.length > 0 || f.negativeThemes?.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {f.positiveThemes?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">Positive Themes</p>
              <ul className="space-y-0.5">
                {f.positiveThemes.slice(0, 4).map((t, i) => <li key={i} className="text-xs text-gray-600">• {t}</li>)}
              </ul>
            </div>
          )}
          {f.negativeThemes?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Negative Themes</p>
              <ul className="space-y-0.5">
                {f.negativeThemes.slice(0, 4).map((t, i) => <li key={i} className="text-xs text-gray-600">• {t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
