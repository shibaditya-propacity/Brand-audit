import { Suspense } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { HomeClient } from '@/components/home/HomeClient';

export const dynamic = 'force-dynamic';

async function getAudits() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const res = await fetch(`${backendUrl}/api/audit/list`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const audits = await getAudits();
  return (
    <>
      <TopBar />
      <Suspense fallback={null}>
        <HomeClient audits={audits} />
      </Suspense>
    </>
  );
}
