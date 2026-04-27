'use client';
import { useState, useEffect } from 'react';
import { useAuditStore } from '@/store/auditStore';
import type { AuditWithRelations } from '@/types/audit';

export function useAuditData(auditId: string) {
  const [audit, setAudit] = useState<AuditWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setCurrentAudit = useAuditStore(s => s.setCurrentAudit);

  function applyAudit(data: AuditWithRelations) {
    setAudit(data);
    setCurrentAudit(data); // broadcast to all pages via Zustand
  }

  useEffect(() => {
    if (!auditId) return;

    const fetchAudit = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/audit/${auditId}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch audit');
        const data = await response.json();
        applyAudit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId]);

  const refetch = async () => {
    try {
      const response = await fetch(`/api/audit/${auditId}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        applyAudit(data);
      }
    } catch { /* silent */ }
  };

  return { audit, loading, error, refetch };
}
