'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Load the wagmi-dependent component only on the client side to avoid SSR issues
const ClaimContent = dynamic(() => import('./ClaimContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full text-center py-4">
      <div className="inline-block w-8 h-8 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ClaimPortal() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F] items-center justify-center p-8">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#00C2FF 1px, transparent 1px), linear-gradient(to right, #00C2FF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative bg-[#12121A] rounded-2xl border border-gray-800 p-10 max-w-md w-full flex flex-col items-center shadow-2xl">
        {/* Back to Dashboard Link */}
        <Link href="/dashboard" className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 font-mono text-xs transition-colors flex items-center gap-1">
          ← DASHBOARD
        </Link>

        {/* Glow effect */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#F59E0B]/20 to-transparent pointer-events-none" />

        <div className="mb-2 w-12 h-12 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-2xl">
          🎵
        </div>
        <h1 className="text-2xl font-bold text-[#F59E0B] tracking-widest font-mono text-center mt-3 mb-2">
          CLAIM ESCROW
        </h1>
        <p className="text-gray-500 font-mono text-xs text-center mb-8 leading-relaxed">
          Connect your Web3 wallet to view and claim<br />escrowed royalties on Arc Testnet.
        </p>

        <ClaimContent />

        <div className="mt-8 pt-6 border-t border-gray-800/60 text-center w-full">
          <p className="text-gray-700 font-mono text-[10px] tracking-wider">
            POWERED BY CIRCLE DEVELOPER-CONTROLLED WALLETS × ARC TESTNET
          </p>
        </div>
      </div>
    </div>
  );
}
