'use client';
import React, { useEffect, useState } from 'react';
import { IconPlug, IconMusic, IconPlayerPlay, IconSearch } from '@tabler/icons-react';
import { usePlayback } from '../../context/PlaybackContext';

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
  const [search, setSearch] = useState('');
  const [mbidInput, setMbidInput] = useState('');
  const { startTrack, trackMbid } = usePlayback();

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

  const handlePlay = (t: LibraryTrack) => startTrack(t.mbid, t.title, t.artist);

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

  const filtered = tracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase()) ||
    t.mbid.includes(search)
  );

  return (
    <div>
      {/* Navidrome-style status bar */}
      <div className="pp-card mb-[14px]">
        <div className="flex items-center gap-2 px-3 py-[10px] bg-[var(--bg-success)] rounded-lg text-[12px] text-[var(--text-success)] font-medium mb-3">
          <IconPlug size={14} />
          MusicBrainz API connected · {tracks.length} tracks loaded · Real-time provenance graph builder active
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-2 flex-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2">
            <IconSearch size={13} className="text-[var(--text-muted)]" />
            <input
              className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              placeholder="Search tracks or artists…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

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
    </div>
  );
}
