'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { IconPlug, IconCheck, IconLoader2 } from '@tabler/icons-react';

interface SidecarConfig {
  playGateMs: number;
  trackRatePerSecond: number;
  batchIntervalMs: number;
  autoProvisionWallets: boolean;
  beetsMetadataSync: boolean;
  musicbrainzLookup: boolean;
  x402StreamGating: boolean;
}

const DEFAULT_CONFIG: SidecarConfig = {
  playGateMs: 15000,
  trackRatePerSecond: 0.0001,
  batchIntervalMs: 2000,
  autoProvisionWallets: true,
  beetsMetadataSync: true,
  musicbrainzLookup: true,
  x402StreamGating: true,
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="w-10 h-[22px] rounded-full relative flex-shrink-0 transition-all duration-200 focus:outline-none"
      style={{
        background: on ? 'var(--text-accent)' : 'var(--border-strong)',
        boxShadow: on ? '0 0 10px rgba(0,194,255,0.3)' : 'none',
      }}
    >
      <span
        className="w-[16px] h-[16px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm"
        style={{ left: on ? '21px' : '3px' }}
      />
    </button>
  );
}

function NumericField({
  value,
  unit,
  step,
  min,
  onChange,
}: {
  value: number;
  unit: string;
  step: number;
  min: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));

  useEffect(() => { setRaw(String(value)); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        step={step}
        min={min}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={() => {
          const n = parseFloat(raw);
          if (!isNaN(n) && n >= min) onChange(n);
          else setRaw(String(value));
          setEditing(false);
        }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setRaw(String(value)); setEditing(false); } }}
        className="text-[13px] font-mono w-36 px-2 py-1 rounded-lg text-right focus:outline-none"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--text-accent)', color: 'var(--text-accent)' }}
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="text-[13px] font-mono px-3 py-1 rounded-lg transition-all hover:opacity-80 focus:outline-none"
      style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-accent)' }}
    >
      {value}{unit}
    </button>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SidecarConfig>(DEFAULT_CONFIG);
  const [sidecarOnline, setSidecarOnline] = useState<boolean | null>(null);
  const [trackCount, setTrackCount] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Fetch config + metrics on mount
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/config').then(r => r.json()),
      fetch('http://localhost:3001/api/metrics').then(r => r.json()),
    ])
      .then(([cfg, metrics]) => {
        setConfig(cfg);
        setSidecarOnline(true);
        setTrackCount(metrics.trackCount ?? 0);
      })
      .catch(() => setSidecarOnline(false));
  }, []);

  const saveConfig = useCallback(async (next: SidecarConfig) => {
    setSaveState('saving');
    try {
      await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1800);
    } catch {
      setSaveState('idle');
    }
  }, []);

  const update = useCallback(<K extends keyof SidecarConfig>(key: K, value: SidecarConfig[K]) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    saveConfig(next);
  }, [config, saveConfig]);

  return (
    <div style={{ maxWidth: 540 }}>

      {/* Save indicator */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <div
          className="flex items-center gap-2 text-[12px] font-mono transition-all duration-200"
          style={{
            opacity: saveState === 'idle' ? 0 : 1,
            color: saveState === 'saved' ? 'var(--text-success)' : 'var(--text-accent)',
          }}
        >
          {saveState === 'saving' && <IconLoader2 size={12} className="animate-spin" />}
          {saveState === 'saved' && <IconCheck size={12} />}
          {saveState === 'saving' ? 'Saving…' : 'Saved'}
        </div>
      </div>

      {/* ── Sidecar connection ── */}
      <section className="mb-6">
        <div className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Sidecar Connection
        </div>
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[12px] font-medium mb-4"
          style={
            sidecarOnline === null
              ? { background: 'var(--surface-3)', color: 'var(--text-muted)' }
              : sidecarOnline
              ? { background: 'var(--bg-success)', border: '1px solid var(--border-success)', color: 'var(--text-success)' }
              : { background: 'var(--bg-error)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }
          }
        >
          <IconPlug size={14} />
          {sidecarOnline === null
            ? 'Checking sidecar…'
            : sidecarOnline
            ? `Sidecar connected · localhost:3001 · ${trackCount} tracks loaded`
            : 'Sidecar not reachable — run npm run dev:all'}
        </div>

        {/* Metadata toggles */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {[
            { key: 'beetsMetadataSync' as const, label: 'Beets metadata sync', desc: 'Read ARTIST, PERFORMER, COMPOSER tags for royalty graph' },
            { key: 'musicbrainzLookup' as const, label: 'MusicBrainz MBID lookup', desc: 'Match tags to MBID for verified artist identity' },
          ].map((item, i, arr) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <Toggle on={config[item.key]} onToggle={() => update(item.key, !config[item.key])} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Payment settings ── */}
      <section className="mb-6">
        <div className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Payment Settings
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {[
            {
              label: 'Rate per second',
              desc: 'USDC paid per second of playback across all artists',
              node: (
                <NumericField
                  value={config.trackRatePerSecond}
                  unit=" USDC/s"
                  step={0.00001}
                  min={0.000001}
                  onChange={v => update('trackRatePerSecond', v)}
                />
              ),
            },
            {
              label: 'Play-gate threshold',
              desc: 'Payments begin only after this many seconds of listening',
              node: (
                <NumericField
                  value={config.playGateMs / 1000}
                  unit="s"
                  step={1}
                  min={1}
                  onChange={v => update('playGateMs', v * 1000)}
                />
              ),
            },
            {
              label: 'Batch interval',
              desc: 'How often Gateway submits on-chain payment batches',
              node: (
                <NumericField
                  value={config.batchIntervalMs / 1000}
                  unit="s"
                  step={0.5}
                  min={0.5}
                  onChange={v => update('batchIntervalMs', v * 1000)}
                />
              ),
            },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              {item.node}
            </div>
          ))}
        </div>
      </section>

      {/* ── Agent settings ── */}
      <section className="mb-6">
        <div className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Agent Settings
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {[
            { key: 'autoProvisionWallets' as const, label: 'Auto-provision escrow wallets', desc: 'Agent creates Circle wallets for artists not in registry' },
            { key: 'x402StreamGating' as const, label: 'x402 stream gating', desc: 'AI agents must pay $0.001 to access stream endpoint' },
          ].map((item, i, arr) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <Toggle on={config[item.key]} onToggle={() => update(item.key, !config[item.key])} />
            </div>
          ))}
          {/* Read-only */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>Arc network</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Blockchain for settlement (fixed for this deployment)</div>
            </div>
            <span
              className="text-[12px] font-mono px-3 py-1 rounded-full"
              style={{ background: 'var(--bg-accent)', border: '1px solid rgba(0,194,255,0.2)', color: 'var(--text-accent)' }}
            >
              Arc testnet
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
