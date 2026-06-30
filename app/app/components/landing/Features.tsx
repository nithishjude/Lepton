'use client';
import { motion } from 'framer-motion';
import { IconMusic, IconBolt, IconWallet, IconLock } from '@tabler/icons-react';

const FEATURES = [
  {
    icon: <IconMusic size={24} />,
    title: 'MusicBrainz Attribution Parser',
    desc: 'Autonomously ingests standard file tagging schemas from MusicBrainz. Resolves artists, co-writers, mix engineers, and session instrumentalists dynamically.',
    color: '#00C2FF',
  },
  {
    icon: <IconBolt size={24} />,
    title: 'Circle Nanopayments SDK',
    desc: 'Dispatches high-frequency micropayments every 2s using off-chain batch signature verification, settling on-chain in single aggregated transactions.',
    color: '#34D399',
  },
  {
    icon: <IconWallet size={24} />,
    title: 'Agent Wallet Auto-Provisioning',
    desc: 'Unknown contributors are automatically provisioned an on-chain MPC Agent Wallet with strict daily withdrawal limits. Funds accrue in escrow until claimed.',
    color: '#F59E0B',
  },
  {
    icon: <IconLock size={24} />,
    title: 'On-Chain Provenance Registry',
    desc: 'Stores canonical splits immutably in ProvenanceRegistry.sol on Arc Testnet. Once written, splits are tamper-proof and public to all audit trails.',
    color: '#A89EFF',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#00C2FF] mb-2 font-mono">Core Infrastructure</p>
          <h2 className="text-white text-[clamp(2rem,4vw,2.5rem)] font-bold tracking-tight">How Provenance Pay Works</h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-6"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative rounded-3xl p-8 overflow-hidden transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}
              whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {/* Subtle hover gradient */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(600px circle at center, ${feature.color}0A, transparent 50%)` }}
              />
              
              <div className="relative z-10 flex flex-col h-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${feature.color}15`, color: feature.color, border: `1px solid ${feature.color}30` }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
