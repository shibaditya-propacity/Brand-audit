'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Check, AlertCircle, Pencil, Trash2, Loader2,
  Globe, MapPin, Briefcase, Calendar,
  Linkedin, Instagram, Facebook, Youtube, Twitter,
  Image, ArrowRight, ChevronLeft, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuditStore } from '@/store/auditStore';
import type { DeveloperInput } from '@/types/audit';
import { CollateralDocUpload } from '@/components/shared/CollateralDocUpload';

// ── Types ────────────────────────────────────────────────────────────────────

interface PrefillField {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string | null;
  source: 'Serper' | 'Web' | 'Clearbit' | null;
  /** Which DeveloperInput key to write when saving */
  savesTo?: keyof DeveloperInput;
  /** Optional transform applied before saving (e.g. extract IG handle) */
  transform?: (v: string) => string;
  /** Numeric field? */
  numeric?: boolean;
}

interface PrefillResponse {
  success: boolean;
  data: {
    website: string | null;
    resolvedDomain: string | null;
    industry: string | null;
    foundedYear: string | null;
    address: string | null;
    phone: string | null;
    promoterName: string | null;
    description: string | null;
    logoUrl: string | null;
    socials: {
      instagramUrl: string | null;
      instagramHandle: string | null;
      linkedinUrl: string | null;
      facebookUrl: string | null;
      youtubeUrl: string | null;
      twitterUrl: string | null;
      whatsappNumber: string | null;
    };
  } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sourceTag(src: PrefillField['source']) {
  if (!src) return null;
  const map: Record<NonNullable<PrefillField['source']>, string> = {
    Serper: 'bg-blue-50 text-blue-600 border-blue-100',
    Web: 'bg-violet-50 text-violet-600 border-violet-100',
    Clearbit: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  return (
    <span className={cn('text-[10px] font-medium border rounded px-1.5 py-0.5 ml-1 flex-shrink-0', map[src])}>
      via {src}
    </span>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function FieldSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b last:border-0">
      <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
      <Skeleton className="h-3 w-24 flex-shrink-0" />
      <Skeleton className="h-3 flex-1 max-w-xs" />
      <Skeleton className="h-4 w-10 rounded" />
    </div>
  );
}

// ── Individual field row ──────────────────────────────────────────────────────

function FieldRow({
  field,
  isEditing,
  onEdit,
  onSave,
  onClear,
}: {
  field: PrefillField;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (val: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(field.value ?? '');
  const found = field.value !== null;

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setDraft(field.value ?? '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing]);

  const commit = () => onSave(draft);

  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b last:border-0 group',
        !found && 'bg-amber-50/40',
      )}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {found
          ? <Check className="h-4 w-4 text-green-500" />
          : <AlertCircle className="h-4 w-4 text-amber-500" />}
      </div>

      {/* Field icon + label */}
      <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
        <span className="text-muted-foreground">{field.icon}</span>
        <span className="text-xs font-medium text-slate-600 truncate">{field.label}</span>
      </div>

      {/* Value / edit input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onEdit(); }}
            className="h-7 text-xs"
            placeholder={`Enter ${field.label.toLowerCase()}…`}
          />
        ) : found ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-slate-700 truncate max-w-full text-left hover:text-primary transition-colors"
          >
            {field.value}
          </button>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-amber-600 italic hover:text-amber-800 transition-colors"
          >
            Not found — click to add manually
          </button>
        )}
      </div>

      {/* Source tag */}
      {field.source && !isEditing && sourceTag(field.source)}

      {/* Actions */}
      <div className={cn(
        'flex items-center gap-1 flex-shrink-0 transition-opacity',
        isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
      )}>
        {isEditing ? (
          <button
            type="button"
            onClick={commit}
            className="text-xs px-2 py-0.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {found && (
              <button
                type="button"
                onClick={onClear}
                title="Clear"
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface BrandPrefillStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export function BrandPrefillStep({ onContinue, onBack }: BrandPrefillStepProps) {
  const { wizard, updateFormData } = useAuditStore();
  const brandName = wizard.formData.brandName ?? '';

  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [headerAddress, setHeaderAddress] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fields, setFields] = useState<PrefillField[]>([]);

  // Fetch prefill data on mount
  useEffect(() => {
    if (!brandName) { setLoading(false); return; }

    setLoading(true);
    fetch('/api/prefill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName, domain: wizard.formData.domain }),
    })
      .then(r => r.json() as Promise<PrefillResponse>)
      .then(res => {
        const d = res.data ?? null;
        const s = d?.socials ?? null;
        const logo = d?.logoUrl ?? null;

        setLogoUrl(logo);
        setHeaderAddress(d?.address ?? null);

        const rawFields: PrefillField[] = [
          {
            id: 'websiteUrl',
            label: 'Website URL',
            icon: <Globe className="h-3.5 w-3.5" />,
            value: d?.website ?? null,
            source: d?.website ? 'Serper' : null,
            savesTo: 'websiteUrl',
          },
          {
            id: 'domain',
            label: 'Domain',
            icon: <Globe className="h-3.5 w-3.5" />,
            value: d?.resolvedDomain ?? null,
            source: d?.resolvedDomain ? 'Serper' : null,
            savesTo: 'domain',
          },
          {
            id: 'address',
            label: 'Address / HQ',
            icon: <MapPin className="h-3.5 w-3.5" />,
            value: d?.address ?? null,
            source: d?.address ? 'Serper' : null,
            savesTo: 'city',
            transform: v => v.split(',')[0]?.trim() ?? v,
          },
          {
            id: 'industry',
            label: 'Industry',
            icon: <Briefcase className="h-3.5 w-3.5" />,
            value: d?.industry ?? null,
            source: d?.industry ? 'Serper' : null,
            savesTo: 'positioning',
          },
          {
            id: 'promoterName',
            label: 'Promoter / Founder',
            icon: <User className="h-3.5 w-3.5" />,
            value: d?.promoterName ?? null,
            source: d?.promoterName ? 'Web' : null,
            savesTo: 'promoterName',
          },
          {
            id: 'linkedinUrl',
            label: 'LinkedIn URL',
            icon: <Linkedin className="h-3.5 w-3.5" />,
            value: s?.linkedinUrl ?? null,
            source: s?.linkedinUrl ? 'Web' : null,
            savesTo: 'linkedinUrl',
          },
          {
            id: 'instagramHandle',
            label: 'Instagram',
            icon: <Instagram className="h-3.5 w-3.5" />,
            value: s?.instagramHandle ?? null,
            source: s?.instagramHandle ? 'Web' : null,
            savesTo: 'instagramHandle',
          },
          {
            id: 'facebookUrl',
            label: 'Facebook URL',
            icon: <Facebook className="h-3.5 w-3.5" />,
            value: s?.facebookUrl ?? null,
            source: s?.facebookUrl ? 'Web' : null,
            savesTo: 'facebookUrl',
          },
          {
            id: 'youtubeUrl',
            label: 'YouTube URL',
            icon: <Youtube className="h-3.5 w-3.5" />,
            value: s?.youtubeUrl ?? null,
            source: s?.youtubeUrl ? 'Web' : null,
            savesTo: 'youtubeUrl',
          },
          {
            id: 'twitterUrl',
            label: 'Twitter / X',
            icon: <Twitter className="h-3.5 w-3.5" />,
            value: s?.twitterUrl ?? null,
            source: s?.twitterUrl ? 'Web' : null,
            // display-only — no DeveloperInput field for twitter
          },
          {
            id: 'logoUrl',
            label: 'Logo URL',
            icon: <Image className="h-3.5 w-3.5" />,
            value: logo,
            source: logo ? 'Clearbit' : null,
            // display-only
          },
        ];

        setFields(rawFields);
      })
      .catch(err => {
        console.error('[BrandPrefillStep] fetch error:', err);
        setFields([]);
      })
      .finally(() => setLoading(false));
  }, [brandName]);

  function updateField(id: string, value: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, value: value || null } : f));
    setEditingId(null);
  }

  function clearField(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, value: null } : f));
  }

  function handleContinue() {
    // Merge non-null prefill values into wizard form data
    const updates: Partial<DeveloperInput> = {};
    for (const f of fields) {
      if (f.savesTo && f.value !== null) {
        const val = f.transform ? f.transform(f.value) : f.value;
        if (f.numeric) {
          const n = parseInt(val);
          if (!isNaN(n)) (updates as Record<string, unknown>)[f.savesTo] = n;
        } else {
          (updates as Record<string, unknown>)[f.savesTo] = val;
        }
      }
    }
    updateFormData(updates);
    onContinue();
  }

  const foundCount = fields.filter(f => f.value !== null).length;

  // Stagger animation variants
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <div className="space-y-0">
      {/* Header — logo + brand name + address */}
      <div className="flex items-start gap-4 mb-6 pb-5 border-b">
        <div className="flex-shrink-0 h-14 w-14 rounded-xl border bg-slate-50 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} className="h-full w-full object-contain p-1" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <span className="text-xl font-bold text-slate-400">{brandName[0]?.toUpperCase() ?? '?'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 truncate">{brandName}</h2>
          {headerAddress && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{headerAddress}</p>
          )}
          {!loading && (
            <p className="text-xs text-muted-foreground mt-1">
              {foundCount} of {fields.length} fields auto-filled
            </p>
          )}
        </div>
      </div>

      {/* Field list */}
      <div className="rounded-lg border overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Array.from({ length: 8 }).map((_, i) => <FieldSkeleton key={i} />)}
            </motion.div>
          ) : (
            <motion.div key="fields" variants={container} initial="hidden" animate="show">
              {fields.map(field => (
                <motion.div key={field.id} variants={item}>
                  <FieldRow
                    field={field}
                    isEditing={editingId === field.id}
                    onEdit={() => setEditingId(prev => prev === field.id ? null : field.id)}
                    onSave={val => updateField(field.id, val)}
                    onClear={() => clearField(field.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!loading && fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No data found for <strong>{brandName}</strong>. You can fill in details manually in the next steps.
        </p>
      )}

      {/* Collateral documents section */}
      <div className="mt-5 pt-5 border-t space-y-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Collateral Documents</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload brochures, project decks, or pricing sheets (PDF, up to 3). These are analysed separately
            using Groq AI and only the uploaded content is used.
          </p>
        </div>
        <CollateralDocUpload
          value={wizard.formData.collateralDocs ?? []}
          onChange={docs => updateFormData({ collateralDocs: docs })}
        />
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking up brand data…
            </span>
          )}
          <Button onClick={handleContinue} disabled={loading} className="gap-1.5">
            Looks good, start audit <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
