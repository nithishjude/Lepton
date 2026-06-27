'use client';
import { IconBrandTwitter, IconBrandGithub, IconBrandDiscord } from '@tabler/icons-react';

export function Web3Footer() {
  return (
    <footer className="relative bg-[#080810] pt-20 pb-10 border-t border-white/5 overflow-hidden">
      {/* Glowing top line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#9945FF] to-transparent opacity-30" />

      <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#9945FF] to-[#00C2FF] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-white text-[18px] font-semibold tracking-tight">Provenance Pay</span>
            </div>
            <p className="text-white/50 text-[14px] max-w-sm font-light">
              The decentralized music rights registry and nanopayment streaming protocol. Built for a fair creator economy.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-[14px]">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/50 hover:text-white text-[13px] transition-colors">Features</a></li>
              <li><a href="#" className="text-white/50 hover:text-white text-[13px] transition-colors">Registry</a></li>
              <li><a href="#" className="text-white/50 hover:text-white text-[13px] transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-[14px]">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/50 hover:text-white text-[13px] transition-colors">Documentation</a></li>
              <li><a href="#" className="text-white/50 hover:text-white text-[13px] transition-colors">Whitepaper</a></li>
              <li><a href="#" className="text-white/50 hover:text-white text-[13px] transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-[12px]">
            &copy; {new Date().getFullYear()} Provenance Pay. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/30 hover:text-white transition-colors">
              <IconBrandTwitter size={18} />
            </a>
            <a href="#" className="text-white/30 hover:text-white transition-colors">
              <IconBrandDiscord size={18} />
            </a>
            <a href="#" className="text-white/30 hover:text-white transition-colors">
              <IconBrandGithub size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
