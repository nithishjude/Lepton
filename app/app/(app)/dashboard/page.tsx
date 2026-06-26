'use client';
import React, { useEffect, useState, useRef } from 'react';
import { IconTrendingUp, IconLock, IconCircleCheck, IconMusic, IconArrowUpRight, IconActivity } from '@tabler/icons-react';
import { usePlayback } from '../../context/PlaybackContext';

interface Metrics { totalPaid: string; txCount: number; contributorCount: number; escrowCount: number; trackCount: number; }
interface TopTrack { mbid: string; title: string; artist: string; totalEarned: string; tickCount: number; }
interface Tx { id: string; contributor_name: string; wallet_address: string; amount_usdc: string; nanopay_ref: string; tick_at: string; is_escrow: number; track_mbid: string; }
interface Split { mbid: string; name: string; wallet_address: string; total_earned: string; is_escrow: number; tx_count: number; }

const SIDECAR = 'http://localhost:3001';

function useAnimatedNumber(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const start = useRef<number | null>(null);
  const from = useRef(0);
  useEffect(() => {
    from.current = display;
    start.current = null;
    const tick = (now: number) => {
      if (!start.current) start.current = now;
      const pct = Math.min((now - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setDisplay(from.current + (target - from.current) * ease);
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return display;
}

function avatarClass(i: number) { return ['av-p','av-t','av-a','av-c','av-g'][i % 5]; }
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(); }
function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return `${d}s`;
  if (d < 3600) return `${Math.floor(d/60)}m`;
  return `${Math.floor(d/3600)}h`;
}

function MetricCard({ value, label, sub, subColor, color, icon: Icon, delay, type }:
  { value: string; label: string; sub: React.ReactNode; subColor?: string; color: string; icon: any; delay: number; type: string }) {
  const numericVal = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  const animated = useAnimatedNumber(numericVal);
  const display = value.startsWith('$')
    ? `$${animated.toFixed(6)}`
    : animated >= 1000 ? animated.toLocaleString('en', { maximumFractionDigits: 0 }) : Math.round(animated).toString();

  return (
    <div className={`pp-metric-card animate-fade-up ${type}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '18', border: `1px solid ${color}30` }}>
          <Icon size={15} color={color} />
        </div>
        <IconArrowUpRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
      </div>
      <div className="text-[26px] font-bold font-mono leading-none mb-1.5 animate-count" style={{ color: 'var(--text-primary)' }}>
        {display}
      </div>
      <div className="text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-[11px] flex items-center gap-1" style={{ color: subColor || 'var(--text-secondary)' }}>{sub}</div>
    </div>
  );
}

function TxRow({ tx, idx }: { tx: Tx; idx: number }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b last:border-0 animate-slide-right"
      style={{ borderColor: 'var(--border)', animationDelay: `${idx * 40}ms` }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{
        background: tx.is_escrow ? 'var(--text-warning)' : parseFloat(tx.amount_usdc) === 0 ? 'var(--text-muted)' : 'var(--text-success)',
        boxShadow: tx.is_escrow ? '0 0 6px rgba(245,158,11,0.5)' : parseFloat(tx.amount_usdc) > 0 ? '0 0 6px rgba(52,211,153,0.4)' : 'none',
      }} />
      <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>
        {tx.is_escrow ? 'Escrow' : 'Batch'} → <span style={{ color: 'var(--text-primary)' }}>{tx.contributor_name || tx.track_mbid?.slice(0,8)}</span>
        {tx.wallet_address ? <span className="font-mono text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>({tx.wallet_address.slice(0,6)}…)</span> : ''}
      </span>
      <span className="text-[12px] font-mono font-semibold" style={{ color: tx.is_escrow ? 'var(--text-warning)' : 'var(--text-success)' }}>
        ${parseFloat(tx.amount_usdc).toFixed(6)}
      </span>
      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-muted)', minWidth: 28 }}>
        {relTime(tx.tick_at)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const { contributors, totalPaid: livePaid, gateCleared, trackMbid } = usePlayback();
  const prevTxIds = useRef<Set<string>>(new Set());

  const fetchAll = () => {
    fetch(`${SIDECAR}/api/metrics`).then(r=>r.json()).then(setMetrics).catch(()=>{});
    fetch(`${SIDECAR}/api/top-tracks`).then(r=>r.json()).then(d => setTopTracks(Array.isArray(d) ? d : [])).catch(()=>{});
    fetch(`${SIDECAR}/api/transactions?limit=8`).then(r=>r.json()).then(d => { setTxs(Array.isArray(d) ? d : []); }).catch(()=>{});
    fetch(`${SIDECAR}/api/contributors`).then(r=>r.json()).then(d => setSplits(Array.isArray(d) ? d : [])).catch(()=>{});
  };

  useEffect(() => { fetchAll(); const id = setInterval(fetchAll, 3000); return () => clearInterval(id); }, []);

  const totalPaidNum = parseFloat(metrics?.totalPaid || '0') + (trackMbid ? livePaid : 0);

  return (
    <div className="animate-fade-up">
      {/* Ambient glow background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse, rgba(0,194,255,0.04) 0%, transparent 70%)',
      }} />

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          value={`$${totalPaidNum.toFixed(6)}`}
          label="Total USDC paid out"
          sub={<><IconTrendingUp size={11}/> {gateCleared ? '$0.000012/s streaming' : 'Accumulating'}</>}
          subColor="var(--text-success)"
          color="#00C2FF"
          icon={IconActivity}
          delay={0}
          type="accent"
        />
        <MetricCard
          value={(metrics?.txCount ?? 0).toString()}
          label="Arc transactions settled"
          sub="Batched via Circle Gateway"
          color="#A89EFF"
          icon={IconCircleCheck}
          delay={60}
          type=""
        />
        <MetricCard
          value={(metrics?.contributorCount ?? 0).toString()}
          label="Artists receiving splits"
          sub={metrics?.escrowCount ? <><IconLock size={11}/> {metrics.escrowCount} in escrow</> : 'All wallets active'}
          subColor={metrics?.escrowCount ? 'var(--text-warning)' : 'var(--text-success)'}
          color="#F59E0B"
          icon={IconWallet2}
          delay={120}
          type="warning"
        />
        <MetricCard
          value={(metrics?.trackCount ?? 0).toString()}
          label="Tracks in library"
          sub="MusicBrainz synced"
          color="#34D399"
          icon={IconMusic}
          delay={180}
          type="success"
        />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="flex flex-col gap-4">
          {/* Top earning tracks */}
          <div className="pp-card animate-fade-up stagger-2">
            <div className="pp-card-title flex items-center justify-between">
              <span>Top earning tracks today</span>
              <span className="text-[10px] normal-case tracking-normal" style={{ color: 'var(--text-muted)' }}>
                {topTracks.length} tracks
              </span>
            </div>
            {topTracks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No tracks played yet.</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Go to <span style={{ color: 'var(--text-accent)' }}>Library</span> to start a track.</p>
              </div>
            ) : topTracks.map((t, i) => (
              <div key={t.mbid}
                className="flex items-center gap-3 py-3 border-b last:border-0 group animate-slide-right"
                style={{ borderColor: 'var(--border)', animationDelay: `${i * 50}ms` }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, var(--bg-accent), rgba(168,158,255,0.10))', border: '1px solid var(--border-glow)' }}>
                  <IconMusic size={14} style={{ color: 'var(--text-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</div>
                  <div className="text-[11px] mt-0.5 font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                    {t.artist} · {t.mbid.slice(0,8)}…
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-semibold font-mono" style={{ color: 'var(--text-success)' }}>${t.totalEarned}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.tickCount} ticks</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent transactions */}
          <div className="pp-card animate-fade-up stagger-3">
            <div className="pp-card-title flex items-center justify-between">
              <span>Recent Arc transactions</span>
              {txs.length > 0 && (
                <span className="text-[10px] normal-case tracking-normal px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-success)', color: 'var(--text-success)', border: '1px solid var(--border-success)' }}>
                  live
                </span>
              )}
            </div>
            {txs.length === 0
              ? <p className="text-[12px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
              : txs.map((tx, i) => <TxRow key={tx.id} tx={tx} idx={i} />)
            }
          </div>
        </div>

        {/* Split summary */}
        <div className="pp-card animate-fade-up stagger-2 h-fit">
          <div className="pp-card-title">Split summary — session</div>
          {splits.length === 0 ? (
            <p className="text-[12px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>No contributors yet.</p>
          ) : splits.map((s, i) => {
            const liveAmt = contributors[s.mbid]?.amount;
            const earned = (parseFloat(s.total_earned) + parseFloat(liveAmt || '0')).toFixed(6);
            return (
              <div key={s.mbid}
                className="flex items-center gap-2.5 py-2.5 border-b last:border-0 animate-slide-right"
                style={{ borderColor: 'var(--border)', animationDelay: `${i * 40}ms` }}
              >
                <div className={`av ${avatarClass(i)}`}>{initials(s.name || 'UN')}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    {s.name || s.mbid.slice(0,8)}
                    {s.is_escrow ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-warning)', color: 'var(--text-warning)' }}>
                        escrow
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {s.tx_count} txs
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] font-semibold font-mono" style={{ color: s.is_escrow ? 'var(--text-warning)' : 'var(--text-success)' }}>
                    ${earned}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {s.wallet_address ? `${s.wallet_address.slice(0,6)}…${s.wallet_address.slice(-4)}` : 'auto-wallet'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Inline icon workaround for wallet
function IconWallet2({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
      <path d="M16 3L12 7l-4-4"/>
      <circle cx="17" cy="13" r="1"/>
    </svg>
  );
}
