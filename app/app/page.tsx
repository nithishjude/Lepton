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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
      title: 'MusicBrainz Attribution Parser',
      desc: 'Autonomously ingests standard file tagging schemas from MusicBrainz. Resolves artists, co-writers, mix engineers, and session instrumentalists dynamically.',
      color: '#00C2FF',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      title: 'Circle Nanopayments SDK',
      desc: 'Dispatches high-frequency micropayments every 2s using off-chain batch signature verification, settling on-chain in single aggregated transactions.',
      color: '#34D399',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: 'Agent Wallet Auto-Provisioning',
      desc: 'Unknown contributors are automatically provisioned an on-chain MPC Agent Wallet with strict daily withdrawal limits. Funds accrue in escrow until claimed.',
      color: '#F59E0B',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'On-Chain Provenance Registry',
      desc: 'Stores canonical splits immutably in ProvenanceRegistry.sol on Arc Testnet. Once written, splits are tamper-proof and public to all audit trails.',
      color: '#A89EFF',
    },
  ];

  const steps = [
    { step: '01', label: 'Connect Wallet', color: '#00C2FF', desc: 'Secure connection to your personal on-chain identity via MetaMask.' },
    { step: '02', label: 'Start Playback', color: '#A89EFF', desc: 'Agent detects the active track MBID and loads the provenance graph.' },
    { step: '03', label: 'Clear 15s Play-Gate', color: '#F59E0B', desc: 'Prevents royalty abuse or immediate skips. Payments activate at t=15s.' },
    { step: '04', label: 'Nanopayments Flow', color: '#34D399', desc: 'Real-time USDC micropayments disburse every 2s to all active wallets.' },
    { step: '05', label: 'Claim Escrowed Payouts', color: '#F87171', desc: 'Unregistered artists log in with MetaMask and claim accumulated escrow funds.' },
  ];

  const circleLayers = [
    {
      title: 'Arc Testnet Settlement',
      tech: 'EVM-compatible Malachite BFT Network',
      desc: 'All transactions settle on Arc with gas costs priced directly in USDC. Under 1-second block finality ensures fast and guaranteed payouts.',
    },
    {
      title: 'x402 Micropayment Protocol',
      tech: 'HTTP Micropayments Middleware',
      desc: 'Protects the playback endpoints from spam. Each play event triggers a micro-charge of $0.000010 USDC to authorize the playback session.',
    },
    {
      title: 'Circle Developer-Controlled Wallets',
      tech: '2-of-2 MPC Key Architecture',
      desc: 'Known system contributors receive secure wallets created using the Circle Developer SDK. Entity secrets never leave the secure environment.',
    },
    {
      title: 'Circle CLI Integration',
      tech: 'Programmatic Policy Enforcement',
      desc: 'Enforces spending policies (e.g. max daily limit of $0.10 USDC per wallet) on the auto-provisioned agent escrow accounts.',
    },
  ];

  const faqs = [
    {
      q: 'How are unknown or unregistered artists paid?',
      a: 'When the sidecar agent parses music metadata and detects a contributor without a registered address, it immediately provisions a new Agent Wallet via the Circle CLI. USDC royalties accumulate in this secure, policy-locked escrow wallet. The artist can later log in to the Claim Portal, authenticate their MusicBrainz ID, and withdraw their accrued funds.'
    },
    {
      q: 'Why is there a 15-second Play-Gate?',
      a: 'To prevent duplicate payments, spamming, and bot plays from draining wallets, Provenance Pay implements a play-gate. The first 15 seconds of any playback event acts as a verification window. If the listener skips the song during this window, no payments are made. Once cleared, payments start flowing retroactively.'
    },
    {
      q: 'What makes the royalty splits tamper-proof?',
      a: 'Royalty splits are written directly to the ProvenanceRegistry smart contract deployed on the Arc Testnet. The contract enforces a write-once policy per MusicBrainz Recording ID (MBID). Once splits are registered on-chain, they cannot be manipulated or overridden by any central party.'
    },
    {
      q: 'What is the role of Circle Nanopayments?',
      a: 'Traditional blockchains fail at micro-royalties because gas fees often exceed the sub-cent split amounts. Circle Nanopayments solves this by batch-signing cryptographic authorizations (EIP-3009) off-chain and submitting them to the Circle Gateway, which settles them on the ledger in aggregated blocks. This makes $0.000001 transactions economically viable.'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-y-auto overflow-x-hidden" style={{ background: '#080810', scrollBehavior: 'smooth' }}>
      {/* Animated grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.03,
        backgroundImage: 'linear-gradient(#00C2FF 1px, transparent 1px), linear-gradient(to right, #00C2FF 1px, transparent 1px)',
        backgroundSize: '48px 48px' }} />

      {/* Radial glows */}
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

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,16,0.6)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #00C2FF, #A89EFF)',
            boxShadow: '0 0 20px rgba(0,194,255,0.4)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white">Provenance Pay</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-[12px] font-semibold text-white/50 hover:text-white transition-colors">Features</a>
          <a href="#technology" className="text-[12px] font-semibold text-white/50 hover:text-white transition-colors">Technology</a>
          <a href="#splits-demo" className="text-[12px] font-semibold text-white/50 hover:text-white transition-colors">Visual Splits</a>
          <a href="#how-it-works" className="text-[12px] font-semibold text-white/50 hover:text-white transition-colors">Process</a>
          <div className="flex items-center gap-2 text-[12px] border-l border-white/10 pl-6" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
            Arc Testnet Live
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-28 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-widest mb-8" style={{
          background: 'rgba(0,194,255,0.08)',
          border: '1px solid rgba(0,194,255,0.20)',
          color: '#00C2FF',
        }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" style={{ boxShadow: '0 0 8px #00C2FF' }} />
          CREDIT WHERE CREDIT IS DUE · ON-CHAIN
        </div>

        <h1 className="font-black tracking-tight leading-none mb-6 max-w-4xl" style={{ fontSize: 'clamp(48px, 6vw, 84px)', color: 'white' }}>
          Every second played,<br />
          <span style={{
            background: 'linear-gradient(135deg, #00C2FF 0%, #A89EFF 50%, #34D399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            every hand gets paid.
          </span>
        </h1>

        <p className="max-w-2xl text-[16px] leading-relaxed mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Provenance Pay connects music file tags (via <span style={{ color: 'white' }}>MusicBrainz / Beets</span>) to a recursive royalty split engine, executing instant <span style={{ color: 'white' }}>Circle USDC Nanopayments</span> directly to every single contributor in real time.
        </p>

        {/* Call to Action Wallet Connect */}
        <div className="flex flex-col items-center gap-4 relative z-20">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="relative px-12 py-4.5 rounded-2xl font-bold text-[16px] transition-all duration-300"
            style={{
              background: connecting ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00C2FF, #A89EFF)',
              color: connecting ? 'rgba(255,255,255,0.3)' : 'white',
              boxShadow: connecting ? 'none' : '0 0 45px rgba(0,194,255,0.4), 0 8px 32px rgba(0,0,0,0.5)',
              cursor: connecting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (!connecting) e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {connecting ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting with MetaMask…
              </span>
            ) : 'CONNECT WALLET TO ENTER'}
          </button>

          {errorMsg && (
            <div className="text-[12px] px-4 py-2.5 rounded-xl max-w-sm text-center animate-fade-up" style={{ color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
              {errorMsg}
            </div>
          )}

          <p className="text-[11px] tracking-wide" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
            METAMASK REQUIRED · ARC TESTNET · GAS-FREE Settlements
          </p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-4 divide-x" style={{ divideColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
          {[
            { val: '$0.456000', label: 'USDC Disbursed' },
            { val: '20,322', label: 'Transactions Settled' },
            { val: '10', label: 'Active Contributors' },
            { val: '<1s', label: 'Block Finality' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-8 px-4" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="font-black text-[24px] font-mono" style={{
                background: 'linear-gradient(135deg, #00C2FF, #34D399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.val}</span>
              <span className="text-[10px] tracking-[0.15em] uppercase mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 py-24 scroll-mt-10">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-circle-cyan mb-2 font-mono">Platform Capabilities</p>
          <h2 className="text-white text-3xl font-extrabold tracking-tight">Built to solve the music split issue</h2>
          <p className="text-white/40 text-[14px] mt-3 max-w-xl mx-auto">Provenance Pay addresses the lack of real-time multi-recipient attribution and settlement networks in the modern creator economy.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={f.title}
              className="rounded-2xl p-7 transition-all duration-300 group"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = f.color + '40';
                e.currentTarget.style.background = f.color + '05';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: f.color + '15', border: `1px solid ${f.color}25`, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-[15px] mb-2 text-white/90">{f.title}</h3>
              <p className="text-[13px] leading-relaxed text-white/40">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Splits Preview Section */}
      <section id="splits-demo" className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-white/5 scroll-mt-10">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-5">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#A89EFF] mb-2 font-mono">Dynamic Rev Splits</p>
            <h2 className="text-white text-3xl font-extrabold tracking-tight">Interactive Provenance Visualization</h2>
            <p className="text-white/45 text-[14px] mt-4 leading-relaxed">
              When a track is played, the Provenance Agent reconstructs the hierarchy tree. Here is how royalties are split across a mock featured track:
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-[13px] text-white/60">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                <strong>J. Cole (Primary Artist)</strong> — 35% revenue split
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A89EFF]" />
                <strong>No I.D. (Producer)</strong> — 25% revenue split
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                <strong>Amber (Featured Vocalist)</strong> — 15% revenue split
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <strong>Derek Lee (Mix Engineer)</strong> — 8% (Auto-Provisioned Escrow)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F87171]" />
                <strong>Sal Alvarez (Guitarist)</strong> — 7% (Auto-Provisioned Escrow)
              </li>
            </ul>
          </div>
          <div className="col-span-7 bg-white/[0.015] border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex items-center justify-center">
            {/* Glowing lines representation */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg width="400" height="280" className="opacity-40">
                <line x1="200" y1="140" x2="80" y2="70" stroke="#00C2FF" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
                <line x1="200" y1="140" x2="320" y2="70" stroke="#A89EFF" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
                <line x1="200" y1="140" x2="200" y2="40" stroke="#34D399" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
                <line x1="200" y1="140" x2="90" y2="210" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
                <line x1="200" y1="140" x2="310" y2="210" stroke="#F87171" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
              </svg>
            </div>

            {/* Nodes */}
            <div className="relative w-full h-[280px]">
              {/* Root */}
              <div className="absolute top-[120px] left-[170px] w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 border-white/20 bg-[#080810] shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <span className="text-[10px] text-white font-bold leading-none">TRACK</span>
                <span className="text-[8px] text-white/50 mt-0.5">100%</span>
              </div>
              
              {/* J. Cole */}
              <div className="absolute top-[40px] left-[40px] w-14 h-14 rounded-full flex flex-col items-center justify-center border border-[#00C2FF]/30 bg-[#080810] shadow-[0_0_12px_rgba(0,194,255,0.15)]">
                <span className="text-[9px] text-[#00C2FF] font-bold leading-none">J. Cole</span>
                <span className="text-[8px] text-white/40 mt-0.5">35%</span>
              </div>

              {/* No I.D. */}
              <div className="absolute top-[40px] left-[280px] w-14 h-14 rounded-full flex flex-col items-center justify-center border border-[#A89EFF]/30 bg-[#080810] shadow-[0_0_12px_rgba(168,158,255,0.15)]">
                <span className="text-[9px] text-[#A89EFF] font-bold leading-none">No I.D.</span>
                <span className="text-[8px] text-white/40 mt-0.5">25%</span>
              </div>

              {/* Amber */}
              <div className="absolute top-[10px] left-[172px] w-14 h-14 rounded-full flex flex-col items-center justify-center border border-[#34D399]/30 bg-[#080810] shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                <span className="text-[9px] text-[#34D399] font-bold leading-none">Amber</span>
                <span className="text-[8px] text-white/40 mt-0.5">15%</span>
              </div>

              {/* Derek (Escrow) */}
              <div className="absolute top-[180px] left-[50px] w-14 h-14 rounded-full flex flex-col items-center justify-center border border-[#F59E0B]/30 bg-[#080810] shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <span className="text-[9px] text-[#F59E0B] font-bold leading-none">Derek Lee</span>
                <span className="text-[7px] text-white/30 mt-0.5">🔒 8%</span>
              </div>

              {/* Sal (Escrow) */}
              <div className="absolute top-[180px] left-[270px] w-14 h-14 rounded-full flex flex-col items-center justify-center border border-[#F87171]/30 bg-[#080810] shadow-[0_0_12px_rgba(248,113,113,0.15)]">
                <span className="text-[9px] text-[#F87171] font-bold leading-none">Sal A.</span>
                <span className="text-[7px] text-white/30 mt-0.5">🔒 7%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Integration Section */}
      <section id="technology" className="relative z-10 max-w-5xl mx-auto px-6 py-24 border-t border-white/5 scroll-mt-10">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#34D399] mb-2 font-mono">Circle Agent Stack</p>
          <h2 className="text-white text-3xl font-extrabold tracking-tight">Full-Stack Blockchain Infrastructure</h2>
          <p className="text-white/40 text-[14px] mt-3 max-w-xl mx-auto">Provenance Pay leverages all layers of the Circle platform to create secure, instant, and frictionless payments.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {circleLayers.map((layer, i) => (
            <div key={layer.title} className="rounded-2xl p-5 border border-white/5 bg-white/[0.005] flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded-full inline-block mb-4">{layer.tech}</span>
                <h3 className="font-bold text-[14px] text-white mb-2">{layer.title}</h3>
              </div>
              <p className="text-[12px] leading-relaxed text-white/35 mt-2">{layer.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section: Traditional vs Provenance Pay */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/30 mb-2 font-mono">Paradigm Shift</p>
          <h2 className="text-white text-2xl font-extrabold tracking-tight">How Provenance Pay compares</h2>
        </div>

        <div className="border border-white/5 bg-white/[0.01] rounded-3xl overflow-hidden">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <th className="p-5 font-bold text-white/80">Feature</th>
                <th className="p-5 font-bold text-white/45">Traditional Music Royalties</th>
                <th className="p-5 font-bold text-circle-cyan">Provenance Pay Network</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="p-5 text-white font-semibold">Payment Latency</td>
                <td className="p-5 text-white/40">12 — 18 Months</td>
                <td className="p-5 text-[#34D399] font-semibold">2 Seconds (Real-time playback)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-5 text-white font-semibold">Intermediaries & Fees</td>
                <td className="p-5 text-white/40">Up to 80% deductions (Distributor, Label, PRO)</td>
                <td className="p-5 text-[#00C2FF] font-semibold">0% Middleman cuts (Direct transfer)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-5 text-white font-semibold">Unknown Collaborators</td>
                <td className="p-5 text-white/40">Black box / Unclaimed royalty loss</td>
                <td className="p-5 text-white/60">Autonomous Agent Escrow creation</td>
              </tr>
              <tr>
                <td className="p-5 text-white font-semibold">Royalty Split Transparency</td>
                <td className="p-5 text-white/40">Private backend accounting ledgers</td>
                <td className="p-5 text-white/60">Immutable Solidity Registry (Arc Testnet)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-4xl mx-auto px-6 py-20 border-t border-white/5 scroll-mt-10">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#F59E0B] mb-2 font-mono">Step-by-Step Flow</p>
          <h2 className="text-white text-3xl font-extrabold tracking-tight">The Lifecycle of a Nanopayment Session</h2>
        </div>

        <div className="flex flex-col gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="flex gap-6 items-start rounded-2xl p-5 border border-white/[0.03] bg-white/[0.005] hover:border-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0"
                style={{ background: s.color + '12', border: `1px solid ${s.color}30`, color: s.color, boxShadow: `0 0 16px ${s.color}15` }}>
                {s.step}
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-white/90 mb-1">{s.label}</h3>
                <p className="text-[13px] leading-relaxed text-white/35">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/30 mb-2 font-mono">FAQ</p>
          <h2 className="text-white text-2xl font-extrabold tracking-tight">Got Questions?</h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const active = activeFaq === i;
            return (
              <div key={i} className="border border-white/5 bg-white/[0.005] rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(active ? null : i)}
                  className="w-full p-5 text-left flex justify-between items-center text-[14px] font-semibold text-white/80 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`transition-transform duration-200 ${active ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {active && (
                  <div className="px-5 pb-5 text-[13px] leading-relaxed text-white/45 border-t border-white/5 pt-3 animate-fade-up">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 text-[10px] tracking-[0.25em] uppercase border-t border-white/5" style={{ color: 'rgba(255,255,255,0.15)' }}>
        Powered by Circle Agent Stack × Arc Testnet × MusicBrainz
      </footer>

      <style>{`
        .animate-dash {
          stroke-dasharray: 6;
          animation: dash-flow 25s linear infinite;
        }
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -1000;
          }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeInUp 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
}
