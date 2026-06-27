'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

const FAQS = [
  {
    q: 'How are unknown or unregistered artists paid?',
    a: 'When the sidecar agent parses music metadata and detects a contributor without a registered address, it immediately provisions a new Agent Wallet via the Circle CLI. USDC royalties accumulate in this secure, policy-locked escrow wallet. The artist can later log in to the Claim Portal, authenticate their MusicBrainz ID, and withdraw their accrued funds.'
  },
  {
    q: 'Why is there a 15-second Play-Gate?',
    a: 'To prevent duplicate payments, spamming, and bot plays from draining wallets, Provenance Pay implements a play-gate. The first 15 seconds of any playback event acts as a verification window. If the listener skips the song during this window, no payments are made. Once cleared, payments start flowing retroactively.'
  },
  {
    q: 'What makes the royalty splits tamper-proof?',
    a: 'Royalty splits are written directly to the ProvenanceRegistry smart contract deployed on the Arc Testnet. The contract enforces a write-once policy per MusicBrainz Recording ID (MBID). Once splits are registered on-chain, they cannot be manipulated or overridden by any central party.'
  },
  {
    q: 'What is the role of Circle Nanopayments?',
    a: 'Traditional blockchains fail at micro-royalties because gas fees often exceed the sub-cent split amounts. Circle Nanopayments solves this by batch-signing cryptographic authorizations (EIP-3009) off-chain and submitting them to the Circle Gateway, which settles them on the ledger in aggregated blocks. This makes $0.000001 transactions economically viable.'
  }
];

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/30 mb-2 font-mono">Knowledge Base</p>
          <h2 className="text-white text-[clamp(2rem,4vw,2.5rem)] font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => {
            const isActive = activeIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="overflow-hidden rounded-2xl transition-colors duration-300"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                <button
                  onClick={() => setActiveIndex(isActive ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-[15px] font-semibold text-white">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isActive ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.3)' }}
                  >
                    <IconChevronDown size={18} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
