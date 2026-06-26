'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard, IconMusic, IconHierarchy, IconWallet,
  IconArrowsExchange, IconSettings, IconCoin, IconPlayerPlay,
  IconPlayerPause, IconLogout, IconChevronRight,
} from '@tabler/icons-react';
import { usePlayback } from '../context/PlaybackContext';
import { useDisconnect } from 'wagmi';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',        icon: IconLayoutDashboard, href: '/dashboard', group: 'main' },
  { id: 'library',      label: 'Library',           icon: IconMusic,           href: '/library',   group: 'main' },
  { id: 'graph',        label: 'Provenance graph',  icon: IconHierarchy,       href: '/graph',     group: 'main' },
  { id: 'wallets',      label: 'Wallets',           icon: IconWallet,          href: '/wallets',   group: 'payments' },
  { id: 'transactions', label: 'Transactions',      icon: IconArrowsExchange,  href: '/transactions', group: 'payments' },
  { id: 'settings',     label: 'Settings',          icon: IconSettings,        href: '/settings',  group: 'system' },
];

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { trackTitle, trackArtist, isPlaying, elapsedSeconds, totalPaid, gateCleared, trackMbid, startTrack, stopTrack } = usePlayback();

  const initials = address ? address.slice(2, 4).toUpperCase() : 'PP';
  const groups = [
    { label: 'Main',     items: NAV.filter(n => n.group === 'main') },
    { label: 'Payments', items: NAV.filter(n => n.group === 'payments') },
    { label: 'System',   items: NAV.filter(n => n.group === 'system') },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-0)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-[210px] flex-shrink-0 flex flex-col animate-fade-left"
        style={{
          background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #00C2FF 0%, #A89EFF 100%)',
            boxShadow: '0 0 16px rgba(0,194,255,0.35)',
          }}>
            <IconCoin size={14} color="white" />
          </div>
          <span className="text-[13px] font-semibold gradient-text tracking-tight">Provenance Pay</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {groups.map(group => (
            <div key={group.label} className="mb-3">
              <p className="px-5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
                {group.label}
              </p>
              {group.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.id} href={item.href}
                    className={`flex items-center gap-3 px-4 mx-2 py-[9px] rounded-[var(--radius)] text-[13px] font-medium transition-all duration-200 mb-0.5 relative group
                      ${active
                        ? 'nav-active-glow'
                        : ''}`}
                    style={{
                      color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
                      background: active ? 'var(--bg-accent)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <item.icon size={15} className="flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span className="flex-1">{item.label}</span>
                    {active && <IconChevronRight size={12} style={{ opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)]" style={{ background: 'var(--bg-success)', border: '1px solid var(--border-success)' }}>
            <span className="live-dot" />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-success)' }}>Arc testnet live</span>
          </div>
          {/* Wallet pill */}
          {address && (
            <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius)]" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'linear-gradient(135deg, #00C2FF, #A89EFF)' }}>
                  {initials}
                </div>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
              </div>
            </div>
          )}
          {/* Disconnect */}
          <button
            onClick={() => { disconnect(); router.push('/'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-[11px] transition-all duration-200 hover:opacity-80 w-full"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-error)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <IconLogout size={13} />
            Disconnect
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,8,16,0.8)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h1 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {NAV.find(n => n.href === pathname)?.label ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: 'var(--bg-accent)', border: '1px solid rgba(0,194,255,0.20)', color: 'var(--text-accent)' }}>
              <IconCoin size={11} />
              USDC · Arc Testnet
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        {/* ── Now Playing bar ── */}
        {trackMbid && (
          <div
            className="flex items-center gap-4 px-5 py-3 flex-shrink-0 animate-fade-up"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'linear-gradient(90deg, var(--surface-1) 0%, var(--surface-2) 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Track icon */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--bg-accent), rgba(168,158,255,0.12))', border: '1px solid var(--border-glow)' }}>
              <IconMusic size={15} style={{ color: 'var(--text-accent)' }} />
            </div>

            {/* Track info */}
            <div className="min-w-0" style={{ width: 160 }}>
              <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {trackTitle || `MBID ${trackMbid.slice(0,8)}…`}
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{trackArtist}</div>
            </div>

            {/* Play/Pause */}
            <button
              onClick={() => isPlaying ? stopTrack() : startTrack(trackMbid, trackTitle, trackArtist)}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
              style={{ background: 'var(--text-primary)', boxShadow: isPlaying ? '0 0 12px rgba(255,255,255,0.2)' : 'none' }}
            >
              {isPlaying ? <IconPlayerPause size={13} color="var(--surface-0)" /> : <IconPlayerPlay size={13} color="var(--surface-0)" />}
            </button>

            {/* Progress */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-[11px] font-mono flex-shrink-0" style={{ color: 'var(--text-muted)', minWidth: 32 }}>{fmt(elapsedSeconds)}</span>
              <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <div
                  className="np-progress-fill"
                  style={{
                    width: `${Math.min((elapsedSeconds / 252) * 100, 100)}%`,
                    background: gateCleared
                      ? 'linear-gradient(90deg, #34D399, #00C2FF)'
                      : 'linear-gradient(90deg, #F59E0B, #F97316)',
                    boxShadow: gateCleared ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(245,158,11,0.4)',
                  }}
                />
              </div>
              {/* Gate / paying label */}
              {gateCleared ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 animate-fade-up" style={{ background: 'var(--bg-success)', color: 'var(--text-success)', border: '1px solid var(--border-success)' }}>
                  ● PAYING
                </span>
              ) : elapsedSeconds > 0 ? (
                <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-warning)', minWidth: 52 }}>
                  GATE {Math.max(15 - elapsedSeconds, 0)}s
                </span>
              ) : null}
            </div>

            {/* Total paid */}
            <div className="text-right flex-shrink-0">
              <div className="text-[15px] font-semibold font-mono" style={{ color: 'var(--text-success)' }}>
                ${totalPaid.toFixed(6)}
              </div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>paid this play</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
