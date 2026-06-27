'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function Web3Hero({ onConnect }: { onConnect: () => void }) {
  const ref = useRef(null);
  
  // Tie animations directly to scroll progress
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100vh] flex flex-col pt-32 pb-20 overflow-hidden bg-[#080810]">
      <style>{`
        @keyframes hero-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.15); }
        }
        @keyframes hero-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(0.85); }
        }
        @keyframes hero-grid-fade {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.08; }
        }
      `}</style>

      {/* Animated CSS background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(153,69,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '55px 55px',
            animation: 'hero-grid-fade 5s ease-in-out infinite'
          }}
        />
        {/* Purple orb left */}
        <div
          className="absolute -left-20 top-1/4 w-[650px] h-[650px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(153,69,255,0.22) 0%, transparent 65%)',
            animation: 'hero-orb-1 10s ease-in-out infinite'
          }}
        />
        {/* Cyan orb right */}
        <div
          className="absolute -right-20 bottom-1/4 w-[550px] h-[550px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,194,255,0.18) 0%, transparent 65%)',
            animation: 'hero-orb-2 12s ease-in-out infinite'
          }}
        />
        {/* Center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(100,50,200,0.1) 0%, transparent 70%)' }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#080810]/30 via-transparent to-[#080810] pointer-events-none z-[1]" />

      <motion.div 
        className="w-full max-w-5xl mx-auto px-6 relative z-10 flex-1 flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ y: textY, opacity, willChange: 'transform, opacity' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 pointer-events-auto backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
          <span className="text-[12px] font-medium text-white/70 uppercase tracking-wider">Introducing Provenance V2</span>
        </motion.div>

        <motion.h1 
          className="text-[3.5rem] md:text-[5.5rem] font-bold leading-[1.1] tracking-tight text-white mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.4 }}
        >
          The future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#00C2FF]">
            decentralized payments
          </span>
        </motion.h1>

        <motion.p 
          className="text-[18px] md:text-[22px] text-white/60 max-w-2xl mb-10 font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
        >
          Provenance Pay enables instant, trustless royalty splits and composable music rights for the modern creator economy.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
        >
          <button 
            onClick={onConnect}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-[15px] font-semibold text-white bg-gradient-to-r from-[#9945FF] to-[#00C2FF] hover:shadow-[0_0_30px_rgba(153,69,255,0.4)] transition-all transform hover:-translate-y-1"
          >
            Get Started
          </button>
          
          <button 
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-[15px] font-semibold text-white/90 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all transform hover:-translate-y-1"
          >
            Learn More
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
