'use client';
import { PlaybackProvider } from '../context/PlaybackContext';
import AppShell from '../components/AppShell';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isConnected) {
      router.push('/');
    }
  }, [mounted, isConnected, router]);

  // Show loading skeleton until hydrated
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-0)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--text-accent)] border-t-transparent animate-spin" />
          <span className="text-[13px] text-[var(--text-muted)]">Loading Provenance Pay…</span>
        </div>
      </div>
    );
  }

  if (!isConnected) return null;

  return (
    <PlaybackProvider>
      <AppShell>{children}</AppShell>
    </PlaybackProvider>
  );
}
