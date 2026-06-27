'use client';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="relative py-12 px-6 border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom, rgba(0,194,255,0.03) 0%, transparent 60%)' }} />
      
      <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00C2FF, #A89EFF)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight">Provenance Pay</span>
        </div>

        <div className="flex items-center gap-6 text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
        </div>

        <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Built on Circle Agent Stack & Arc Testnet
        </div>
      </div>
    </footer>
  );
}
