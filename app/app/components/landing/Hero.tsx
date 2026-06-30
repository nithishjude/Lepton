'use client';
import { motion } from 'framer-motion';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';

interface HeroProps {
  connecting: boolean;
  errorMsg: string | null;
  onConnect: () => void;
  metrics: { totalPaid: string; txCount: number; contributorCount: number };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item: any = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };

export function Hero({ connecting, errorMsg, onConnect, metrics }: HeroProps) {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Background orbs and 3D shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #00C2FF 0%, #A89EFF 50%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #A89EFF, transparent)' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00C2FF, transparent)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Floating 3D Assets */}
        <motion.img
          src="/assest 2 (1).png"
          alt="3D Shape"
          className="absolute top-[15%] left-[10%] w-48 h-48 object-contain opacity-80 blur-[2px]"
          animate={{ y: [0, -30, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src="/assest 2 (2).png"
          alt="3D Shape"
          className="absolute top-[60%] left-[15%] w-64 h-64 object-contain opacity-90"
          animate={{ y: [0, 40, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.img
          src="/assest 2 (3).png"
          alt="3D Shape"
          className="absolute top-[20%] right-[10%] w-56 h-56 object-contain opacity-90"
          animate={{ y: [0, -40, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.img
          src="/assest 2 (4).png"
          alt="3D Shape"
          className="absolute top-[55%] right-[12%] w-40 h-40 object-contain opacity-80 blur-[1px]"
          animate={{ y: [0, 30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center max-w-4xl mx-auto"
      >
        {/* Badge */}
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-mono mb-8"
            style={{ background: 'rgba(0,194,255,0.06)', border: '1px solid rgba(0,194,255,0.15)', color: '#00C2FF' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse" />
            Circle Agent Stack · Arc Testnet · Live
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={item}
          className="text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.08] tracking-[-0.03em] mb-6 text-white">
          Every second a track plays,{' '}
          <span className="relative inline-block">
            <span style={{ background: 'linear-gradient(135deg, #00C2FF 0%, #A89EFF 50%, #34D399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              every hand gets paid.
            </span>
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p variants={item}
          className="text-[clamp(1rem,2vw,1.2rem)] leading-relaxed mb-10 max-w-2xl"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          Provenance Pay reads MusicBrainz metadata, builds a recursive royalty graph for every contributor,
          and fires{' '}
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Circle USDC Nanopayments</span>
          {' '}to every credited wallet simultaneously — in real time.
        </motion.p>

        {/* CTA */}
        <motion.div variants={item} className="flex flex-col items-center gap-3">
          {isConnected && address ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-mono"
                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
                <span className="w-2 h-2 rounded-full bg-[#34D399]" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                {address.slice(0, 6)}…{address.slice(-4)} — Connected
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="group relative px-10 py-4 rounded-2xl font-bold text-[16px] transition-all duration-300 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #A89EFF)', color: 'white', boxShadow: '0 0 40px rgba(0,194,255,0.35), 0 8px 32px rgba(0,0,0,0.4)' }}
              >
                <span className="relative z-10">Enter Dashboard →</span>
              </button>
              <button onClick={() => disconnect()}
                className="text-[12px] font-mono transition-colors"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                Disconnect wallet
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onConnect}
                disabled={connecting}
                className="group relative px-10 py-4 rounded-2xl font-bold text-[16px] transition-all duration-300 overflow-hidden"
                style={{
                  background: connecting ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #00C2FF, #A89EFF)',
                  color: connecting ? 'rgba(255,255,255,0.3)' : 'white',
                  boxShadow: connecting ? 'none' : '0 0 40px rgba(0,194,255,0.35), 0 8px 32px rgba(0,0,0,0.4)',
                  cursor: connecting ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!connecting) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                {connecting ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Connecting to MetaMask…
                  </span>
                ) : 'Connect Wallet to Enter'}
              </button>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[12px] px-4 py-2.5 rounded-xl max-w-sm text-center"
                  style={{ color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                  {errorMsg}
                </motion.div>
              )}
              <p className="text-[11px] tracking-widest uppercase font-mono mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                MetaMask Required · Arc Testnet · Gas-Free
              </p>
            </>
          )}
        </motion.div>

        {/* Live stats ticker */}
        <motion.div variants={item} className="mt-16 w-full max-w-xl">
          <div className="grid grid-cols-3 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'USDC Disbursed', value: `$${metrics.totalPaid}` },
              { label: 'Txs Settled', value: metrics.txCount.toLocaleString() },
              { label: 'Active Contributors', value: metrics.contributorCount.toLocaleString() },
            ].map((s, i) => (
              <div key={s.label}
                className="flex flex-col items-center py-5 px-4"
                style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="text-[18px] font-bold font-mono text-white">{s.value}</div>
                <div className="text-[10px] font-mono mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
