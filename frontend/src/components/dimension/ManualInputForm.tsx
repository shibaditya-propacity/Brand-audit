'use client';
import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Save, RefreshCw, CheckCircle, XCircle, Loader2, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Field config ─────────────────────────────────────────────────────────────

type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea';

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

const DIMENSION_FIELDS: Record<string, FieldConfig[]> = {
  D1: [
    { key: 'googleRanking', label: 'Google search ranking for brand name', type: 'text', placeholder: 'e.g. #1, Page 2, Not found' },
    { key: 'knowledgePanelExists', label: 'Google Knowledge Panel exists', type: 'boolean' },
    { key: 'linkedinListed', label: 'LinkedIn company page verified', type: 'boolean' },
    { key: 'employeeCount', label: 'Employee count (approximate)', type: 'number', placeholder: 'e.g. 50', min: 0 },
    { key: 'brandGuidelinesExist', label: 'Brand guidelines document exists', type: 'boolean' },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Brand positioning, market presence notes...' },
  ],
  D2: [
    { key: 'domainAuthority', label: 'Domain Authority (DA) score', type: 'number', min: 0, max: 100, placeholder: 'e.g. 35' },
    { key: 'backlinkCount', label: 'Approximate backlink count', type: 'number', min: 0, placeholder: 'e.g. 450' },
    { key: 'pageSpeedMobile', label: 'Google PageSpeed mobile score', type: 'number', min: 0, max: 100, placeholder: 'e.g. 62' },
    { key: 'pageSpeedDesktop', label: 'Google PageSpeed desktop score', type: 'number', min: 0, max: 100, placeholder: 'e.g. 85' },
    { key: 'sslEnabled', label: 'SSL certificate enabled (HTTPS)', type: 'boolean' },
    { key: 'mobileResponsive', label: 'Website is mobile responsive', type: 'boolean' },
    { key: 'primaryKeywords', label: 'Primary keywords and rankings', type: 'textarea', placeholder: '"luxury flats Mumbai" - pos. 5, "3BHK Powai" - pos. 12' },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Any other SEO or website quality notes...' },
  ],
  D3: [
    { key: 'instagramFollowers', label: 'Instagram followers', type: 'number', min: 0, placeholder: 'e.g. 12500' },
    { key: 'instagramPosts', label: 'Total Instagram posts', type: 'number', min: 0, placeholder: 'e.g. 340' },
    { key: 'instagramEngagementRate', label: 'Instagram engagement rate', type: 'text', placeholder: 'e.g. 2.5%' },
    { key: 'instagramPostsPerWeek', label: 'Instagram posts per week', type: 'number', min: 0, placeholder: 'e.g. 3' },
    { key: 'facebookPageLikes', label: 'Facebook page likes', type: 'number', min: 0, placeholder: 'e.g. 8000' },
    { key: 'facebookFollowers', label: 'Facebook page followers', type: 'number', min: 0, placeholder: 'e.g. 9200' },
    { key: 'linkedinFollowers', label: 'LinkedIn page followers', type: 'number', min: 0, placeholder: 'e.g. 2300' },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Content quality, posting consistency notes...' },
  ],
  D4: [
    { key: 'runningMetaAds', label: 'Currently running Meta (Facebook/Instagram) ads', type: 'boolean' },
    { key: 'activeMetaAdsCount', label: 'Number of active Meta ads', type: 'number', min: 0, placeholder: 'e.g. 12' },
    { key: 'metaAdSpend', label: 'Estimated Meta ad spend range', type: 'select', options: ['', '<₹1L/mo', '₹1–5L/mo', '₹5–20L/mo', '₹20–50L/mo', '₹50L+/mo'] },
    { key: 'runningGoogleAds', label: 'Currently running Google Ads', type: 'boolean' },
    { key: 'adCreativeQuality', label: 'Ad creative quality', type: 'select', options: ['', 'Excellent', 'Good', 'Average', 'Poor'] },
    { key: 'adTargetingNotes', label: 'Ad targeting and strategy notes', type: 'textarea', placeholder: 'Target audience, geographic targeting, formats used...' },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Any other paid media notes...' },
  ],
  D5: [
    { key: 'logoQuality', label: 'Logo quality & professionalism', type: 'select', options: ['', 'Excellent', 'Good', 'Average', 'Poor'] },
    { key: 'hasLogoVariants', label: 'Has multiple logo variants (dark/light/icon)', type: 'boolean' },
    { key: 'brandColorConsistency', label: 'Brand colors consistent across touchpoints', type: 'boolean' },
    { key: 'typographyConsistent', label: 'Typography consistent across materials', type: 'boolean' },
    { key: 'websiteDesignQuality', label: 'Website design quality', type: 'select', options: ['', 'Excellent', 'Good', 'Average', 'Poor'] },
    { key: 'hasBrandGuidelines', label: 'Brand guidelines document exists', type: 'boolean' },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Design consistency, visual identity notes...' },
  ],
  D6: [
    { key: 'hasBrochure', label: 'Project brochure exists', type: 'boolean' },
    { key: 'brochureQuality', label: 'Brochure quality', type: 'select', options: ['', 'Excellent', 'Good', 'Average', 'Poor'] },
    { key: 'hasSalesKit', label: 'Sales kit / presentation exists', type: 'boolean' },
    { key: 'hasCaseStudies', label: 'Case studies or testimonials exist', type: 'boolean' },
    { key: 'hasPressKit', label: 'Press kit / media kit exists', type: 'boolean' },
    { key: 'siteExperienceQuality', label: 'On-site sales experience quality', type: 'select', options: ['', 'Excellent', 'Good', 'Average', 'Poor'] },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Collateral availability, quality, and gaps...' },
  ],
  D7: [
    { key: 'gmbRating', label: 'Google My Business rating (0–5)', type: 'number', min: 0, max: 5, step: 0.1, placeholder: 'e.g. 4.2' },
    { key: 'gmbReviewCount', label: 'Total number of Google reviews', type: 'number', min: 0, placeholder: 'e.g. 156' },
    { key: 'reraRegistered', label: 'RERA registered', type: 'boolean' },
    { key: 'reraCompliant', label: 'RERA website/compliance up to date', type: 'boolean' },
    { key: 'consumerComplaintCount', label: 'Known consumer complaints (approx.)', type: 'number', min: 0, placeholder: 'e.g. 5' },
    { key: 'reputationNotes', label: 'Reputation and compliance notes', type: 'textarea', placeholder: 'Legal issues, negative press, compliance gaps...' },
    { key: 'notes', label: 'Additional observations', type: 'textarea' },
  ],
  D8: [
    { key: 'crmTool', label: 'CRM tool in use', type: 'text', placeholder: 'e.g. Salesforce, HubSpot, Sell.do, None' },
    { key: 'googleAnalyticsInstalled', label: 'Google Analytics installed', type: 'boolean' },
    { key: 'facebookPixelInstalled', label: 'Facebook / Meta Pixel installed', type: 'boolean' },
    { key: 'hasWhatsappIntegration', label: 'WhatsApp integration on website', type: 'boolean' },
    { key: 'hasChatbot', label: 'Chatbot or live chat on website', type: 'boolean' },
    { key: 'hasLeadForms', label: 'Lead capture forms on website', type: 'boolean' },
    { key: 'techStackNotes', label: 'Technology stack notes', type: 'textarea', placeholder: 'Known tools, platforms, integrations...' },
    { key: 'notes', label: 'Additional observations', type: 'textarea' },
  ],
  D9: [
    { key: 'mainCompetitors', label: 'Main competitors (one per line)', type: 'textarea', placeholder: 'Competitor A\nCompetitor B\nCompetitor C' },
    { key: 'competitiveStrengths', label: 'Brand strengths vs competitors', type: 'textarea', placeholder: 'What does this brand do better?' },
    { key: 'competitiveWeaknesses', label: 'Brand weaknesses vs competitors', type: 'textarea', placeholder: 'Where do competitors have an edge?' },
    { key: 'marketPositioningNotes', label: 'Market positioning observations', type: 'textarea', placeholder: 'Price positioning, segment, differentiation...' },
    { key: 'notes', label: 'Additional observations', type: 'textarea' },
  ],
  D10: [
    { key: 'promoterLinkedInFollowers', label: 'Promoter LinkedIn followers', type: 'number', min: 0, placeholder: 'e.g. 3500' },
    { key: 'promoterHasArticles', label: 'Promoter has published articles/blog posts', type: 'boolean' },
    { key: 'promoterSpeakingEngagements', label: 'Promoter speaks at industry events', type: 'boolean' },
    { key: 'promoterMediaCoverage', label: 'Promoter featured in media/news', type: 'boolean' },
    { key: 'promoterInstagramFollowers', label: 'Promoter Instagram followers', type: 'number', min: 0, placeholder: 'e.g. 5200' },
    { key: 'promoterReputation', label: 'Promoter personal brand strength', type: 'select', options: ['', 'Strong', 'Moderate', 'Weak', 'Not established'] },
    { key: 'notes', label: 'Additional observations', type: 'textarea', placeholder: 'Personal brand, credibility, thought leadership notes...' },
  ],
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManualInputFormProps {
  dimensionCode: string;
  auditId: string;
  initialData?: Record<string, unknown>;
  onSaved?: () => void;
}

type RerunPhase = 'idle' | 'collecting' | 'analyzing' | 'done' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

export function ManualInputForm({ dimensionCode, auditId, initialData, onSaved }: ManualInputFormProps) {
  const fields = DIMENSION_FIELDS[dimensionCode] ?? [];
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>(initialData ?? {});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [rerunPhase, setRerunPhase] = useState<RerunPhase>('idle');
  const [rerunStatus, setRerunStatus] = useState('');
  const esRef = useRef<EventSource | null>(null);

  if (fields.length === 0) return null;

  function setValue(key: string, value: unknown) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  async function save(): Promise<boolean> {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/audit/${auditId}/manual-input`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimensionCode, data: values }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Save failed');
      setSaveState('saved');
      onSaved?.();
      setTimeout(() => setSaveState('idle'), 2500);
      return true;
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
      return false;
    }
  }

  async function saveAndRerun() {
    const ok = await save();
    if (!ok) return;

    setRerunPhase('collecting');
    setRerunStatus('Starting analysis…');

    const es = new EventSource(
      `/api/audit/${auditId}/rerun?dimension=${dimensionCode}&skipCollection=true`
    );
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { stage: string; message?: string; dimension?: string; score?: number | null; source?: string; status?: string };
        if (data.stage === 'collecting') {
          setRerunStatus(data.message ?? 'Skipping collection…');
        } else if (data.stage === 'analyzing') {
          setRerunPhase('analyzing');
          setRerunStatus(`Analyzing ${data.dimension ?? dimensionCode}…`);
        } else if (data.stage === 'complete') {
          setRerunPhase('done');
          setRerunStatus(data.score != null ? `Done — Score: ${data.score}` : 'Analysis complete');
          es.close();
          onSaved?.();
          setTimeout(() => { setRerunPhase('idle'); setRerunStatus(''); }, 4000);
        } else if (data.stage === 'error') {
          setRerunPhase('error');
          setRerunStatus(data.message ?? 'Analysis failed');
          es.close();
          setTimeout(() => { setRerunPhase('idle'); setRerunStatus(''); }, 4000);
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      setRerunPhase('error');
      setRerunStatus('Connection lost');
      es.close();
      setTimeout(() => { setRerunPhase('idle'); setRerunStatus(''); }, 4000);
    };
  }

  const running = rerunPhase === 'collecting' || rerunPhase === 'analyzing';

  return (
    <div data-manual-form className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Manual Data Input</span>
          {Object.values(values).some(v => v !== null && v !== undefined && v !== '') && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
              {Object.values(values).filter(v => v !== null && v !== undefined && v !== '').length} filled
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fill in data you have gathered manually. This will be passed to the AI as auditor-verified ground truth during analysis.
          </p>

          <div className="space-y-3">
            {fields.map(field => (
              <FieldInput
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={v => setValue(field.key, v)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={save}
              disabled={saveState === 'saving'}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                saveState === 'saved'
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : saveState === 'error'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              {saveState === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> :
               saveState === 'saved' ? <CheckCircle className="h-3 w-3" /> :
               saveState === 'error' ? <XCircle className="h-3 w-3" /> :
               <Save className="h-3 w-3" />}
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Error' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={saveAndRerun}
              disabled={running || saveState === 'saving'}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                rerunPhase === 'done'
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : rerunPhase === 'error'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin" /> :
               rerunPhase === 'done' ? <CheckCircle className="h-3 w-3" /> :
               rerunPhase === 'error' ? <XCircle className="h-3 w-3" /> :
               <RefreshCw className="h-3 w-3" />}
              {running
                ? (rerunPhase === 'analyzing' ? 'Analyzing…' : 'Starting…')
                : rerunPhase === 'done' ? 'Done'
                : rerunPhase === 'error' ? 'Failed'
                : 'Save & Rerun Analysis'}
            </button>

            {rerunStatus && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{rerunStatus}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual field renderer ─────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inputClass =
    'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs text-slate-600 dark:text-slate-400 flex-1">{field.label}</label>
        <select
          value={value === true ? 'yes' : value === false ? 'no' : ''}
          onChange={e => onChange(e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)}
          className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
        >
          <option value="">— unknown —</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="space-y-1">
        <label className="text-xs text-slate-600 dark:text-slate-400">{field.label}</label>
        <select
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          className={inputClass}
        >
          {(field.options ?? []).map(opt => (
            <option key={opt} value={opt}>{opt || '— select —'}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="text-xs text-slate-600 dark:text-slate-400">{field.label}</label>
        <textarea
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          placeholder={field.placeholder}
          rows={3}
          className={cn(inputClass, 'resize-y min-h-[60px]')}
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="space-y-1">
        <label className="text-xs text-slate-600 dark:text-slate-400">{field.label}</label>
        <input
          type="number"
          value={(value as string | number) ?? ''}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          className={inputClass}
        />
      </div>
    );
  }

  // text
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-600 dark:text-slate-400">{field.label}</label>
      <input
        type="text"
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        placeholder={field.placeholder}
        className={inputClass}
      />
    </div>
  );
}
