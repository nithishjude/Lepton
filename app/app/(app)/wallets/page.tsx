'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconWallet, IconRobot, IconMail } from '@tabler/icons-react';
import { usePlayback } from '../../context/PlaybackContext';

interface Contributor {
  mbid: string; name: string; wallet_address: string;
  wallet_id: string; is_escrow: number; is_provisioned: number;
  total_earned: string; tx_count: number;
  role?: string; bps?: number;
}

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  artist:           { label: 'original',  bg: '#EEEDFE', color: '#3C3489' },
  producer:         { label: 'producer',  bg: '#E1F5EE', color: '#085041' },
  featured_artist:  { label: 'feature',   bg: '#FAEEDA', color: '#633806' },
  session_musician: { label: 'session',   bg: '#FAECE7', color: '#712B13' },
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function avatarClass(i: number) {
  return ['av-p', 'av-t', 'av-a', 'av-c', 'av-g'][i % 5];
}

export default function WalletsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const { contributors: live, graph } = usePlayback();
  const router = useRouter();

  const fetchContributors = () => {
    fetch('http://localhost:3001/api/contributors')
      .then(r => r.json())
      .then(data => { setContributors(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchContributors();
    const id = setInterval(fetchContributors, 4000);
    return () => clearInterval(id);
  }, []);

  const roleOf = (c: Contributor) => c.role || graph?.nodes?.find((n: any) => n.mbid === c.mbid)?.role;
  const splitOf = (c: Contributor) => {
    const bps = c.bps || graph?.splits?.find((s: any) => s.mbid === c.mbid)?.bps;
    return bps ? `${((bps / 10000) * 100).toFixed(1)}%` : '—';
  };

  const handleFilterTxs = (e: React.MouseEvent, wallet: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/transactions?wallet=${wallet}`);
  };

  return (
    <div className="flex flex-col gap-[10px]">
      {loading && <p className="text-[13px] text-[var(--text-muted)] py-4 text-center">Loading wallets from Circle API…</p>}
      {!loading && contributors.length === 0 && (
        <div className="pp-card text-center py-8">
          <p className="text-[13px] text-[var(--text-muted)]">No contributor wallets provisioned yet.</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Play a track past the 15-second gate to trigger wallet provisioning.</p>
        </div>
      )}
      {contributors.map((c, i) => {
        const role = roleOf(c);
        const badge = ROLE_BADGES[role || ''];
        const liveAmt = live[c.mbid]?.amount;
        const displayEarned = liveAmt
          ? (parseFloat(c.total_earned) + parseFloat(liveAmt)).toFixed(6)
          : parseFloat(c.total_earned).toFixed(6);

        return (
          <Link href={`/contributor/${c.wallet_address || c.mbid}`} key={c.mbid} className="block">
            <div
              className={`pp-card hover:bg-[#151520]/40 transition-colors cursor-pointer border ${c.is_escrow ? 'border-[var(--border-warning)]' : 'border-[var(--border-success)]'}`}
            >
              <div className="flex items-center gap-[10px] mb-[10px]">
                <div className={`av ${avatarClass(i)}`} style={{ width: 36, height: 36, fontSize: 12 }}>
                  {initials(c.name || 'UN')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--text-primary)]">{c.name || c.mbid.slice(0,8)}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {role ? `${role.replace('_', ' ')} — receives ${splitOf(c)} of every play` : `Contributor · MBID ${c.mbid.slice(0,8)}`}
                  </div>
                </div>
                {badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                )}
                {c.is_escrow ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-warning)] text-[var(--text-warning)] font-medium font-mono">escrow</span>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={(e) => c.wallet_address && handleFilterTxs(e, c.wallet_address)}
                  className="bg-[var(--surface-1)] hover:bg-[#1C1C24] transition-colors rounded-[var(--radius)] p-2 cursor-pointer border border-transparent hover:border-gray-800"
                  title="Filter payouts for this wallet"
                >
                  <div className={`text-[14px] font-medium ${c.is_escrow ? 'text-[var(--text-warning)]' : 'text-[var(--text-success)]'}`}>
                    ${displayEarned}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.is_escrow ? 'Held in escrow (filter)' : 'Total earned (filter)'}</div>
                </div>
                <div className="bg-[var(--surface-1)] rounded-[var(--radius)] p-2">
                  <div className="text-[14px] font-medium text-[var(--text-primary)]">{splitOf(c)}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Split</div>
                </div>
                <div
                  onClick={(e) => c.wallet_address && handleFilterTxs(e, c.wallet_address)}
                  className="bg-[var(--surface-1)] hover:bg-[#1C1C24] transition-colors rounded-[var(--radius)] p-2 cursor-pointer border border-transparent hover:border-gray-800"
                  title="Filter payouts for this wallet"
                >
                  <div className="text-[14px] font-medium text-[var(--text-primary)]">{c.tx_count}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Tx settled (filter)</div>
                </div>
              </div>

              <div className="flex items-center gap-[6px] text-[10px] text-[var(--text-muted)] font-mono mt-2">
                {c.is_escrow ? <IconRobot size={12} /> : <IconWallet size={12} />}
                {c.wallet_address || 'Auto-provisioning…'} · Circle Wallets API
              </div>

              {c.is_escrow && (
                <div className="flex items-center gap-[6px] text-[11px] text-[var(--text-warning)] bg-[var(--bg-warning)] rounded-md px-[10px] py-[6px] mt-2">
                  <IconMail size={13} />
                  Funds held in escrow — contributor can claim at /claim
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
