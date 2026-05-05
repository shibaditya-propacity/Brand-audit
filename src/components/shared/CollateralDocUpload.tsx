'use client';
import { useRef, useState } from 'react';
import { FileText, Loader2, X, Upload, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollateralDoc {
  name: string;
  textContent: string;
}

interface CollateralDocUploadProps {
  value: CollateralDoc[];
  onChange: (docs: CollateralDoc[]) => void;
  maxDocs?: number;
}

export function CollateralDocUpload({ value, onChange, maxDocs = 3 }: CollateralDocUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    const remaining = maxDocs - value.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setError(null);
    setUploading(true);

    const results: CollateralDoc[] = [];
    for (const file of toUpload) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are accepted');
        continue;
      }
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload/collateral', { method: 'POST', body: formData });
        const json = await res.json();
        if (json.success) {
          results.push({ name: json.name, textContent: json.textContent });
        } else {
          setError(json.error ?? 'Upload failed');
        }
      } catch {
        setError('Upload failed — please try again');
      }
    }

    onChange([...value, ...results]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const canAdd = value.length < maxDocs;

  return (
    <div className="space-y-2">
      {/* Uploaded docs list */}
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((doc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="flex-1 text-sm text-slate-700 truncate">{doc.name}.pdf</span>
              <span className="text-xs text-slate-400">
                {Math.round(doc.textContent.length / 5)} words extracted
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canAdd && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-3 text-sm transition-colors',
            uploading
              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              : 'border-slate-300 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting PDF text…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {value.length === 0
                ? `Upload collateral doc (PDF, up to ${maxDocs})`
                : `Add another PDF (${value.length}/${maxDocs})`}
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}

      {/* Warning when no docs */}
      {value.length === 0 && !uploading && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          Collateral analysis will be incomplete without uploaded documents.
        </p>
      )}
    </div>
  );
}
