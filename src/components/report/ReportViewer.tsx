'use client';
import { DIMENSIONS } from '@/config/dimensions';
import { getItemsByDimension } from '@/config/checklist';
import { getScoreLabel } from '@/config/scoring';
import type { AuditWithRelations, AuditDimensionResult } from '@/types/audit';
import type { AIDimensionOutput } from '@/types/aiOutputs';
import type { DimensionCode } from '@/types/checklist';
import { formatDate } from '@/lib/utils';
import * as Icons from 'lucide-react';

// ── Colour helpers ────────────────────────────────────────────────────────────
function sc(score: number | null | undefined) {
  if (!score) return '#94a3b8';
  if (score <= 40) return '#ef4444';
  if (score <= 60) return '#f59e0b';
  if (score <= 75) return '#ca8a04';
  if (score <= 90) return '#16a34a';
  return '#059669';
}

// ── SVG score ring ────────────────────────────────────────────────────────────
function Ring({ score, size = 56 }: { score: number | null | undefined; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = (score ?? 0) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={sc(score)} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size < 60 ? 11 : 15} fontWeight="700" fill={sc(score)}>
        {score ?? '—'}
      </text>
    </svg>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function Status({ s }: { s: string | null | undefined }) {
  const cfg: Record<string, [string, string]> = {
    pass: ['#16a34a', '✓ Pass'], fail: ['#dc2626', '✗ Fail'],
    partial: ['#d97706', '~ Partial'], na: ['#94a3b8', '— N/A'],
  };
  const [color, label] = cfg[s?.toLowerCase() ?? 'na'] ?? cfg.na;
  return <span style={{ color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>;
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function Bar({ score, color }: { score: number | null | undefined; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score ?? 0}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: sc(score), width: 28, textAlign: 'right' }}>{score ?? '—'}</span>
    </div>
  );
}

// ── Single dimension section ──────────────────────────────────────────────────
function DimSection({ dim, result }: { dim: typeof DIMENSIONS[0]; result?: AuditDimensionResult }) {
  const checkItems = getItemsByDimension(dim.code as DimensionCode);
  const findings = result?.aiFindings as unknown as AIDimensionOutput | undefined;
  const aiItems = findings?.items ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (Icons as any)[dim.icon] || Icons.Building2;

  return (
    <div style={{ marginBottom: 0 }}>
      {/* Dimension header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `3px solid ${dim.color}`, paddingBottom: 8, marginBottom: 10 }}>
        <div style={{ background: `${dim.color}18`, borderRadius: 6, padding: 5, flexShrink: 0 }}>
          <Icon style={{ width: 14, height: 14, color: dim.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{dim.code}: {dim.name}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 8 }}>Weight: {dim.weight}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ring score={result?.score} size={48} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sc(result?.score) }}>
              {result?.score != null ? `${result.score}/100` : 'N/A'}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {result?.score != null ? getScoreLabel(result.score) : (result?.status ?? 'Pending')}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {findings?.summary && (
        <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, marginBottom: 10, orphans: 3, widows: 3 }}>
          {findings.summary}
        </p>
      )}

      {/* Strengths + Flags */}
      {(findings?.strengths?.length || findings?.criticalFlags?.length) ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
          {findings?.strengths?.length ? (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>▲ Strengths</div>
              {findings.strengths.slice(0, 3).map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2, paddingLeft: 10, borderLeft: '2px solid #86efac' }}>
                  {s}
                </div>
              ))}
            </div>
          ) : null}
          {findings?.criticalFlags?.length ? (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>▼ Critical Flags</div>
              {findings.criticalFlags.slice(0, 3).map((f, i) => (
                <div key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2, paddingLeft: 10, borderLeft: '2px solid #fca5a5' }}>
                  {f}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Checklist table — rows use break-inside:avoid individually */}
      {aiItems.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 8 }}>
          <thead>
            <tr style={{ background: `${dim.color}14` }}>
              {['Item', 'Status', 'Finding', 'Recommendation'].map(h => (
                <th key={h} style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checkItems.map(item => {
              const ai = aiItems.find(r => r.code === item.code);
              if (!ai) return null;
              const rowBg = ai.status === 'fail' ? '#fff5f5' : ai.status === 'pass' ? '#f0fdf4' : 'transparent';
              return (
                <tr key={item.code} style={{ background: rowBg, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', width: '28%' }}>
                    <span style={{ fontWeight: 600, color: '#94a3b8', marginRight: 4 }}>{item.code}</span>
                    <span style={{ color: '#1e293b' }}>{item.label}</span>
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', width: 64, textAlign: 'center' }}>
                    <Status s={ai.status} />
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', color: '#374151' }}>{ai.finding || '—'}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', color: '#64748b', width: '22%', fontSize: 9 }}>{ai.recommendation || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Quick wins */}
      {findings?.quickWins?.length ? (
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>→ Quick Wins: </span>
          {findings.quickWins.slice(0, 4).map((w, i) => (
            <span key={i} style={{ fontSize: 10, color: '#374151' }}>{w}{i < Math.min(findings!.quickWins!.length, 4) - 1 ? ' · ' : ''}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ReportViewer({ audit }: { audit: AuditWithRelations }) {
  const dims = audit.dimensions ?? [];
  const dm = Object.fromEntries(dims.map(d => [d.code, d]));
  const brand = audit.developer?.brandName ?? 'Brand';

  // Aggregate top-level insights
  const strengths: { dim: string; text: string }[] = [];
  const flags: { dim: string; text: string }[] = [];
  const wins: { dim: string; text: string }[] = [];
  for (const d of DIMENSIONS) {
    const f = dm[d.code]?.aiFindings as unknown as AIDimensionOutput | undefined;
    f?.strengths?.slice(0, 2).forEach(t => strengths.push({ dim: d.code, text: t }));
    f?.criticalFlags?.slice(0, 2).forEach(t => flags.push({ dim: d.code, text: t }));
    f?.quickWins?.slice(0, 2).forEach(t => wins.push({ dim: d.code, text: t }));
  }

  // ── Shared inline styles ──────────────────────────────────────────────────
  const cell: React.CSSProperties = { border: '1px solid #e2e8f0', padding: '6px 8px' };
  const sectionTitle = (color: string): React.CSSProperties => ({
    fontSize: 18, fontWeight: 900, color, borderBottom: `3px solid ${color}`,
    paddingBottom: 6, marginBottom: 20, marginTop: 0,
  });

  return (
    /*
     * CRITICAL: wrap everything in a <table> with <thead>.
     * <thead> is the ONLY reliable cross-browser mechanism to
     * repeat a header on every printed page.
     */
    <table id="report-root" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#0f172a', background: 'white' }}>
      <thead>
        <tr>
          <td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 32px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Propacity Brand Audit Report
              </span>
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{brand}</span>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr><td style={{ padding: 0 }}>

          {/* ── COVER ──────────────────────────────────────────────────────── */}
          <div style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 64px', pageBreakAfter: 'always', breakAfter: 'page' }}>
            {/* Top tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Propacity</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>Confidential Brand Intelligence Report</span>
            </div>

            {/* Centre */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Brand Audit Report</span>
              </div>
              <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>{brand}</h1>
              {audit.developer?.city && <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 4px' }}>{audit.developer.city}</p>}
              {audit.developer?.positioning && (
                <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: '0 0 40px', maxWidth: 480 }}>
                  &ldquo;{audit.developer.positioning}&rdquo;
                </p>
              )}
              {audit.overallScore != null && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Ring score={audit.overallScore} size={120} />
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                      {Math.round(audit.overallScore)}<span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>/100</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sc(audit.overallScore) }}>{getScoreLabel(audit.overallScore)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 16, fontSize: 10, color: '#94a3b8' }}>
              <span>Audit Date: {formatDate(audit.auditDate || new Date())}</span>
              {audit.auditorName && <span>Auditor: {audit.auditorName}</span>}
              <span>Propacity Brand Audit</span>
            </div>
          </div>

          {/* ── EXECUTIVE SUMMARY ────────────────────────────────────────── */}
          <div style={{ padding: '32px 64px', pageBreakAfter: 'always', breakAfter: 'page' }}>
            <h2 style={sectionTitle('#4f46e5')}>Executive Summary</h2>

            {/* Dimension score grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 28 }}>
              {DIMENSIONS.map(d => (
                <div key={d.code} style={{ border: '1px solid #e2e8f0', borderTop: `4px solid ${d.color}`, borderRadius: 8, padding: '10px 8px', textAlign: 'center', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 2 }}>{d.code}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: sc(dm[d.code]?.score) }}>{dm[d.code]?.score ?? '—'}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6 }}>{d.name}</div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${dm[d.code]?.score ?? 0}%`, height: '100%', background: d.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Audit objective / red flags */}
            {(audit.objective || audit.knownRedFlags) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {audit.objective && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Audit Objective</div>
                    <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{audit.objective}</p>
                  </div>
                )}
                {audit.knownRedFlags && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Known Red Flags</div>
                    <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{audit.knownRedFlags}</p>
                  </div>
                )}
              </div>
            )}

            {/* Scorecard table */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Dimension Scorecard</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Dimension', 'Weight', 'Score', 'Performance', 'Tier'].map(h => (
                    <th key={h} style={{ ...cell, fontWeight: 600, color: '#374151', textAlign: h === 'Weight' || h === 'Score' ? 'center' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map(d => {
                  const r = dm[d.code];
                  return (
                    <tr key={d.code} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <td style={cell}><span style={{ fontWeight: 600, color: '#94a3b8', marginRight: 6 }}>{d.code}</span>{d.name}</td>
                      <td style={{ ...cell, textAlign: 'center', color: '#64748b' }}>{d.weight}%</td>
                      <td style={{ ...cell, textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: sc(r?.score) }}>{r?.score ?? '—'}</span>
                      </td>
                      <td style={{ ...cell, width: 160 }}><Bar score={r?.score} color={d.color} /></td>
                      <td style={{ ...cell, color: sc(r?.score), fontSize: 10 }}>
                        {r?.score != null ? getScoreLabel(r.score) : (r?.status ?? 'Pending')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── MAJOR STRENGTHS ──────────────────────────────────────────── */}
          {strengths.length > 0 && (
            <div style={{ padding: '32px 64px' }}>
              <h2 style={sectionTitle('#16a34a')}>Major Strengths</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {strengths.slice(0, 10).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <span style={{ fontSize: 12, color: '#16a34a', flexShrink: 0 }}>✓</span>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', marginRight: 6, background: '#dcfce7', padding: '1px 5px', borderRadius: 4 }}>{s.dim}</span>
                      <span style={{ fontSize: 11, color: '#374151' }}>{s.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MAJOR AREAS TO WORK ON ───────────────────────────────────── */}
          {flags.length > 0 && (
            <div style={{ padding: '32px 64px' }}>
              <h2 style={sectionTitle('#dc2626')}>Major Areas to Work On</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {flags.slice(0, 10).map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <span style={{ fontSize: 12, color: '#dc2626', flexShrink: 0 }}>!</span>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#b91c1c', marginRight: 6, background: '#fee2e2', padding: '1px 5px', borderRadius: 4 }}>{f.dim}</span>
                      <span style={{ fontSize: 11, color: '#374151' }}>{f.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUICK WINS ───────────────────────────────────────────────── */}
          {wins.length > 0 && (
            <div style={{ padding: '32px 64px', pageBreakAfter: 'always', breakAfter: 'page' }}>
              <h2 style={sectionTitle('#2563eb')}>Quick Wins</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {wins.slice(0, 10).map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <span style={{ fontSize: 12, color: '#2563eb', flexShrink: 0 }}>→</span>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#1d4ed8', marginRight: 6, background: '#dbeafe', padding: '1px 5px', borderRadius: 4 }}>{w.dim}</span>
                      <span style={{ fontSize: 11, color: '#374151' }}>{w.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DIMENSION ANALYSIS ───────────────────────────────────────── */}
          <div style={{ padding: '32px 64px' }}>
            <h2 style={{ ...sectionTitle('#374151'), pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>Dimension Analysis</h2>
            {DIMENSIONS.map((d, i) => (
              <div key={d.code} style={{ marginBottom: 32, pageBreakBefore: i === 0 ? 'avoid' : 'always', breakBefore: i === 0 ? 'avoid' : 'page', paddingTop: i === 0 ? 0 : 0 }}>
                <DimSection dim={d} result={dm[d.code]} />
              </div>
            ))}
          </div>

          {/* ── FOOTER ───────────────────────────────────────────────────── */}
          <div style={{ padding: '16px 64px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8' }}>
            <span style={{ fontWeight: 700, color: '#6366f1' }}>Propacity</span>
            <span>Confidential — {brand} Brand Audit — {formatDate(audit.auditDate || new Date())}</span>
            <span>End of Report</span>
          </div>

        </td></tr>
      </tbody>
    </table>
  );
}
