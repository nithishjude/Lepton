'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { IconPlayerPlayFilled } from '@tabler/icons-react';

export function SolanaEcosystem() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} className="relative min-h-[90vh] py-32 overflow-hidden" style={{ background: 'black' }}>
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        
        <div className="flex flex-col">
          <motion.h2 
            className="text-[4rem] md:text-[5rem] font-bold leading-[1] tracking-tighter text-white mb-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            Join the fastest<br />growing<br />creator economy
          </motion.h2>
        </div>

        <div className="flex flex-col">
          <motion.p 
            className="text-[20px] md:text-[24px] text-white/70 mb-12 max-w-lg"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            Provenance Pay is the fastest growing ecosystem for independent musicians, producers, and session artists looking for transparent and immediate compensation.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <button className="uppercase text-[14px] font-medium px-8 py-4 rounded-full transition-all text-white bg-[#9945FF] hover:bg-[#8031e0] w-fit">
              Explore the registry
            </button>
          </motion.div>
        </div>
      </div>

      {/* Floating "Say Hello" Popup */}
      <motion.div 
        className="absolute right-0 lg:right-20 bottom-10 lg:bottom-20 z-20 w-[450px] p-10 rounded-[20px] shadow-2xl"
        style={{ 
          background: '#14F195',
          boxShadow: '0 20px 40px rgba(20, 241, 149, 0.2)',
          y
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <h3 className="text-[4rem] font-bold text-black leading-[1] tracking-tight mb-4">See it live</h3>
        <p className="text-black/80 text-[20px] mb-8 max-w-sm">
          Learn how AI-provisioned escrow wallets ensure every contributor gets paid on time.
        </p>
        <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-[14px] uppercase font-bold hover:bg-black/80 transition-colors">
          Watch Demo <IconPlayerPlayFilled size={14} />
        </button>
      </motion.div>

      {/* Background Dots Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0 flex items-center justify-center">
        <div 
          className="w-[800px] h-[800px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, #9945FF 0%, transparent 60%)' }}
        />
      </div>
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />
    </section>
  );
}
