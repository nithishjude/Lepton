'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { IconCopy, IconCheck, IconX } from '@tabler/icons-react';

interface Tx {
  id: string; contributor_name: string; wallet_address: string;
  amount_usdc: string; nanopay_ref: string; arc_batch_hash?: string; tick_at: string;
  is_escrow: number; track_mbid: string;
}

function relTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:text-[var(--text-accent)] text-gray-500 transition-colors" title="Copy Transaction Hash">
      {copied ? <IconCheck size={11} className="text-emerald-400" /> : <IconCopy size={11} />}
    </button>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterWallet = searchParams.get('wallet');
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/transactions?limit=50')
      .then(r => r.json())
      .then(data => { setTxs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch_();
  }, []);

  const displayedTxs = filterWallet
    ? txs.filter(tx => tx.wallet_address?.toLowerCase() === filterWallet.toLowerCase())
    : txs;

  return (
    <div className="pp-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="pp-card-title m-0">All Arc transactions — sorted by latest</div>
          {filterWallet && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-[#00C2FF] bg-[#00C2FF]/10 px-2.5 py-1 rounded-lg border border-[#00C2FF]/20 w-fit">
              Filtered by wallet: {filterWallet.slice(0, 8)}…{filterWallet.slice(-6)}
              <button onClick={() => router.push('/transactions')} className="hover:text-red-400 transition-colors" title="Clear filter">
                <IconX size={10} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={fetch_}
          className="px-3 py-1.5 bg-[#1C1C24] hover:bg-[#252530] text-[12px] font-semibold text-white rounded-lg border border-gray-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-[13px] text-[var(--text-muted)] py-4 text-center">Loading transactions…</p>}

      {!loading && displayedTxs.length === 0 && (
        <p className="text-[13px] text-[var(--text-muted)] py-8 text-center">
          No transactions matched. Play a track past the 15-second gate.
        </p>
      )}

      {displayedTxs.map(tx => {
        const hash = tx.arc_batch_hash || tx.nanopay_ref;
        return (
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
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[210px]">
              {hash ? (
                <>
                  <a
                    href={`https://testnet.arcscan.app/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-accent)] hover:underline"
                    title={hash}
                  >
                    {hash.slice(0, 16)}…
                  </a>
                  <CopyButton text={hash} />
                </>
              ) : (
                'n/a'
              )}
            </span>
            <span className="text-[12px] font-medium text-[var(--text-primary)] whitespace-nowrap">${parseFloat(tx.amount_usdc).toFixed(6)}</span>
            <span className="text-[11px] text-[var(--text-muted)] min-w-[44px] text-right">{relTime(tx.tick_at)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<p className="text-[13px] text-[var(--text-muted)] py-4 text-center">Loading transactions page…</p>}>
      <TransactionsContent />
    </Suspense>
  );
}
