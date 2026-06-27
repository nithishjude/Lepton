'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { Web3Navbar } from './components/landing/web3/Web3Navbar';
import { Web3Hero } from './components/landing/web3/Web3Hero';
import { Web3Features } from './components/landing/web3/Web3Features';
import { Web3HowItWorks } from './components/landing/web3/Web3HowItWorks';
import { Web3Benefits } from './components/landing/web3/Web3Benefits';
import { Web3Footer } from './components/landing/web3/Web3Footer';

export default function LandingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-redirect to dashboard when connected
  useEffect(() => {
    if (isConnected && address) {
      router.push('/dashboard');
    }
  }, [isConnected, address, router]);

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
      if (injectedConnector) {
        connect({ connector: injectedConnector });
      } else {
        connect({ connector: connectors[0] });
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setErrorMsg(err.message || 'Failed to connect wallet');
      setConnecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080810] text-white selection:bg-[#9945FF]/30 selection:text-white font-sans">
      <Web3Navbar 
        onConnect={handleConnect} 
        isConnected={isConnected}
        address={address}
        disconnect={disconnect}
      />
      
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 backdrop-blur-md text-red-200 px-6 py-3 rounded-full z-50 text-[13px] shadow-xl">
          {errorMsg}
        </div>
      )}

      <Web3Hero onConnect={handleConnect} />
      <Web3Features />
      <Web3HowItWorks />
      <Web3Benefits />
      <Web3Footer />
    </main>
  );
}
