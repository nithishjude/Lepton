'use client';
import { motion } from 'framer-motion';

const CIRCLE_LAYERS = [
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

export function Ecosystem() {
  return (
    <section id="technology" className="relative py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#34D399] mb-2 font-mono">Circle Agent Stack</p>
          <h2 className="text-white text-[clamp(2rem,4vw,2.5rem)] font-bold tracking-tight mb-4">Full-Stack Blockchain Infrastructure</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Provenance Pay leverages all layers of the Circle platform to create secure, instant, and frictionless payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CIRCLE_LAYERS.map((layer, i) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-3xl p-6"
              style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="mb-auto">
                <span className="inline-block px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider mb-5"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {layer.tech}
                </span>
                <h3 className="text-[15px] font-bold text-white mb-2 leading-snug">{layer.title}</h3>
              </div>
              <p className="text-[13px] leading-relaxed mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {layer.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
