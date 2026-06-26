'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface PlaybackState {
  trackMbid: string | null;
  trackTitle: string;
  trackArtist: string;
  isPlaying: boolean;
  elapsedSeconds: number;
  totalPaid: number;
  gateCleared: boolean;
  graph: any | null;
  contributors: Record<string, { name: string; amount: string; isEscrow: boolean }>;
}

interface PlaybackContextType extends PlaybackState {
  startTrack: (mbid: string, title: string, artist: string) => Promise<void>;
  stopTrack: () => Promise<void>;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlaybackState>({
    trackMbid: null,
    trackTitle: '',
    trackArtist: '',
    isPlaying: false,
    elapsedSeconds: 0,
    totalPaid: 0,
    gateCleared: false,
    graph: null,
    contributors: {},
  });

  const sseRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTrack = useCallback(async () => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    
    const mbid = state.trackMbid;
    if (mbid) {
      await fetch('http://localhost:3001/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'stop', trackId: mbid }),
      }).catch(() => {});
    }
    setState(s => ({ ...s, isPlaying: false, gateCleared: false, elapsedSeconds: 0 }));
  }, [state.trackMbid]);

  const startTrack = useCallback(async (mbid: string, title: string, artist: string) => {
    // Stop existing
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setState({
      trackMbid: mbid,
      trackTitle: title,
      trackArtist: artist,
      isPlaying: true,
      elapsedSeconds: 0,
      totalPaid: 0,
      gateCleared: false,
      graph: null,
      contributors: {},
    });

    // Fire webhook
    await fetch('http://localhost:3001/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'play', trackId: mbid }),
    }).catch(() => {});

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setState(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
    }, 1000);

    // Connect SSE (browser only)
    if (typeof window === 'undefined') return;
    const sse = new EventSource(`http://localhost:3001/api/payments/stream?trackId=${mbid}`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'graph_ready') {
          setState(s => ({ ...s, graph: data.graph }));
        } else if (data.type === 'gate_cleared') {
          setState(s => ({ ...s, gateCleared: true }));
        } else if (data.type === 'tick') {
          setState(s => {
            const next = { ...s.contributors };
            let added = 0;
            for (const conf of data.confirmations ?? []) {
              const amt = parseFloat(conf.amount || '0');
              added += amt;
              const existing = next[conf.contributorMbid];
              next[conf.contributorMbid] = {
                name: existing?.name || conf.contributorMbid.slice(0, 8),
                amount: ((parseFloat(existing?.amount || '0')) + amt).toFixed(6),
                isEscrow: existing?.isEscrow ?? false,
              };
            }
            return { ...s, contributors: next, totalPaid: s.totalPaid + added };
          });
        } else if (data.type === 'stopped') {
          if (timerRef.current) clearInterval(timerRef.current);
          setState(s => ({ ...s, isPlaying: false }));
          sse.close();
        }
      } catch {}
    };
    sse.onerror = () => sse.close();
  }, []);

  return (
    <PlaybackContext.Provider value={{ ...state, startTrack, stopTrack }}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
}
