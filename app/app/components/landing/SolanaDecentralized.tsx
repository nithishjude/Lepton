'use client';
import { motion } from 'framer-motion';

export function SolanaDecentralized() {
  return (
    <section className="relative min-h-screen py-32 overflow-hidden flex flex-col justify-center" style={{ background: 'black' }}>
      
      {/* Background Glowing Arches */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-start justify-center pt-20">
        <div 
          className="w-[120%] h-[1200px] border-[2px] rounded-[50%_50%_0_0/100%_100%_0_0] absolute top-[-20%] opacity-20"
          style={{ borderColor: '#14F195', boxShadow: 'inset 0 40px 100px rgba(20, 241, 149, 0.2), 0 -40px 100px rgba(20, 241, 149, 0.2)' }}
        />
        <div 
          className="w-[100%] h-[1000px] border-[2px] rounded-[50%_50%_0_0/100%_100%_0_0] absolute top-[0%] opacity-40"
          style={{ borderColor: '#14F195', boxShadow: 'inset 0 40px 100px rgba(20, 241, 149, 0.3), 0 -40px 100px rgba(20, 241, 149, 0.3)' }}
        />
        <div 
          className="w-[80%] h-[800px] border-[2px] rounded-[50%_50%_0_0/100%_100%_0_0] absolute top-[20%] opacity-60"
          style={{ borderColor: '#14F195', boxShadow: 'inset 0 40px 100px rgba(20, 241, 149, 0.5), 0 -40px 100px rgba(20, 241, 149, 0.5)' }}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        <motion.h2 
          className="text-[4rem] md:text-[5rem] font-bold leading-[1] tracking-tighter text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Decentralized<br />music rights
        </motion.h2>
        
        <motion.p 
          className="text-[20px] md:text-[24px] text-white/70 max-w-2xl mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Not only is Provenance Pay ultra-fast and low cost, it is completely trustless. Meaning, the registry remains open for independent artists to claim splits directly and streaming access will never be stopped.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            className="p-12 rounded-3xl cursor-pointer transition-transform hover:-translate-y-2"
            style={{ background: '#F85A9B' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-black text-[3rem] font-bold leading-tight">View Artists</h3>
          </motion.div>

          <motion.div 
            className="p-12 rounded-3xl cursor-pointer transition-transform hover:-translate-y-2"
            style={{ background: '#14F195' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-black text-[3rem] font-bold leading-tight">Register Track</h3>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
