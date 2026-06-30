'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { IconWallet, IconRobot, IconArrowLeft, IconCoin, IconAlertTriangle, IconLoader2, IconCircleCheck } from '@tabler/icons-react';

interface ContributorProfile {
  mbid: string;
  name: string;
  wallet_address: string;
  wallet_id: string;
  is_escrow: number;
  is_provisioned: number;
  total_earned: string;
  tx_count: number;
}

interface TrackCredit {
  mbid: string;
  title: string;
  artist: string;
  bps: number;
  role: string;
}

interface PaymentTick {
  amount_usdc: string;
  tick_at: string;
}

export default function ContributorDashboard() {
  const { walletAddress } = useParams();
  const router = useRouter();
  const { address: connectedAddress } = useAccount();

  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [tracks, setTracks] = useState<TrackCredit[]>([]);
  const [ticks, setTicks] = useState<PaymentTick[]>([]);
  const [loading, setLoading] = useState(true);

  // Claim Escrow state
  const [claiming, setClaiming] = useState(false);
  const [claimTx, setClaimTx] = useState<string | null>(null);
  const [claimErr, setClaimErr] = useState<string | null>(null);

  const fetchProfile = () => {
    setLoading(true);
    fetch(`http://localhost:3001/api/contributor/${walletAddress}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setLoading(false);
          return;
        }
        setProfile(data.contributor);
        setTracks(data.tracks || []);
        setTicks(data.ticks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [walletAddress]);

  const handleClaim = () => {
    if (!profile || !connectedAddress) return;
    setClaiming(true);
    setClaimErr(null);

    fetch('http://localhost:3001/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mbid: profile.mbid,
        destinationAddress: connectedAddress,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        setClaiming(false);
        if (res.success) {
          setClaimTx(res.txHash);
          fetchProfile(); // reload profile stats
        } else {
          setClaimErr(res.error || 'Failed to claim escrow funds.');
        }
      })
      .catch((err) => {
        setClaiming(false);
        setClaimErr(err.message || 'Connection error.');
      });
  };

  // Generate coordinates for SVG Sparkline Chart
  const renderChart = () => {
    if (ticks.length < 2) {
      return (
        <div className="h-32 flex items-center justify-center text-[12px] text-gray-500 font-mono">
          No payment tick timeline history. Play tracks to accrue payouts.
        </div>
      );
    }

    // Cumulative sum calculations
    let currentSum = 0;
    const dataPoints = ticks.map((t) => {
      currentSum += parseFloat(t.amount_usdc);
      return currentSum;
    });

    const min = 0;
    const max = currentSum || 0.001;
    const width = 500;
    const height = 120;
    const padding = 15;

    const points = dataPoints.map((val, idx) => {
      const x = padding + (idx / (dataPoints.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / (max - min)) * (height - padding * 2);
      return { x, y };
    });

    const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1C1C24" strokeWidth={1} />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1C1C24" strokeWidth={1} strokeDasharray="3 3" />
          
          {/* Filled Area */}
          <path d={areaD} fill="url(#chartGrad)" />
          {/* Line path */}
          <path d={pathD} fill="none" stroke="#00C2FF" strokeWidth={2.5} style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,194,255,0.4))' }} />

          {/* Spark dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill="#00C2FF" className="opacity-80 hover:r-5 transition-all cursor-pointer" />
          ))}
        </svg>
        <div className="flex justify-between text-[9px] font-mono text-gray-500 px-1 mt-1">
          <span>START</span>
          <span>CUMULATIVE EARNINGS ACCRUAL: ${currentSum.toFixed(6)} USDC</span>
          <span>LATEST</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="text-[13px] text-[var(--text-muted)] py-8 text-center">Loading contributor profile…</p>;
  }

  if (!profile) {
    return (
      <div className="pp-card text-center py-12">
        <IconAlertTriangle className="text-amber-500 mx-auto mb-3" size={32} />
        <p className="text-[13px] text-[var(--text-muted)]">Contributor details not found.</p>
        <button onClick={() => router.push('/wallets')} className="mt-4 text-[12px] text-[#00C2FF] hover:underline flex items-center gap-1.5 mx-auto">
          <IconArrowLeft size={13} /> Back to Wallets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header back button */}
      <button onClick={() => router.push('/wallets')} className="text-[12px] text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors">
        <IconArrowLeft size={13} /> Back to Wallets
      </button>

      {/* Contributor Profile Header */}
      <div className="pp-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold bg-gradient-to-tr from-[#00C2FF] to-[#7C6EEA] text-white">
            {profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-white truncate">{profile.name}</h2>
            <div className="text-[11px] text-gray-400 mt-0.5 font-mono truncate">
              {profile.is_escrow ? 'Circle Escrow Vault' : 'External Wallet'} · {profile.wallet_address || 'Unassigned'}
            </div>
          </div>
          {profile.is_escrow ? (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold uppercase tracking-wider font-mono">
              escrow
            </span>
          ) : (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider font-mono">
              active
            </span>
          )}
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-3 gap-3">
        <div className="pp-card p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Lifetime Earnings</div>
          <div className="text-[18px] font-bold font-mono text-emerald-400">${parseFloat(profile.total_earned).toFixed(6)}</div>
          <div className="text-[9px] text-gray-600 font-mono mt-1">Arc USDC testnet</div>
        </div>

        <div className="pp-card p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Splits Registered</div>
          <div className="text-[18px] font-bold text-white">{tracks.length}</div>
          <div className="text-[9px] text-gray-600 mt-1">Catalog releases</div>
        </div>

        <div className="pp-card p-3.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Payouts Settled</div>
          <div className="text-[18px] font-bold text-white">{profile.tx_count}</div>
          <div className="text-[9px] text-gray-600 font-mono mt-1">On-chain receipts</div>
        </div>
      </div>

      {/* Historical Earnings Accrual Chart */}
      <div className="pp-card">
        <div className="pp-card-title mb-3">Accrual Timeline Chart</div>
        {renderChart()}
      </div>

      {/* Escrow Claim Portal */}
      {profile.is_escrow === 1 && (
        <div className="pp-card border border-amber-500/25 bg-[#0F0F16]">
          <div className="pp-card-title text-amber-500 flex items-center gap-1.5 mb-2">
            <IconAlertTriangle size={15} /> Escrow Funds Claim Portal
          </div>
          <p className="text-[12px] text-gray-400 leading-relaxed mb-4">
            Royalties have been held in escrow for {profile.name} because their wallet address was unassigned.
            Connect MetaMask to transfer the accumulated balance directly to your address.
          </p>

          {connectedAddress ? (
            <div className="space-y-3">
              <div className="bg-[#07070F] p-3 rounded-lg border border-gray-900 flex justify-between items-center text-[12px]">
                <span className="text-gray-500">Destination Web3 Address:</span>
                <span className="font-mono text-gray-200">{connectedAddress.slice(0, 8)}…{connectedAddress.slice(-6)}</span>
              </div>

              {claimTx ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-[12px] text-emerald-400 space-y-1.5 animate-fade-in">
                  <div className="font-bold flex items-center gap-1"><IconCircleCheck size={14} /> Escrow Claim Complete!</div>
                  <div>USDC balance successfully withdrawn on-chain.</div>
                  <div className="font-mono text-[11px] truncate">
                    Tx Hash: <a href={`https://testnet.arcscan.app/tx/${claimTx}`} target="_blank" rel="noopener noreferrer" className="underline">{claimTx}</a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming || parseFloat(profile.total_earned) === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold rounded-lg text-[12.5px] transition-all"
                >
                  {claiming ? <IconLoader2 size={13} className="animate-spin" /> : <IconCoin size={13} />}
                  Claim Accumulated ${parseFloat(profile.total_earned).toFixed(6)} USDC Now
                </button>
              )}
              {claimErr && <p className="text-[11px] text-red-400 font-medium">{claimErr}</p>}
            </div>
          ) : (
            <div className="bg-[#07070F] p-3.5 rounded-lg border border-gray-900 text-center text-[12px] text-gray-400">
              Please connect your MetaMask wallet in the top header to initialize on-chain withdrawal.
            </div>
          )}
        </div>
      )}

      {/* Credited catalog splits */}
      <div className="pp-card">
        <div className="pp-card-title mb-3">Credited Catalog Releases</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 font-mono text-[10px] uppercase">
                <th className="py-2 pr-4">Track Title</th>
                <th className="py-2 pr-4">Artist</th>
                <th className="py-2 pr-4">Credit Role</th>
                <th className="py-2 pr-4 text-right">Split Share</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.mbid} className="border-b border-gray-900 last:border-0 hover:bg-gray-900/10 transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-white">{t.title}</td>
                  <td className="py-2.5 pr-4 text-gray-400">{t.artist}</td>
                  <td className="py-2.5 pr-4 font-mono text-gray-500 text-[11px]">{t.role.replace('_', ' ')}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold text-emerald-400 font-mono">{((t.bps / 10000) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
