'use client';
import { motion } from 'framer-motion';
import { IconBolt, IconMusic, IconShieldLock, IconWallet } from '@tabler/icons-react';
import LogoLoop from '../../ui/LogoLoop';

const FEATURES = [
  {
    icon: <IconMusic size={32} />,
    title: 'MusicBrainz Integration',
    desc: 'Automatically fetch verified artist and composer metadata from MusicBrainz directly on-chain.',
    color: 'from-[#9945FF] to-[#00C2FF]'
  },
  {
    icon: <IconBolt size={32} />,
    title: 'Instant Settlements',
    desc: 'Nanopayments are settled instantly on the Arc network per second of playback. No more monthly waits.',
    color: 'from-[#00C2FF] to-[#2E82FF]'
  },
  {
    icon: <IconShieldLock size={32} />,
    title: 'Automated Escrow',
    desc: 'Unregistered artists have funds automatically provisioned into smart contract escrows until claimed.',
    color: 'from-[#2E82FF] to-[#9945FF]'
  },
  {
    icon: <IconWallet size={32} />,
    title: 'Native Wallets',
    desc: 'Built-in Circle programmable wallets ensure artists get paid directly in USDC without bridging.',
    color: 'from-[#9945FF] to-[#F85A9B]'
  }
];

export function Web3Features() {
  return (
    <section id="features" className="relative py-32 bg-[#080810] overflow-hidden">
      <div className="text-center mb-20 px-6">
        <motion.h2 
          className="text-[2.5rem] md:text-[4rem] font-bold text-white tracking-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Built for the modern creator
        </motion.h2>
        <motion.p 
          className="text-[18px] text-white/60 max-w-2xl mx-auto font-light"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Everything you need to automate royalties and track streams across decentralized networks.
        </motion.p>
      </div>

      <div className="w-full relative h-[450px]">
        <LogoLoop
          logos={FEATURES}
          speed={60}
          direction="left"
          logoHeight={450}
          gap={32}
          pauseOnHover={true}
          fadeOut={true}
          fadeOutColor="#080810"
          renderItem={(feat: any, idx: any) => (
            <div
              key={idx}
              className="group relative p-[1px] rounded-[32px] overflow-hidden w-[400px] h-[450px] shrink-0"
            >
              {/* Animated gradient border on hover */}
              <div className="absolute inset-0 bg-white/5 group-hover:bg-gradient-to-br transition-all duration-700 opacity-50" />
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="relative h-full bg-[#0d0d16] rounded-[31px] p-10 flex flex-col items-start gap-6 z-10 transition-transform duration-500 group-hover:scale-[0.98]">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/90 group-hover:text-white transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-[28px] font-bold text-white tracking-tight leading-tight whitespace-normal">
                  {feat.title}
                </h3>
                <p className="text-[16px] text-white/50 leading-relaxed font-light mt-auto whitespace-normal">
                  {feat.desc}
                </p>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}
