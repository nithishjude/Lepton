'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

export function Web3Navbar({ onConnect, isConnected, address, disconnect }: any) {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.6]);
  const blur = useTransform(scrollY, [0, 80], [0, 12]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.1]);

  const links = ['Features', 'How it Works', 'Ecosystem', 'Docs'];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{ 
        backgroundColor: useTransform(bgOpacity, o => `rgba(8, 8, 16, ${o})`), 
        backdropFilter: useTransform(blur, b => `blur(${b}px)`),
        borderBottom: useTransform(borderOpacity, o => `1px solid rgba(255, 255, 255, ${o})`)
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#9945FF] to-[#00C2FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,194,255,0.4)]">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="text-white text-[15px] font-medium tracking-tight">Provenance Pay</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isConnected && address ? (
            <button
              onClick={() => disconnect()}
              className="text-[13px] font-medium text-white/90 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="text-[13px] font-medium text-white px-4 py-1.5 rounded-full bg-gradient-to-r from-[#9945FF]/80 to-[#00C2FF]/80 border border-white/10 hover:shadow-[0_0_20px_rgba(0,194,255,0.3)] transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
