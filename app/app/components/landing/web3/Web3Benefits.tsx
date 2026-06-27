'use client';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 1800; // ms
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export function Web3Benefits() {
  return (
    <section className="py-32 bg-[#080810] relative overflow-hidden">
      
      {/* Cheap radial gradient background accent — no blur filter */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(153,69,255,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold text-white tracking-tight mb-6 leading-[1.1]">
              Why choose <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#2E82FF]">
                Provenance
              </span>
            </h2>
            <p className="text-[18px] text-white/60 font-light max-w-md mb-8">
              We eliminate the middleman, ensuring that artists get paid fairly and instantly for every single stream.
            </p>
            <ul className="space-y-4 text-white/80 font-medium">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#14F195]/20 flex items-center justify-center text-[#14F195]">✓</div>
                Zero bridging fees
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#14F195]/20 flex items-center justify-center text-[#14F195]">✓</div>
                Transparent on-chain splits
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#14F195]/20 flex items-center justify-center text-[#14F195]">✓</div>
                AI-provisioned escrow wallets
              </li>
            </ul>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-center hover:bg-white/8 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-[3rem] font-bold text-white mb-2">
                <AnimatedCounter value={98} suffix="%" />
              </div>
              <div className="text-[14px] text-white/50 uppercase tracking-wider font-medium">Revenue to Artist</div>
            </motion.div>
            
            <motion.div 
              className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-center hover:bg-white/8 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: 0.1 } as any}
            >
              <div className="text-[3rem] font-bold text-white mb-2">
                <AnimatedCounter value={2} suffix="s" />
              </div>
              <div className="text-[14px] text-white/50 uppercase tracking-wider font-medium">Avg Settlement Time</div>
            </motion.div>
            
            <motion.div 
              className="bg-[#00C2FF]/10 border border-[#00C2FF]/20 rounded-3xl p-8 flex flex-col justify-center md:col-span-2 hover:bg-[#00C2FF]/15 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, delay: 0.2 } as any}
            >
              <div className="text-[4rem] font-bold text-[#00C2FF] mb-2 leading-none">
                <AnimatedCounter value={500} suffix="K+" />
              </div>
              <div className="text-[14px] text-[#00C2FF]/70 uppercase tracking-wider font-medium">Streams Processed</div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
