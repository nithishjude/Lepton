'use client';
import React, { useEffect, useState } from 'react';

interface Tx {
  id: string; contributor_name: string; wallet_address: string;
  amount_usdc: string; nanopay_ref: string; tick_at: string;
  is_escrow: number; track_mbid: string;
}

function relTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => {
    fetch('http://localhost:3001/api/transactions?limit=50')
      .then(r => r.json())
      .then(data => { setTxs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pp-card">
      <div className="pp-card-title">All Arc transactions — sorted by latest</div>

      {loading && <p className="text-[13px] text-[var(--text-muted)] py-4 text-center">Loading transactions…</p>}

      {!loading && txs.length === 0 && (
        <p className="text-[13px] text-[var(--text-muted)] py-8 text-center">
          No transactions yet. Play a track past the 15-second gate.
        </p>
      )}

      {txs.map(tx => (
        <div key={tx.id} className="flex items-center gap-[9px] py-[7px] border-b border-[var(--border)] last:border-0">
          <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
            tx.is_escrow
              ? 'bg-[var(--text-warning)]'
              : parseFloat(tx.amount_usdc) === 0
                ? 'bg-[var(--text-muted)]'
                : 'bg-[var(--text-success)]'
          }`} />
          <span className="flex-1 text-[12px] text-[var(--text-secondary)] truncate">
            {tx.is_escrow ? 'Escrow hold' : 'Batch payout'} → {tx.contributor_name || '?'}
            {tx.wallet_address ? ` (${tx.wallet_address.slice(0, 6)}…${tx.wallet_address.slice(-4)})` : ''}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[180px]" title={tx.nanopay_ref}>
            {tx.nanopay_ref ? tx.nanopay_ref.slice(0, 16) : 'n/a'}…
          </span>
          <span className="text-[12px] font-medium text-[var(--text-primary)] whitespace-nowrap">${parseFloat(tx.amount_usdc).toFixed(6)}</span>
          <span className="text-[11px] text-[var(--text-muted)] min-w-[44px] text-right">{relTime(tx.tick_at)}</span>
        </div>
      ))}
    </div>
  );
}
