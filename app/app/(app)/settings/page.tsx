'use client';
import React, { useEffect, useState } from 'react';
import { IconPlug } from '@tabler/icons-react';

interface NaviStatus { connected: boolean; trackCount: number; }

const SETTINGS = [
  {
    section: 'Navidrome connection',
    items: [
      { label: 'Beets metadata sync', desc: 'Read ARTIST, PERFORMER, COMPOSER tags for royalty graph', toggle: true, on: true },
      { label: 'MusicBrainz MBID lookup', desc: 'Match tags to MBID for verified artist identity', toggle: true, on: true },
    ],
  },
  {
    section: 'Payment settings',
    items: [
      { label: 'Rate per second', desc: 'USDC paid per second of playback across all artists', value: '$0.000012/s' },
      { label: 'Play-gate threshold', desc: 'Payments begin only after this many seconds of listening', value: '15 seconds' },
      { label: 'Batch interval', desc: 'How often Gateway submits on-chain batches', value: 'Every 2s' },
    ],
  },
  {
    section: 'Agent settings',
    items: [
      { label: 'Auto-provision escrow wallets', desc: 'Agent creates Circle wallets for artists not in registry', toggle: true, on: true },
      { label: 'x402 stream gating', desc: 'AI agents must pay $0.001 to access stream endpoint', toggle: true, on: true },
      { label: 'Arc network', desc: 'Blockchain for settlement', value: 'Arc testnet' },
    ],
  },
];

export default function SettingsPage() {
  const [status, setStatus] = useState<NaviStatus | null>(null);
  const [trackCount, setTrackCount] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3001/api/metrics')
      .then(r => r.json())
      .then(d => { setStatus({ connected: true, trackCount: d.trackCount }); setTrackCount(d.trackCount); })
      .catch(() => setStatus({ connected: false, trackCount: 0 }));
  }, []);

  return (
    <div style={{ maxWidth: 520 }}>
      {SETTINGS.map(group => (
        <div key={group.section} className="mb-5">
          <div className="text-[13px] font-medium text-[var(--text-primary)] mb-[10px] pb-2 border-b border-[var(--border)]">
            {group.section}
          </div>

          {group.section === 'Navidrome connection' && (
            <div className={`flex items-center gap-2 px-3 py-[10px] rounded-lg text-[12px] font-medium mb-3 ${
              status?.connected ? 'bg-[var(--bg-success)] text-[var(--text-success)]' : 'bg-[var(--bg-error)] text-[#712B13]'
            }`}>
              <IconPlug size={14} />
              {status === null ? 'Checking sidecar…' : status.connected
                ? `Sidecar connected · http://localhost:3001 · ${trackCount} tracks loaded`
                : 'Sidecar not reachable — run npm run dev:all'}
            </div>
          )}

          {group.items.map(item => (
            <div key={item.label} className="flex items-center justify-between py-[10px] border-b border-[var(--border)] last:border-0">
              <div>
                <div className="text-[13px] text-[var(--text-primary)]">{item.label}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.desc}</div>
              </div>
              {'toggle' in item ? (
                <div className={`w-9 h-5 rounded-full relative cursor-pointer flex-shrink-0 ${item.on ? 'bg-[var(--text-accent)]' : 'bg-[var(--border-strong)]'}`}>
                  <div className={`w-[14px] h-[14px] rounded-full bg-white absolute top-[3px] transition-all ${item.on ? 'left-[19px]' : 'left-[3px]'}`} />
                </div>
              ) : (
                <span className="text-[13px] text-[var(--text-accent)] font-medium cursor-pointer">{item.value}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
