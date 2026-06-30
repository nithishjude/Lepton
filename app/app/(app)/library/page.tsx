'use client';
import React, { useEffect, useState } from 'react';
import { IconPlug, IconMusic, IconPlayerPlay, IconSearch, IconLoader2, IconCoin, IconAlertTriangle } from '@tabler/icons-react';
import { usePlayback } from '../../context/PlaybackContext';
import { useSendTransaction, useAccount, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';

interface LibraryTrack {
  mbid: string; title: string; artist: string;
  contributorCount: number; tags: string;
  totalPaid: string; escrowCount: number;
  arcTxHash: string | null; graphReady: boolean;
}

const SIDECAR = 'http://localhost:3001';

export default function LibraryPage() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [mbidInput, setMbidInput] = useState('');
  const { startTrack, trackMbid } = usePlayback();

  const { sendTransactionAsync } = useSendTransaction();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [paymentsCache, setPaymentsCache] = useState<Record<string, string>>({});
  const [selectedTrack, setSelectedTrack] = useState<LibraryTrack | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleMusicBrainzSearch = async () => {
    if (!searchTitle && !searchArtist) return;
    setSearching(true);
    try {
      const res = await fetch(`${SIDECAR}/api/search?title=${encodeURIComponent(searchTitle)}&artist=${encodeURIComponent(searchArtist)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Search] Failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const fetchLibrary = () => {
    fetch(`${SIDECAR}/api/library`)
      .then(r => r.json())
      .then(data => { setTracks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLibrary();
    const id = setInterval(fetchLibrary, 5000);
    return () => clearInterval(id);
  }, []);

  const handlePlay = (t: LibraryTrack) => {
    if (paymentsCache[t.mbid]) {
      startTrack(t.mbid, t.title, t.artist, paymentsCache[t.mbid]);
      return;
    }
    setSelectedTrack(t);
    setPaymentModalOpen(true);
  };

  const handlePayAndStream = async () => {
    if (!selectedTrack) return;
    setPaying(true);
    try {
      // 1. Force Metamask/Wallet to switch to Arc Testnet (chain ID 5042002) if not already on it
      if (chainId !== 5042002) {
        try {
          await switchChainAsync({ chainId: 5042002 });
        } catch (switchErr) {
          console.warn('[x402] Switch chain failed/ignored:', switchErr);
        }
      }

      // 2. Execute the payment transaction on Arc Testnet
      const tx = await sendTransactionAsync({
        to: '0x399b4e9fad179b5d768d6d90945a2d4f799553b1',
        value: parseEther('0.001'),
        chainId: 5042002,
      });
      setPaymentsCache(prev => ({ ...prev, [selectedTrack.mbid]: tx }));
      startTrack(selectedTrack.mbid, selectedTrack.title, selectedTrack.artist, tx);
      setPaymentModalOpen(false);
      setSelectedTrack(null);
    } catch (err: any) {
      alert(`Payment failed: ${err.message || err}`);
    } finally {
      setPaying(false);
    }
  };

  const handleMbidPlay = async () => {
    const mbid = mbidInput.trim();
    if (!mbid) return;
    // Fetch graph first to populate title/artist from real MusicBrainz data
    try {
      const res = await fetch(`${SIDECAR}/api/track/${mbid}/provenance`);
      const graph = await res.json();
      const artist = graph.nodes?.find((n: any) => n.role === 'artist')?.name || 'Unknown Artist';
      const title = graph.title || `Track ${mbid.slice(0, 8)}…`;
      startTrack(mbid, title, artist);
      // Refresh library after a short delay
      setTimeout(fetchLibrary, 3000);
    } catch {
      startTrack(mbid, `Track ${mbid.slice(0,8)}…`, 'Unknown Artist');
    }
    setMbidInput('');
  };

  const filtered = tracks.filter(t => {
    const titleMatch = !searchTitle || t.title.toLowerCase().includes(searchTitle.toLowerCase());
    const artistMatch = !searchArtist || t.artist.toLowerCase().includes(searchArtist.toLowerCase());
    return titleMatch && artistMatch;
  });

  return (
    <div>
      {/* Navidrome-style status bar */}
      <div className="pp-card mb-[14px]">
        <div className="flex items-center gap-2 px-3 py-[10px] bg-[var(--bg-success)] rounded-lg text-[12px] text-[var(--text-success)] font-medium mb-3">
          <IconPlug size={14} />
          MusicBrainz API connected · {tracks.length} tracks loaded · Real-time provenance graph builder active
        </div>

        {/* Structured Inputs for Track and Artist */}
        <div className="flex flex-col gap-3 mb-4 bg-gray-950/20 border border-gray-900 p-3.5 rounded-xl">
          <div className="text-[12px] font-semibold text-gray-300 font-mono flex items-center gap-1.5">
            <IconSearch size={14} />
            SEARCH & DISCOVER TRACKS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-1.5">
              <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase w-10 flex-shrink-0">Title</span>
              <input
                className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Track title..."
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-1.5">
              <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase w-10 flex-shrink-0">Artist</span>
              <input
                className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Artist name..."
                value={searchArtist}
                onChange={e => setSearchArtist(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleMusicBrainzSearch}
            disabled={searching || (!searchTitle && !searchArtist)}
            className="w-full py-2 bg-[var(--bg-accent)] hover:opacity-90 disabled:opacity-50 text-[12px] font-semibold text-[var(--text-accent)] rounded-[var(--radius)] border border-[#00C2FF]/10 transition-all flex items-center justify-center gap-1.5"
          >
            {searching ? (
              <>
                <IconLoader2 className="animate-spin" size={13} />
                Searching Global Catalog...
              </>
            ) : (
              'Search Global MusicBrainz'
            )}
          </button>
        </div>

        {/* Global search results */}
        {searchResults.length > 0 && (
          <div className="mt-2 mb-4 border border-[#00C2FF]/10 bg-[#00C2FF]/5 p-3 rounded-xl">
            <div className="text-[12px] font-bold text-[#00C2FF] flex justify-between items-center mb-2.5">
              <span>MusicBrainz Global Search Results</span>
              <button
                onClick={() => setSearchResults([])}
                className="text-[10px] text-gray-400 hover:text-gray-200 underline font-mono"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-[#12121A]/80 border border-gray-800 rounded-lg hover:border-[#00C2FF]/30 transition-colors">
                  <div className="min-w-0 pr-2">
                    <div className="text-[12.5px] font-semibold text-white truncate">{r.title}</div>
                    <div className="text-[11px] text-gray-400 truncate">{r.artist}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{r.mbid}</div>
                  </div>
                  <button
                    onClick={() => {
                      setMbidInput(r.mbid);
                      startTrack(r.mbid, r.title, r.artist);
                      fetch(`${SIDECAR}/api/track/${r.mbid}/provenance`)
                        .then(() => setTimeout(fetchLibrary, 3000));
                    }}
                    className="flex-shrink-0 px-3 py-1.5 bg-[#00C2FF]/10 text-[#00C2FF] hover:bg-[#00C2FF]/20 border border-[#00C2FF]/20 text-[11px] font-semibold rounded-md transition-colors"
                  >
                    Load & Play
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual MBID entry */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none font-mono"
            placeholder="Enter MusicBrainz MBID to load a new track…"
            value={mbidInput}
            onChange={e => setMbidInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleMbidPlay()}
          />
          <button
            onClick={handleMbidPlay}
            className="px-4 py-2 bg-[var(--bg-accent)] text-[var(--text-accent)] rounded-[var(--radius)] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            Load & Play
          </button>
        </div>

        <div className="mt-2 text-[11px] text-gray-500 font-mono flex flex-col gap-1">
          <span className="text-gray-400 font-medium">Try these real MusicBrainz MBIDs:</span>
          <div className="flex flex-wrap gap-2.5 mt-0.5">
            <button
              onClick={() => setMbidInput('f980fc14-e29b-481d-ad3a-5ed9b4ab6340')}
              className="text-[#00C2FF] hover:underline text-left bg-gray-900/60 px-2 py-1 rounded border border-gray-850"
            >
              f980fc14-e29b-481d-ad3a-5ed9b4ab6340 (J. Cole - Midnight in Memphis)
            </button>
            <button
              onClick={() => setMbidInput('e0218f3e-993a-4f4e-ae3e-626330dea13d')}
              className="text-[#00C2FF] hover:underline text-left bg-gray-900/60 px-2 py-1 rounded border border-gray-850"
            >
              e0218f3e-993a-4f4e-ae3e-626330dea13d (Kesta - Creative Commons Beats)
            </button>
            <button
              onClick={() => setMbidInput('cb61a0f8-c2b6-4ad1-9ef0-e0cb218f399a')}
              className="text-[#00C2FF] hover:underline text-left bg-gray-900/60 px-2 py-1 rounded border border-gray-850"
            >
              cb61a0f8-c2b6-4ad1-9ef0-e0cb218f399a (Chris Zabriskie - Free Flowing Waters)
            </button>
          </div>
        </div>

        <div className="pp-card-title mt-4">All tracks — royalty status</div>

        {loading ? (
          <div className="py-8 text-center text-[var(--text-muted)] text-[13px]">Loading library from MusicBrainz…</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[var(--text-muted)] mb-1">No tracks loaded yet.</p>
            <p className="text-[12px] text-[var(--text-muted)]">Enter a MusicBrainz MBID above to load your first track.</p>
          </div>
        ) : filtered.map(t => (
          <div key={t.mbid} className="flex items-center gap-[10px] py-2 border-b border-[var(--border)] last:border-0 group">
            <div className="w-9 h-9 rounded-md bg-[var(--bg-accent)] flex items-center justify-center flex-shrink-0">
              <IconMusic size={15} className="text-[var(--text-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{t.title}</div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {t.contributorCount} contributors · {t.tags || 'Tags read from MusicBrainz'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{t.mbid}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-[11px] px-2 py-0.5 rounded-full inline-block font-medium ${
                  t.escrowCount > 0
                    ? 'bg-[var(--bg-warning)] text-[var(--text-warning)]'
                    : t.graphReady
                      ? 'bg-[var(--bg-success)] text-[var(--text-success)]'
                      : 'bg-[var(--surface-1)] text-[var(--text-muted)]'
                }`}>
                  {t.escrowCount > 0 ? `${t.escrowCount} unclaimed` : t.graphReady ? 'Graph ready' : 'Loading…'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">${t.totalPaid} paid</div>
              </div>
              <button
                onClick={() => handlePlay(t)}
                disabled={trackMbid === t.mbid}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  trackMbid === t.mbid
                    ? 'bg-[var(--text-success)] text-white'
                    : 'bg-[var(--bg-accent)] text-[var(--text-accent)] hover:opacity-80'
                }`}
                title={trackMbid === t.mbid ? 'Now playing' : 'Play this track'}
              >
                <IconPlayerPlay size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {paymentModalOpen && selectedTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121A] border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in mx-4">
            <div className="flex items-center gap-2.5 mb-3 text-amber-500 font-mono text-[12px] font-semibold tracking-wider">
              <IconCoin size={16} />
              HTTP 402 - PAYMENT REQUIRED
            </div>
            
            <h3 className="text-[15px] font-bold text-white mb-1">Stream Micropayment Gate</h3>
            <p className="text-[12px] text-gray-400 mb-4 leading-relaxed">
              This audio stream is protected. To play <span className="text-white font-medium">"{selectedTrack.title}"</span>, you must execute a 0.001 USDC micro-payment on the Arc Testnet.
            </p>

            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-3 mb-5 font-mono text-[11px] text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Asset:</span>
                <span className="text-white">USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="text-[#00C2FF]">Arc Testnet</span>
              </div>
              <div className="flex justify-between">
                <span>Fee Amount:</span>
                <span className="text-emerald-400 font-semibold">0.001 USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Recipient:</span>
                <span className="text-gray-500">0x399b...53b1</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={paying}
                onClick={() => { setPaymentModalOpen(false); setSelectedTrack(null); }}
                className="flex-1 py-2 bg-gray-900 border border-gray-850 hover:bg-gray-800 text-[12px] font-medium text-gray-400 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={paying}
                onClick={handlePayAndStream}
                className="flex-1 py-2 bg-gradient-to-r from-[#00C2FF] to-[#A89EFF] hover:opacity-90 text-[12px] font-bold text-white rounded-lg transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-[#00C2FF]/20"
              >
                {paying ? (
                  <>
                    <IconLoader2 className="animate-spin" size={13} />
                    Confirming...
                  </>
                ) : (
                  'Authorize Play'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
