import { Suspense } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { HomeClient } from '@/components/home/HomeClient';
import connectDB from '@/lib/mongodb';
import { Audit, Developer } from '@/lib/models';

export const dynamic = 'force-dynamic';

async function getAudits() {
  try {
    await connectDB();
    const audits = await Audit.find().sort({ createdAt: -1 }).limit(50).lean();
    const withDevelopers = await Promise.all(
      audits.map(async (audit) => {
        const developer = await Developer.findById(audit.developerId).lean();
        return { ...audit, developer };
      })
    );
    return JSON.parse(JSON.stringify(withDevelopers));
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
