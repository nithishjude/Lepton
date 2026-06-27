'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function SolanaScale() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [50, -150]);

  return (
    <section ref={containerRef} className="relative min-h-screen py-32 overflow-hidden flex flex-col items-center justify-center" style={{ background: 'black' }}>
      
      {/* 3D Floating Assets */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center">
        <motion.img 
          src="/assest 2 (1).png" 
          alt="3D Shape 1"
          className="absolute w-[400px] h-[400px] object-contain opacity-90 blur-[1px]"
          style={{ x: '-30%', y: y1 }}
        />
        <motion.img 
          src="/assest 2 (2).png" 
          alt="3D Shape 2"
          className="absolute w-[500px] h-[500px] object-contain opacity-90 blur-[2px]"
          style={{ x: '30%', y: y2, scale: 1.2 }}
        />
        <motion.img 
          src="/assest 2 (3).png" 
          alt="3D Shape 3"
          className="absolute w-[350px] h-[350px] object-contain opacity-100"
          style={{ x: 0, y: y3, zIndex: 10 }}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10 flex flex-col pt-20">
        <motion.h2 
          className="text-[4rem] md:text-[5rem] font-bold leading-[1] tracking-tighter text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Automated<br />royalties at scale
        </motion.h2>
        
        <motion.p 
          className="text-[20px] md:text-[24px] text-white/70 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          Integrate once and never worry about royalty disputes again. Provenance Pay ensures composability between music catalogs and streaming endpoints by reading MusicBrainz tags and settling directly on-chain. Never deal with delayed payouts or fragmented labels again.
        </motion.p>
      </div>
    </section>
  );
}
