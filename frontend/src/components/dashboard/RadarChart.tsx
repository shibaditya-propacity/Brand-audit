'use client';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DIMENSIONS } from '@/config/dimensions';

interface RadarChartProps {
  dimensionScores: Partial<Record<string, number | null>>;
}

export function RadarChart({ dimensionScores }: RadarChartProps) {
  const data = DIMENSIONS.map(d => ({
    subject: d.shortName,
    score: dimensionScores[d.code] ?? 0,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickCount={5} />
        <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
