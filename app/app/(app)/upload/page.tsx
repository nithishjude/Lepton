'use client';
import React, { useState } from 'react';
import { IconPlus, IconTrash, IconLoader2, IconSparkles, IconAlertTriangle } from '@tabler/icons-react';

interface Contributor {
  name: string;
  role: string;
  walletAddress: string;
  bps: number; // basis points (out of 10000)
}

const ROLES = [
  { value: 'artist', label: 'Primary Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'featured_artist', label: 'Featured Artist' },
  { value: 'composer', label: 'Composer' },
  { value: 'mixer', label: 'Mixer' },
  { value: 'session_musician', label: 'Session Musician' }
];

const SIDECAR = 'http://localhost:3001';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [mbid, setMbid] = useState('');
  const [contributors, setContributors] = useState<Contributor[]>([
    { name: '', role: 'artist', walletAddress: '', bps: 5000 },
    { name: '', role: 'producer', walletAddress: '', bps: 5000 }
  ]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleAddContributor = () => {
    setContributors([
      ...contributors,
      { name: '', role: 'producer', walletAddress: '', bps: 0 }
    ]);
  };

  const handleRemoveContributor = (index: number) => {
    const next = [...contributors];
    next.splice(index, 1);
    setContributors(next);
  };

  const handleUpdateContributor = (index: number, key: keyof Contributor, value: any) => {
    const next = [...contributors];
    next[index] = { ...next[index], [key]: value };
    setContributors(next);
  };

  const totalBps = contributors.reduce((sum, c) => sum + (Number(c.bps) || 0), 0);
  const isBpsValid = totalBps === 10000;

  const generateRandomMbid = () => {
    // Generate UUID v4 format
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    const uuid = template.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setMbid(uuid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !mbid || !isBpsValid) return;
    
    // Simple validation for wallet addresses
    for (const c of contributors) {
      if (!c.walletAddress.startsWith('0x') || c.walletAddress.length !== 42) {
        setError(`Invalid Ethereum wallet address for ${c.name || 'contributor'}. Must be a 42-character hex address starting with 0x.`);
        return;
      }
    }

    setLoading(true);
    setTxHash(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('mbid', mbid);
      formData.append('splits', JSON.stringify(contributors));
      if (audioFile) {
        formData.append('audio', audioFile);
      }

      const response = await fetch(`${SIDECAR}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload and register splits');
      }

      setTxHash(data.onChainTxHash);
      // Clear form on success
      setTitle('');
      setArtist('');
      setMbid('');
      setAudioFile(null);
      
      // Reset file input element manually
      const fileInput = document.getElementById('audio-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setContributors([
        { name: '', role: 'artist', walletAddress: '', bps: 5000 },
        { name: '', role: 'producer', walletAddress: '', bps: 5000 }
      ]);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during smart contract registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto py-4">
      <div className="pp-card animate-fade-in mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">On-Chain Music Registration</h1>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Define splits and write immutable attribution rules directly to the ProvenanceRegistry smart contract.</p>
          </div>
          <IconSparkles className="text-[var(--text-accent)] animate-pulse" size={18} />
        </div>

        {error && (
          <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3 text-[12px] text-red-400 flex items-start gap-2.5 mb-4">
            <IconAlertTriangle className="flex-shrink-0 mt-0.5" size={14} />
            <div>{error}</div>
          </div>
        )}

        {txHash && (
          <div className="bg-[var(--bg-success)] border border-[rgba(16,185,129,0.2)] rounded-lg p-3 text-[12px] text-[var(--text-success)] mb-4">
            <div className="font-semibold">✓ Successfully Registered On-Chain!</div>
            <div className="mt-1">
              Smart contract split finalized. Transaction Hash:{' '}
              <a
                href={`https://testnet.arcscan.app/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-85 font-mono break-all"
              >
                {txHash}
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Track Title</label>
              <input
                required
                className="w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                placeholder="e.g. Midnight in Memphis"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">Artist Name</label>
              <input
                required
                className="w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                placeholder="e.g. J. Cole"
                value={artist}
                onChange={e => setArtist(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              MusicBrainz MBID (Recording ID)
            </label>
            <div className="flex gap-2">
              <input
                required
                className="flex-1 bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none font-mono"
                placeholder="e.g. f980fc14-e29b-481d-ad3a-5ed9b4ab6340"
                value={mbid}
                onChange={e => setMbid(e.target.value)}
              />
              <button
                type="button"
                onClick={generateRandomMbid}
                className="px-3 bg-[var(--surface-2)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] rounded-[var(--radius)] transition-colors border border-[var(--border)]"
              >
                Generate ID
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              Upload Audio File (.mp3, .wav, .flac)
            </label>
            <input
              id="audio-upload-input"
              type="file"
              accept="audio/*"
              required
              className="w-full bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none file:mr-4 file:py-1 file:px-3 file:rounded-[var(--radius)] file:border-0 file:text-[12px] file:font-semibold file:bg-[var(--bg-accent)] file:text-[var(--text-accent)] file:hover:opacity-85 cursor-pointer"
              onChange={e => setAudioFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* Contributors Section */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[13px] font-medium text-[var(--text-primary)]">Contributor Splits & Wallets</h3>
              <button
                type="button"
                onClick={handleAddContributor}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-accent)] text-[12px] font-medium text-[var(--text-accent)] hover:opacity-85 rounded-[var(--radius)] transition-opacity"
              >
                <IconPlus size={13} />
                Add Contributor
              </button>
            </div>

            <div className="space-y-3">
              {contributors.map((contrib, idx) => (
                <div key={idx} className="flex gap-2.5 items-end bg-[var(--surface-1)] border border-[var(--border)] rounded-lg p-3">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Name</label>
                        <input
                          required
                          className="w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-[var(--radius)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none"
                          placeholder="Name"
                          value={contrib.name}
                          onChange={e => handleUpdateContributor(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Role</label>
                        <select
                          className="w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-[var(--radius)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none"
                          value={contrib.role}
                          onChange={e => handleUpdateContributor(idx, 'role', e.target.value)}
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Split (BPS / %)</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            required
                            type="number"
                            min="0"
                            max="10000"
                            className="w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-[var(--radius)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none"
                            placeholder="bps"
                            value={contrib.bps}
                            onChange={e => handleUpdateContributor(idx, 'bps', parseInt(e.target.value) || 0)}
                          />
                          <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                            ({((contrib.bps || 0) / 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[var(--text-muted)] mb-1">Receiver Wallet Address</label>
                      <input
                        required
                        className="w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-[var(--radius)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none font-mono"
                        placeholder="0x..."
                        value={contrib.walletAddress}
                        onChange={e => handleUpdateContributor(idx, 'walletAddress', e.target.value)}
                      />
                    </div>
                  </div>

                  {contributors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(idx)}
                      className="p-2 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] text-red-400 rounded-lg hover:bg-[rgba(239,68,68,0.12)] transition-colors mb-[1px]"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Allocation indicator */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex justify-between items-center text-[12px] mb-2">
              <span className="text-[var(--text-secondary)] font-medium">Total Split Allocated:</span>
              <span className={`font-semibold ${isBpsValid ? 'text-[var(--text-success)]' : 'text-amber-400'}`}>
                {totalBps} / 10000 BPS ({(totalBps / 100).toFixed(1)}%)
              </span>
            </div>
            
            <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isBpsValid
                    ? 'bg-[var(--bg-success)]'
                    : totalBps > 10000
                      ? 'bg-red-500'
                      : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min((totalBps / 10000) * 100, 100)}%` }}
              />
            </div>
            
            {totalBps !== 10000 && (
              <p className="text-[11px] text-amber-400/85 mt-1.5 flex items-center gap-1">
                <IconAlertTriangle size={12} />
                Split allocation must equal exactly 10,000 basis points (100.00%) to write to the blockchain.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !title || !artist || !mbid || !isBpsValid}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-accent)] text-[var(--text-accent)] disabled:bg-[var(--surface-2)] disabled:text-[var(--text-muted)] disabled:border-transparent font-medium rounded-[var(--radius)] text-[13px] hover:opacity-85 transition-opacity"
            style={{
              background: (!loading && isBpsValid && title && artist && mbid) ? 'linear-gradient(135deg, #00C2FF 0%, #A89EFF 100%)' : undefined,
              color: (!loading && isBpsValid && title && artist && mbid) ? 'white' : undefined,
            }}
          >
            {loading ? (
              <>
                <IconLoader2 className="animate-spin" size={14} />
                Submitting to Arc Testnet...
              </>
            ) : (
              'Register Splits On-Chain'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
