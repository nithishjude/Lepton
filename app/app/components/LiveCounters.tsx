'use client';
import React, { useEffect, useState } from 'react';

export default function LiveCounters({ trackId, setGraph }: { trackId: string | null; setGraph: (graph: any) => void }) {
  const [gateStatus, setGateStatus] = useState('WAITING FOR PLAYBACK...');
  const [balances, setBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!trackId) return;

    setGateStatus('WAITING FOR PLAY-GATE (15s)...');
    const sse = new EventSource(`http://localhost:3001/api/payments/stream?trackId=${trackId}`);

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'graph_ready') {
          setGraph(data.graph);
        } else if (data.type === 'gate_cleared') {
          setGateStatus('NANOPAYMENTS ACTIVE');
        } else if (data.type === 'tick') {
          setBalances(prev => {
            const next = { ...prev };
            for (const conf of data.confirmations) {
              const current = parseFloat(next[conf.contributorMbid] || '0');
              const amount = parseFloat(conf.amount);
              next[conf.contributorMbid] = (current + amount).toFixed(6);
            }
            return next;
          });
        } else if (data.type === 'stopped') {
          setGateStatus('PLAYBACK STOPPED. PAYMENTS HALTED.');
          sse.close();
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    return () => sse.close();
  }, [trackId, setGraph]);

  return (
    <div className="flex flex-col space-y-4">
      <div className={`p-4 rounded border font-mono text-sm font-bold text-center transition-colors
        ${gateStatus === 'NANOPAYMENTS ACTIVE' 
          ? 'bg-circle-cyan/20 border-circle-cyan text-circle-cyan' 
          : gateStatus.includes('STOPPED') 
            ? 'bg-red-500/20 border-red-500 text-red-500'
            : 'bg-circle-amber/20 border-circle-amber text-circle-amber'}`}>
        {gateStatus}
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {Object.entries(balances).map(([mbid, amount]) => (
          <div key={mbid} className="bg-black/60 border border-gray-800 p-4 rounded-lg flex justify-between items-center">
            <span className="font-mono text-gray-300 text-sm truncate w-1/2">MBID: {mbid.slice(0,8)}...</span>
            <span className="font-mono text-circle-cyan text-lg font-bold">
              ${amount} <span className="text-xs text-gray-500">USDC</span>
            </span>
          </div>
        ))}
        {Object.keys(balances).length === 0 && (
          <p className="text-gray-600 text-sm italic font-mono text-center py-8">No payments distributed yet.</p>
        )}
      </div>
    </div>
  );
}
