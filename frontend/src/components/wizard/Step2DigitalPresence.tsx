'use client';
import { useAuditStore } from '@/store/auditStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeveloperSearch } from '@/hooks/useDeveloperSearch';
import { useEffect, useState } from 'react';
import type { GooglePlaceResult } from '@/types/developer';

export function Step2DigitalPresence() {
  const { wizard, updateFormData } = useAuditStore();
  const d = wizard.formData;
  const { results, loading, search } = useDeveloperSearch();
  const [gmbSearch, setGmbSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (gmbSearch.length >= 2) {
      search(gmbSearch);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [gmbSearch]);

  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateFormData({ [key]: e.target.value });

  function selectPlace(place: GooglePlaceResult) {
    updateFormData({ gmbPlaceId: place.place_id });
    setGmbSearch(place.structured_formatting.main_text);
    setShowDropdown(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Digital Presence</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Website URL</Label>
          <Input value={d.websiteUrl || ''} onChange={field('websiteUrl')} placeholder="https://www.example.com" />
        </div>
        <div className="col-span-2">
          <Label>Domain (without https://)</Label>
          <Input value={d.domain || ''} onChange={field('domain')} placeholder="example.com" />
        </div>
        <div className="col-span-2 relative">
          <Label>Google Business Profile (search to link)</Label>
          <Input
            value={gmbSearch}
            onChange={e => setGmbSearch(e.target.value)}
            placeholder={`Search for ${d.brandName || 'the brand'} on Google...`}
          />
          {d.gmbPlaceId && <p className="text-xs text-green-600 mt-1">✓ Place ID set: {d.gmbPlaceId}</p>}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-md border bg-white shadow-lg">
              {loading && <p className="p-2 text-xs text-muted-foreground">Searching...</p>}
              {results.map(r => (
                <button key={r.place_id} type="button" onClick={() => selectPlace(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="font-medium">{r.structured_formatting.main_text}</span>
                  <span className="text-muted-foreground text-xs ml-2">{r.structured_formatting.secondary_text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Instagram Handle</Label>
          <Input value={d.instagramHandle || ''} onChange={field('instagramHandle')} placeholder="@handle or handle" />
        </div>
        <div>
          <Label>LinkedIn URL</Label>
          <Input value={d.linkedinUrl || ''} onChange={field('linkedinUrl')} placeholder="https://linkedin.com/company/..." />
        </div>
        <div>
          <Label>Facebook URL</Label>
          <Input value={d.facebookUrl || ''} onChange={field('facebookUrl')} placeholder="https://facebook.com/..." />
        </div>
        <div>
          <Label>YouTube URL</Label>
          <Input value={d.youtubeUrl || ''} onChange={field('youtubeUrl')} placeholder="https://youtube.com/..." />
        </div>
        <div>
          <Label>WhatsApp Number</Label>
          <Input value={d.whatsappNumber || ''} onChange={field('whatsappNumber')} placeholder="+91 9000000000" />
        </div>
        <div>
          <Label>Meta Ad Library Name</Label>
          <Input value={d.metaAdLibraryName || ''} onChange={field('metaAdLibraryName')} placeholder="Exact name in Meta Ad Library" />
        </div>
      </div>
    </div>
  );
}
