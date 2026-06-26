'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function LandingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to dashboard once connected (new (app) route group)
  useEffect(() => {
    if (isConnected && mounted) {
      router.push('/dashboard');
    }
  }, [isConnected, mounted, router]);

  const handleConnect = async () => {
    setErrorMsg(null);
    setConnecting(true);
    try {
      const metamask = connectors.find(
        c => c.id.toLowerCase().includes('metamask') || c.name.toLowerCase().includes('metamask')
      );
      if (metamask) {
        connect({ connector: metamask }, {
          onError: (err) => {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('user rejected')) {
              setErrorMsg('Connection cancelled. Please approve the MetaMask request to continue.');
            } else {
              setErrorMsg(msg || 'Failed to connect. Please try again.');
            }
            setConnecting(false);
          },
          onSuccess: () => setConnecting(false),
        });
      } else if (connectors.length > 0) {
        connect({ connector: connectors[0] }, {
          onError: (err) => {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('user rejected')) {
              setErrorMsg('Connection cancelled. Please approve the MetaMask request to continue.');
            } else {
              setErrorMsg(msg || 'Failed to connect. Please try again.');
            }
            setConnecting(false);
          },
          onSuccess: () => setConnecting(false),
        });
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setConnecting(false);
      } else {
        setErrorMsg('No wallet extension found. Please install MetaMask.');
        setConnecting(false);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('user rejected')) {
        setErrorMsg('Connection cancelled. Please click "CONNECT TO WALLET" and approve in MetaMask to continue.');
      } else {
        setErrorMsg(msg || 'Failed to connect. Please try again.');
      }
      setConnecting(false);
    }
  };

  const features = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      ),
      title: 'MusicBrainz Attribution',
      desc: 'Auto-ingests credits from MusicBrainz — every artist, producer, and session musician gets identified at playback time.',
      color: '#00C2FF',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      title: 'Real-Time Nanopayments',
      desc: 'Circle nanopayments fire every 2 seconds after the 15-second play-gate clears. Sub-cent USDC splits across all contributors simultaneously.',
      color: '#34D399',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: 'Agent Wallet Escrow',
      desc: 'Unknown contributors get an auto-provisioned Circle escrow wallet. Funds accumulate until they claim — no lost royalties.',
      color: '#F59E0B',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      title: 'On-Chain Registry',
      desc: 'ProvenanceRegistry.sol on Arc Testnet locks in split ratios permanently. Immutable. Transparent. Tamper-proof.',
      color: '#A89EFF',
    },
  ];

  const steps = [
    { step: '01', label: 'Connect Wallet', color: '#00C2FF' },
    { step: '02', label: 'Play a Track',   color: '#A89EFF' },
    { step: '03', label: 'Play-Gate 15s',  color: '#F59E0B' },
    { step: '04', label: 'Payments Fire',  color: '#34D399' },
    { step: '05', label: 'Claim Escrow',   color: '#F87171' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#080810' }}>
      {/* Animated grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.03,
        backgroundImage: 'linear-gradient(#00C2FF 1px, transparent 1px), linear-gradient(to right, #00C2FF 1px, transparent 1px)',
        backgroundSize: '48px 48px' }} />

      {/* Radial glow */}
      <div className="fixed pointer-events-none" style={{
        top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 700,
        background: 'radial-gradient(ellipse, rgba(0,194,255,0.12) 0%, transparent 65%)',
      }} />
      <div className="fixed pointer-events-none" style={{
        bottom: '-100px', right: '-100px',
        width: 500, height: 500,
        background: 'radial-gradient(ellipse, rgba(168,158,255,0.08) 0%, transparent 70%)',
      }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #00C2FF, #A89EFF)',
            boxShadow: '0 0 20px rgba(0,194,255,0.4)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <span className="font-bold text-[15px] tracking-tight" style={{
            background: 'linear-gradient(135deg, #00C2FF, #A89EFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Provenance Pay</span>
        </div>
        <div className="flex items-center gap-3 text-[12px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
          Arc Testnet Live
          <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.15)', color: '#00C2FF' }}>
            Circle SDK
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20" style={{ animation: 'fadeInUp 0.7s ease-out both' }}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-widest mb-8" style={{
          background: 'rgba(0,194,255,0.08)',
          border: '1px solid rgba(0,194,255,0.20)',
          color: '#00C2FF',
        }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
          CREDIT WHERE CREDIT IS DUE
        </div>

        {/* Headline */}
        <h1 className="font-black tracking-tight leading-none mb-6" style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: 'white' }}>
          Every play,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00C2FF 0%, #A89EFF 50%, #34D399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            every hand paid.
          </span>
        </h1>

        <p className="max-w-xl text-[16px] leading-relaxed mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Provenance Pay reads music credits from <span style={{ color: 'rgba(255,255,255,0.7)' }}>MusicBrainz</span>, builds a recursive royalty graph,
          and fires <span style={{ color: 'rgba(255,255,255,0.7)' }}>Circle nanopayments</span> to every contributor — in real time, at playback speed.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="relative px-10 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300"
            style={{
              background: connecting ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00C2FF, #A89EFF)',
              color: connecting ? 'rgba(255,255,255,0.3)' : 'white',
              boxShadow: connecting ? 'none' : '0 0 40px rgba(0,194,255,0.35), 0 8px 32px rgba(0,0,0,0.4)',
              transform: connecting ? 'none' : undefined,
              cursor: connecting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (!connecting) (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {connecting ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting to MetaMask…
              </span>
            ) : 'CONNECT TO WALLET'}
          </button>

          {errorMsg && (
            <div className="text-[12px] px-4 py-2.5 rounded-xl max-w-sm text-center" style={{ color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
              {errorMsg}
            </div>
          )}

          <p className="text-[11px] tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>
            MetaMask — Arc Testnet — No gas needed
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-4 divide-x" style={{ divideColor: 'rgba(255,255,255,0.05)' }}>
          {[
            { val: '$0.456+', label: 'USDC Paid' },
            { val: '20,322+', label: 'Transactions' },
            { val: '10', label: 'Artists Paid' },
            { val: '<2s', label: 'Settlement' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-7 px-4" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="font-black text-[22px] font-mono" style={{
                background: 'linear-gradient(135deg, #00C2FF, #34D399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</span>
              <span className="text-[10px] tracking-[0.12em] uppercase mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 grid grid-cols-2 gap-4">
        {features.map((f, i) => (
          <div key={f.title}
            className="rounded-2xl p-6 transition-all duration-300 group"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: `fadeInUp 0.5s ease-out ${i * 80}ms both`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = f.color + '40';
              (e.currentTarget as HTMLElement).style.background = f.color + '08';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: f.color + '15', border: `1px solid ${f.color}30`, color: f.color }}>
              {f.icon}
            </div>
            <h3 className="font-semibold text-[14px] mb-2 transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Flow */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase mb-10" style={{ color: 'rgba(255,255,255,0.2)' }}>How it works</p>
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[11px] transition-all hover:scale-110"
                  style={{ background: s.color + '12', border: `1px solid ${s.color}30`, color: s.color, boxShadow: `0 0 16px ${s.color}20` }}>
                  {s.step}
                </div>
                <span className="text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-px flex-shrink-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-[10px] tracking-[0.25em] uppercase" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.12)' }}>
        Powered by Circle Agent Stack × Arc Testnet × MusicBrainz
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,194,255,0.4); opacity: 1; }
          50% { box-shadow: 0 0 0 6px rgba(0,194,255,0); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

