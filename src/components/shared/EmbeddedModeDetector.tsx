'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Detects ?embedded=1 in the URL and adds the `embedded` CSS class to
 * document.body. globals.css then hides the TopBar header for a seamless
 * iframe experience inside the Growth Engine sidebar.
 */
export function EmbeddedModeDetector() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('embedded') === '1') {
      document.body.classList.add('embedded');
    } else {
      document.body.classList.remove('embedded');
    }
  }, [searchParams]);

  return null;
}
