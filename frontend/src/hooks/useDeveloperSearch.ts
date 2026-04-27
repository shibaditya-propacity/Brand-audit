'use client';
import { useState, useCallback } from 'react';
import type { GooglePlaceResult } from '@/types/developer';

export function useDeveloperSearch() {
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/developer/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  return { results, loading, search };
}
