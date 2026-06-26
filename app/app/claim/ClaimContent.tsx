'use client';
import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// This component is only rendered client-side (see claim/page.tsx dynamic import)
export default function ClaimContent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/wallet/${address}/balance`)
      .then(res => res.json())
      .then(data => setBalance(data.balance ?? '0.000000'))
      .catch(() => setBalance('0.000000'))
      .finally(() => setLoading(false));
  }, [isConnected, address]);

  const handleConnect = async () => {
    setErrorMsg(null);
    try {
      const metamask = connectors.find(
        c => c.id.toLowerCase().includes('metamask') || c.name.toLowerCase().includes('metamask')
      );
      if (metamask) {
        connect({ connector: metamask }, {
          onError: (err) => {
            setErrorMsg(err.message || 'Failed to connect');
          }
        });
      } else if (connectors.length > 0) {
        connect({ connector: connectors[0] }, {
          onError: (err) => {
            setErrorMsg(err.message || 'Failed to connect');
          }
        });
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Fallback: direct window.ethereum request
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      } else {
        setErrorMsg('No wallet extension detected. Please install/enable MetaMask.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect');
    }
  };

  return (
    <>
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full bg-[#F59E0B] text-black font-bold font-mono py-3 px-6 rounded hover:bg-[#d98a08] transition-colors"
        >
          CONNECT TO WALLET
        </button>
      ) : (
        <button
          onClick={() => disconnect()}
          className="w-full border border-red-500 text-red-500 font-bold font-mono py-2 px-6 rounded hover:bg-red-500/10 transition-colors"
        >
          DISCONNECT
        </button>
      )}

      {errorMsg && (
        <div className="mt-4 w-full text-red-500 font-mono text-xs text-center bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      {isConnected && (
        <div className="mt-8 w-full bg-black/60 border border-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-400 font-mono text-xs mb-2 tracking-widest">CLAIMABLE BALANCE</p>
          {loading ? (
            <p className="font-mono text-gray-500 text-xl animate-pulse">Fetching...</p>
          ) : (
            <p className="font-mono text-[#F59E0B] text-4xl font-bold tracking-tight">
              ${balance ?? '0.000000'}
              <span className="text-sm text-gray-500 ml-2">USDC</span>
            </p>
          )}
          <button
            className="mt-6 w-full bg-[#F59E0B] text-black font-bold font-mono py-2 rounded opacity-40 cursor-not-allowed"
            disabled
          >
            CLAIM (COMING SOON)
          </button>
          <p className="text-gray-600 font-mono text-xs mt-3">
            {address?.slice(0, 6)}...{address?.slice(-4)} on Arc Testnet
          </p>
        </div>
      )}
    </>
  );
}
