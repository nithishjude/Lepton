'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SolanaHero({ onConnect }: { onConnect: () => void }) {
  const [count, setCount] = useState(148902);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex flex-col pt-32 overflow-hidden" style={{ background: 'black' }}>
      {/* Background gradients or videos would go here */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% -20%, rgba(20, 241, 149, 0.15) 0%, transparent 70%)' }} />

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <motion.h1 
          className="text-[4rem] md:text-[6rem] font-bold leading-[1] tracking-tighter max-w-4xl text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Fair for artists.<br />Seamless for everyone.
        </motion.h1>

        <motion.p 
          className="text-[20px] md:text-[24px] text-white/70 max-w-2xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Provenance Pay is a decentralized streaming protocol built to guarantee fair, instant royalty splits for every track played.
        </motion.p>

        <motion.div 
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button 
            onClick={onConnect}
            className="uppercase text-[16px] font-medium px-8 py-4 rounded-full transition-all text-black hover:-translate-y-1 hover:bg-white relative"
            style={{ 
              background: '#14F195',
              boxShadow: '0 0 0 0 rgba(20, 241, 149, 1)',
              animation: 'pulsing-outline 2s infinite'
            }}
          >
            Launch Dashboard
          </button>
          
          <button 
            className="uppercase text-[16px] font-medium px-8 py-4 rounded-full transition-all text-white border border-white hover:bg-white hover:text-black hover:-translate-y-1"
          >
            Read Whitepaper
          </button>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pulsing-outline {
          0% { box-shadow: 0 0 0 0 rgba(20, 241, 149, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(20, 241, 149, 0); }
          100% { box-shadow: 0 0 0 0 rgba(20, 241, 149, 0); }
        }
      `}</style>

      {/* Ticker Bottom Bar */}
      <div className="w-full mt-auto" style={{ background: '#14F195', color: 'black' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap lg:grid lg:grid-cols-4 items-center">
          <div className="p-6 border-r border-black/10 flex-1 min-w-[200px]">
            <div className="text-[14px] uppercase tracking-wide opacity-80 font-bold mb-1">Avg. settlement time</div>
            <div className="text-[32px] md:text-[42px] font-bold">2.4s</div>
          </div>
          <div className="p-6 border-r border-black/10 flex-1 min-w-[200px]">
            <div className="text-[14px] uppercase tracking-wide opacity-80 font-bold mb-1">Total Streams Paid</div>
            <div className="text-[32px] md:text-[42px] font-bold">{count.toLocaleString()}</div>
          </div>
          <div className="p-6 border-r border-black/10 flex-1 min-w-[200px]">
            <div className="text-[14px] uppercase tracking-wide opacity-80 font-bold mb-1">Avg. pay per stream</div>
            <div className="text-[32px] md:text-[42px] font-bold">$0.005</div>
          </div>
          <div className="p-6 flex-1 min-w-[200px]">
            <div className="text-[14px] uppercase tracking-wide opacity-80 font-bold mb-1">Active Artists</div>
            <div className="text-[32px] md:text-[42px] font-bold">4,192</div>
          </div>
        </div>
      </div>
    </section>
  );
}
