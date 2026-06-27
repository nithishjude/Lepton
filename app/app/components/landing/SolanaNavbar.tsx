'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

export function SolanaNavbar({ onConnect, isConnected, address, disconnect }: any) {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const links = ['Artists', 'Listeners', 'Registry', 'Docs'];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-colors"
      style={{ backgroundColor: bgOpacity.get() === 1 ? 'black' : 'transparent', borderBottom: bgOpacity.get() === 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="flex gap-[3px] flex-col w-[26px]">
            <div className="h-[4px] w-full" style={{ background: 'linear-gradient(to right, #14F195, #9945FF)', borderRadius: '2px', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }} />
            <div className="h-[4px] w-full" style={{ background: 'linear-gradient(to right, #14F195, #9945FF)', borderRadius: '2px', clipPath: 'polygon(0 0, 85% 0, 100% 100%, 15% 100%)' }} />
            <div className="h-[4px] w-full" style={{ background: 'linear-gradient(to right, #14F195, #9945FF)', borderRadius: '2px', clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }} />
          </div>
          <span className="text-white text-[18px] font-bold tracking-tight uppercase" style={{ fontFamily: 'sans-serif' }}>Provenance</span>
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-1 text-[14px] font-semibold text-white cursor-pointer group">
            Platform <IconChevronDown size={14} className="text-white/50 group-hover:text-white transition-colors" />
          </div>
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[14px] font-semibold text-white/70 hover:text-white transition-colors relative"
              onMouseEnter={() => setHoveredLink(link)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link}
              {hoveredLink === link && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, #14F195, #9945FF)' }}
                />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isConnected && address ? (
            <button
              onClick={() => disconnect()}
              className="text-[14px] font-semibold text-white px-5 py-2 rounded-full transition-transform hover:-translate-y-[2px]"
              style={{ background: '#131313', border: '1px solid #333' }}
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="text-[14px] font-semibold text-white px-5 py-2 rounded-full transition-transform hover:-translate-y-[2px]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
