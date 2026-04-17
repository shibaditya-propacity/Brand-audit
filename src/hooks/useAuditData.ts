'use client';
import { useState, useEffect } from 'react';
import type { AuditWithRelations } from '@/types/audit';

export function useAuditData(auditId: string) {
  const [audit, setAudit] = useState<AuditWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auditId) return;

    const fetchAudit = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/audit/${auditId}`);
        if (!response.ok) throw new Error('Failed to fetch audit');
        const data = await response.json();
        setAudit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [auditId]);

  const refetch = async () => {
    try {
      const response = await fetch(`/api/audit/${auditId}`);
      if (response.ok) {
        const data = await response.json();
        setAudit(data);
      }
    } catch { /* silent */ }
  };

  return { audit, loading, error, refetch };
}
