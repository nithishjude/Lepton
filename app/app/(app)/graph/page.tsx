'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePlayback } from '../../context/PlaybackContext';
import { IconRefresh, IconAlertTriangle, IconSend, IconPlus, IconX } from '@tabler/icons-react';

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string; sub: string }> = {
  artist:           { fill: '#1a1833', stroke: '#7C6EEA', text: '#c4b8ff', sub: '#9d8fdb' },
  producer:         { fill: '#0d2420', stroke: '#3DB88A', text: '#6ee7c2', sub: '#4dc9a0' },
  featured_artist:  { fill: '#2a1e0a', stroke: '#D97706', text: '#fbbf24', sub: '#d97706' },
  composer:         { fill: '#2a1e0a', stroke: '#D97706', text: '#fbbf24', sub: '#d97706' },
  mixer:            { fill: '#2a0d0d', stroke: '#E05252', text: '#fca5a5', sub: '#f87171' },
  session_musician: { fill: '#2a0d0d', stroke: '#E05252', text: '#fca5a5', sub: '#f87171' },
  other:            { fill: '#151520', stroke: '#444',    text: '#888',    sub: '#666'    },
};

function roleLabel(role: string) {
  return role?.replace(/_/g, ' ') || 'contributor';
}

function spawnTickParticles(
  svg: SVGSVGElement,
  positions: Record<string, { x: number; y: number }>,
  edges: any[],
  splits: any[]
) {
  const listenerX = svg.clientWidth / 2 || 350;
  const listenerY = 50;
  const trackPos = positions['track'] || { x: listenerX, y: 130 };

  // 1. Particle from Listener to Track
  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  p1.setAttribute('r', '6');
  p1.setAttribute('fill', '#7C6EEA');
  p1.setAttribute('cx', String(listenerX));
  p1.setAttribute('cy', String(listenerY));
  p1.style.filter = 'drop-shadow(0px 0px 4px #7C6EEA)';
  p1.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  svg.appendChild(p1);

  setTimeout(() => {
    p1.setAttribute('cx', String(trackPos.x));
    p1.setAttribute('cy', String(trackPos.y));
    p1.setAttribute('r', '3');
  }, 30);

  setTimeout(() => {
    p1.remove();

    const trackRect = document.getElementById('rect-track');
    if (trackRect) {
      trackRect.setAttribute('stroke-width', '4');
      setTimeout(() => trackRect.setAttribute('stroke-width', '2'), 150);
    }

    edges.forEach(e => {
      const from = positions[e.from];
      const to = positions[e.to];
      if (!from || !to) return;

      const split = splits.find(s => s.mbid === e.from);
      const bps = split ? split.bps : 0;
      const radius = Math.max(3.5, 3.5 + (bps / 10000) * 5);

      const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      p2.setAttribute('r', String(radius));
      p2.setAttribute('fill', '#00C2FF');
      p2.setAttribute('cx', String(to.x));
      p2.setAttribute('cy', String(to.y));
      p2.style.filter = 'drop-shadow(0px 0px 4px #00C2FF)';
      p2.style.transition = 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      svg.appendChild(p2);

      setTimeout(() => {
        p2.setAttribute('cx', String(from.x));
        p2.setAttribute('cy', String(from.y));
        p2.setAttribute('opacity', '0.2');
      }, 30);

      setTimeout(() => {
        p2.remove();

        const card = document.getElementById(`rect-${e.from}`);
        if (card) {
          card.setAttribute('stroke-width', '3');
          setTimeout(() => card.setAttribute('stroke-width', '1'), 150);
        }
      }, 950);
    });
  }, 500);
}

function renderGraph(
  svg: SVGSVGElement,
  nodes: any[],
  edges: any[],
  splits: any[],
  liveContribs: Record<string, any>,
  trackMbid: string | null,
  trackTitle: string | null
) {
  svg.innerHTML = '';
  if (!nodes.length) return {};

  const W = svg.clientWidth || 700;
  const ROLE_ORDER = ['artist', 'producer', 'featured_artist', 'composer', 'mixer', 'session_musician', 'other'];
  const grouped: Record<string, any[]> = {};
  for (const n of nodes) {
    const r = n.role || 'other';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(n);
  }

  const rows = ROLE_ORDER.filter(r => grouped[r]?.length);
  const ROW_H = 100;
  const H = ROW_H * (rows.length + 1.6);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', String(H));

  const positions: Record<string, { x: number; y: number }> = {};
  
  if (trackMbid) {
    positions[trackMbid] = { x: W / 2, y: 130 };
    positions['track'] = { x: W / 2, y: 130 };
  }

  rows.forEach((role, ri) => {
    const group = grouped[role];
    const y = ROW_H * (ri + 1) + 140;
    group.forEach((n, ni) => {
      const x = (W / (group.length + 1)) * (ni + 1);
      positions[n.mbid] = { x, y };
    });
  });

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'glow');
  const feGaussian = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  feGaussian.setAttribute('stdDeviation', '3'); feGaussian.setAttribute('result', 'blur');
  const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
  const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  feMergeNode1.setAttribute('in', 'blur');
  const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  feMergeNode2.setAttribute('in', 'SourceGraphic');
  feMerge.appendChild(feMergeNode1); feMerge.appendChild(feMergeNode2);
  filter.appendChild(feGaussian); filter.appendChild(feMerge);
  defs.appendChild(filter);

  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arr');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '9'); marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M2 2L8 5L2 8');
  arrowPath.setAttribute('fill', 'none');
  arrowPath.setAttribute('stroke', 'rgba(124,110,234,0.6)');
  arrowPath.setAttribute('stroke-width', '1.5');
  arrowPath.setAttribute('stroke-linecap', 'round');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  const listenerPos = { x: W / 2, y: 50 };
  const trackPos = positions['track'] || { x: W / 2, y: 130 };
  const streamLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  streamLine.setAttribute('x1', String(listenerPos.x)); streamLine.setAttribute('y1', String(listenerPos.y + 23));
  streamLine.setAttribute('x2', String(trackPos.x)); streamLine.setAttribute('y2', String(trackPos.y - 23));
  streamLine.setAttribute('stroke', '#7C6EEA');
  streamLine.setAttribute('stroke-width', '2');
  streamLine.setAttribute('stroke-dasharray', '5 3');
  svg.appendChild(streamLine);

  for (const e of edges) {
    const from = positions[e.from];
    const to = positions[e.to];
    if (!from || !to) continue;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const pad = 85 / len;
    const x1 = from.x + dx * pad;
    const y1 = from.y + dy * pad;
    const x2 = to.x - dx * pad;
    const y2 = to.y - dy * pad;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', 'rgba(124,110,234,0.3)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('marker-end', 'url(#arr)');
    svg.appendChild(line);
  }

  const lg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const lrect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  lrect.setAttribute('x', String(listenerPos.x - 90)); lrect.setAttribute('y', '27');
  lrect.setAttribute('width', '180'); lrect.setAttribute('height', '46');
  lrect.setAttribute('rx', '9');
  lrect.setAttribute('fill', '#0B1528');
  lrect.setAttribute('stroke', '#7C6EEA');
  lrect.setAttribute('stroke-width', '2');
  
  const lname = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  lname.setAttribute('x', String(listenerPos.x)); lname.setAttribute('y', '45');
  lname.setAttribute('text-anchor', 'middle');
  lname.setAttribute('font-family', 'Inter, system-ui, sans-serif');
  lname.setAttribute('font-size', '12');
  lname.setAttribute('font-weight', '700');
  lname.setAttribute('fill', '#c4b8ff');
  lname.textContent = 'Active Listener';

  const lsub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  lsub.setAttribute('x', String(listenerPos.x)); lsub.setAttribute('y', '63');
  lsub.setAttribute('text-anchor', 'middle');
  lsub.setAttribute('font-family', 'Inter, system-ui, sans-serif');
  lsub.setAttribute('font-size', '9');
  lsub.setAttribute('fill', '#7C6EEA');
  lsub.textContent = 'ROUTING MICRO-PAYMENTS';

  lg.appendChild(lrect); lg.appendChild(lname); lg.appendChild(lsub);
  svg.appendChild(lg);

  for (const n of nodes) {
    const pos = positions[n.mbid];
    if (!pos) continue;
    const colors = NODE_COLORS[n.role] || NODE_COLORS.other;
    const split = splits.find((s: any) => s.mbid === n.mbid);
    const live = liveContribs[n.mbid];
    const bpsPct = split ? `${((split.bps / 10000) * 100).toFixed(1)}%` : '';
    const liveAmt = live ? ` · $${parseFloat(live.amount).toFixed(6)}` : '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    glow.setAttribute('id', `glow-${n.mbid}`);
    glow.setAttribute('x', String(pos.x - 84)); glow.setAttribute('y', String(pos.y - 26));
    glow.setAttribute('width', '168'); glow.setAttribute('height', '52');
    glow.setAttribute('rx', '10');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colors.stroke);
    glow.setAttribute('stroke-width', '2');
    glow.setAttribute('opacity', live ? '0.4' : '0');
    glow.setAttribute('filter', 'url(#glow)');
    g.appendChild(glow);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', `rect-${n.mbid}`);
    rect.setAttribute('x', String(pos.x - 80)); rect.setAttribute('y', String(pos.y - 23));
    rect.setAttribute('width', '160'); rect.setAttribute('height', '46');
    rect.setAttribute('rx', '9');
    rect.setAttribute('fill', colors.fill);
    rect.setAttribute('stroke', colors.stroke);
    rect.setAttribute('stroke-width', '1');
    if (n.is_escrow) rect.setAttribute('stroke-dasharray', '4 2');

    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    name.setAttribute('x', String(pos.x)); name.setAttribute('y', String(pos.y - 5));
    name.setAttribute('text-anchor', 'middle');
    name.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    name.setAttribute('font-size', '12.5');
    name.setAttribute('font-weight', '600');
    name.setAttribute('fill', colors.text);
    name.textContent = n.name;

    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('id', `sub-${n.mbid}`);
    sub.setAttribute('x', String(pos.x)); sub.setAttribute('y', String(pos.y + 13));
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    sub.setAttribute('font-size', '10');
    sub.setAttribute('fill', colors.sub);
    sub.textContent = `${roleLabel(n.role)}${bpsPct ? ' · ' + bpsPct : ''}${liveAmt}`;

    g.appendChild(rect); g.appendChild(name); g.appendChild(sub);
    svg.appendChild(g);
  }

  if (trackMbid) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', 'rect-track');
    rect.setAttribute('x', String(trackPos.x - 90)); rect.setAttribute('y', String(trackPos.y - 23));
    rect.setAttribute('width', '180'); rect.setAttribute('height', '46');
    rect.setAttribute('rx', '9');
    rect.setAttribute('fill', '#0a1d37');
    rect.setAttribute('stroke', '#00C2FF');
    rect.setAttribute('stroke-width', '2');
    
    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    name.setAttribute('x', String(trackPos.x)); name.setAttribute('y', String(trackPos.y - 5));
    name.setAttribute('text-anchor', 'middle');
    name.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    name.setAttribute('font-size', '12');
    name.setAttribute('font-weight', '700');
    name.setAttribute('fill', '#85E3FF');
    name.textContent = trackTitle || 'Active Track';

    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('x', String(trackPos.x)); sub.setAttribute('y', String(trackPos.y + 13));
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    sub.setAttribute('font-size', '9');
    sub.setAttribute('fill', '#00C2FF');
    sub.textContent = 'ON-CHAIN REGISTRY';

    g.appendChild(rect); g.appendChild(name); g.appendChild(sub);
    svg.appendChild(g);
  }

  return positions;
}

function CorrectedGraphCard({ correction }: { correction: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const splits = JSON.parse(correction.correction_json);
  
  const nodes = splits.map((s: any) => ({
    mbid: s.mbid,
    name: s.name,
    role: s.role
  }));
  const edges = splits.map((s: any) => ({
    from: s.mbid,
    to: correction.track_mbid,
    relationship: s.role
  }));

  useEffect(() => {
    if (svgRef.current) {
      renderGraph(
        svgRef.current,
        nodes,
        edges,
        splits,
        {},
        correction.track_mbid,
        'Corrected Split Registry'
      );
    }
  }, [correction]);

  return (
    <div className="bg-[#11111A] border border-gray-800 rounded-xl p-4 mt-3">
      <div className="flex justify-between items-center text-[12px] mb-2 font-mono pb-2 border-b border-gray-900">
        <span className="text-[#00C2FF] font-semibold flex items-center gap-1">✓ Active Correction</span>
        <span className="text-gray-500">Proposed {new Date(correction.created_at).toLocaleString()}</span>
      </div>
      <div className="text-[12px] text-gray-300 bg-[#07070F] p-2.5 rounded-lg border border-gray-900 mb-3">
        <span className="text-gray-500 uppercase tracking-wider font-semibold text-[9px] block mb-0.5">Reason for Correction</span>
        "{correction.reason}"
      </div>
      {correction.arc_tx_hash && (
        <div className="text-[11px] text-gray-500 font-mono mb-3 flex items-center gap-1.5">
          <span>On-Chain Tx:</span>
          <a
            href={`https://testnet.arcscan.app/tx/${correction.arc_tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00C2FF] hover:underline"
          >
            {correction.arc_tx_hash.slice(0, 24)}…
          </a>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <svg ref={svgRef} width="100%" className="min-h-[280px]" />
      </div>
    </div>
  );
}

export default function GraphPage() {
  const { graph, trackMbid, trackTitle, contributors, isPlaying, totalPaid } = usePlayback();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [manualGraph, setManualGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [corrections, setCorrections] = useState<any[]>([]);

  // Dispute form state
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [formSplits, setFormSplits] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const activeGraph = graph || manualGraph;
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const prevTotalPaidRef = useRef(0);

  const fetchCorrections = () => {
    if (!trackMbid) return;
    fetch(`http://localhost:3001/api/track/${trackMbid}/corrections`)
      .then(r => r.json())
      .then(data => setCorrections(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const draw = () => {
    if (!svgRef.current || !activeGraph?.nodes?.length) {
      if (svgRef.current) svgRef.current.innerHTML = '';
      return;
    }
    const positions = renderGraph(
      svgRef.current,
      activeGraph.nodes,
      activeGraph.edges || [],
      activeGraph.splits || [],
      contributors,
      activeGraph.mbid || trackMbid,
      activeGraph.title || trackTitle
    );
    positionsRef.current = positions;
  };

  useEffect(() => {
    draw();
    fetchCorrections();
  }, [activeGraph]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeGraph]);

  useEffect(() => {
    if (isPlaying && totalPaid > prevTotalPaidRef.current) {
      if (svgRef.current && activeGraph && positionsRef.current) {
        spawnTickParticles(svgRef.current, positionsRef.current, activeGraph.edges || [], activeGraph.splits || []);
      }
    }
    prevTotalPaidRef.current = totalPaid;
  }, [totalPaid, isPlaying, activeGraph]);

  useEffect(() => {
    if (!activeGraph) return;
    activeGraph.nodes.forEach((n: any) => {
      const live = contributors[n.mbid];
      if (live) {
        const textEl = document.getElementById(`sub-${n.mbid}`);
        if (textEl) {
          const split = activeGraph.splits.find((s: any) => s.mbid === n.mbid);
          const bpsPct = split ? `${((split.bps / 10000) * 100).toFixed(1)}%` : '';
          textEl.textContent = `${roleLabel(n.role)}${bpsPct ? ' · ' + bpsPct : ''} · $${parseFloat(live.amount).toFixed(6)}`;
        }
        const glow = document.getElementById(`glow-${n.mbid}`);
        if (glow) {
          glow.setAttribute('opacity', '0.4');
        }
      }
    });
  }, [contributors, activeGraph]);

  useEffect(() => {
    if (!trackMbid || activeGraph) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/track/${trackMbid}/provenance`)
      .then(r => r.json())
      .then(g => { setManualGraph(g); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trackMbid, activeGraph]);

  useEffect(() => {
    if (trackMbid || graph || manualGraph) return;
    setLoading(true);
    fetch('http://localhost:3001/api/library')
      .then(r => r.json())
      .then(tracks => {
        if (tracks && tracks.length > 0) {
          fetch(`http://localhost:3001/api/track/${tracks[0].mbid}/provenance`)
            .then(r2 => r2.json())
            .then(g => { setManualGraph(g); setLoading(false); })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [trackMbid, graph, manualGraph]);

  useEffect(() => { setManualGraph(null); }, [trackMbid]);

  const refetch = () => {
    if (!trackMbid) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/track/${trackMbid}/provenance`)
      .then(r => r.json())
      .then(g => { setManualGraph(g); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleOpenForm = () => {
    if (activeGraph?.splits) {
      setFormSplits(activeGraph.splits.map((s: any) => ({
        mbid: s.mbid,
        name: s.name,
        role: activeGraph.nodes.find((n: any) => n.mbid === s.mbid)?.role || 'artist',
        bps: s.bps,
        walletAddress: s.walletAddress
      })));
      setShowForm(true);
    }
  };

  const handleSplitChange = (index: number, key: string, val: any) => {
    const next = [...formSplits];
    next[index] = { ...next[index], [key]: val };
    setFormSplits(next);
  };

  const handleAddSplit = () => {
    setFormSplits([...formSplits, { mbid: `contrib-${Math.random().toString(36).substring(2, 8)}`, name: '', role: 'artist', bps: 0, walletAddress: '' }]);
  };

  const handleRemoveSplit = (index: number) => {
    setFormSplits(formSplits.filter((_, i) => i !== index));
  };

  const handleSubmitCorrection = () => {
    if (!reason) {
      alert('Please provide a reason for correction.');
      return;
    }
    const totalBps = formSplits.reduce((acc, s) => acc + parseInt(s.bps || 0), 0);
    if (totalBps !== 10000) {
      alert(`Basis points must sum to 10000 (currently ${totalBps})`);
      return;
    }

    setSubmitting(true);
    fetch('http://localhost:3001/api/correction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mbid: trackMbid, splits: formSplits, reason })
    })
      .then(r => r.json())
      .then(res => {
        setSubmitting(false);
        if (res.success) {
          setShowForm(false);
          setReason('');
          fetchCorrections();
        } else {
          alert(`Error: ${res.error || 'Failed to submit'}`);
        }
      })
      .catch((err) => {
        setSubmitting(false);
        alert(`Error: ${err.message}`);
      });
  };

  return (
    <div className="space-y-4">
      <div className="pp-card">
        <div className="flex items-center justify-between pp-card-title mb-3">
          <span>
            Provenance graph —{' '}
            {trackTitle || (trackMbid ? `MBID ${trackMbid.slice(0, 8)}…` : 'No track playing')}
            {corrections.length > 0 && (
              <span className="ml-2.5 text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Superseded — See Correction Below
              </span>
            )}
          </span>
          <div className="flex items-center gap-3">
            {isPlaying && (
              <span className="text-[12px] font-mono text-[#00C2FF] bg-[#00C2FF]/10 px-2.5 py-1 rounded-lg border border-[#00C2FF]/20 animate-pulse">
                Paid this session: ${totalPaid.toFixed(6)} USDC
              </span>
            )}
            {trackMbid && (
              <button
                onClick={handleOpenForm}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all"
              >
                <IconAlertTriangle size={12} />
                Propose Correction
              </button>
            )}
            {trackMbid && (
              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all"
                style={{ color: 'var(--text-accent)', background: 'var(--bg-accent)', opacity: loading ? 0.5 : 1 }}
              >
                <IconRefresh size={12} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Fetching…' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        {!activeGraph ? (
          <div className="py-16 text-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-accent)' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Building graph from MusicBrainz…
                </p>
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {trackMbid
                  ? 'Graph not yet available — click Refresh or play the track.'
                  : 'Play a track from the Library to see its provenance graph.'}
              </p>
            )}
          </div>
        ) : (
          <div ref={containerRef} style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              ref={svgRef}
              width="100%"
              style={{ display: 'block' }}
              aria-label="Provenance graph"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {Object.entries(NODE_COLORS).slice(0, 6).map(([role, c]) => (
            <div key={role} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: c.fill, border: `1.5px solid ${c.stroke}` }} />
              {roleLabel(role)}
            </div>
          ))}
        </div>
      </div>

      {/* Propose Correction Form Section */}
      {showForm && (
        <div className="pp-card border border-amber-500/25 bg-[#0F0F16]">
          <div className="flex justify-between items-center pb-2 border-b border-gray-900 mb-3">
            <span className="text-[14px] font-semibold text-amber-400 flex items-center gap-1.5">
              <IconAlertTriangle size={15} /> Propose On-Chain Splits Correction
            </span>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
              <IconX size={15} />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Reason for correction</label>
              <input
                type="text"
                placeholder="e.g. Updating split ratios after formal composition dispute resolution"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full text-[13px] bg-[#07070F] border border-gray-800 rounded-lg p-2.5 focus:outline-none focus:border-amber-500/50 text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-gray-500">
                <span>Contributor Splits & Wallets</span>
                <span>Total: {formSplits.reduce((acc, s) => acc + parseInt(s.bps || 0), 0)} / 10000 BPS (100.0%)</span>
              </div>

              {formSplits.map((s, idx) => (
                <div key={s.mbid} className="grid grid-cols-4 gap-2 bg-[#07070F] p-2.5 rounded-lg border border-gray-900 relative pr-8">
                  <div>
                    <input
                      type="text"
                      placeholder="Name"
                      value={s.name}
                      onChange={e => handleSplitChange(idx, 'name', e.target.value)}
                      className="w-full text-[12px] bg-[#1C1C24] border border-gray-800 rounded-md p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <select
                      value={s.role}
                      onChange={e => handleSplitChange(idx, 'role', e.target.value)}
                      className="w-full text-[12px] bg-[#1C1C24] border border-gray-800 rounded-md p-1.5 text-white"
                    >
                      {Object.keys(NODE_COLORS).slice(0, 6).map(r => (
                        <option key={r} value={r}>{roleLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="BPS (max 10000)"
                      value={s.bps}
                      onChange={e => handleSplitChange(idx, 'bps', e.target.value)}
                      className="w-full text-[12px] bg-[#1C1C24] border border-gray-800 rounded-md p-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Wallet Address"
                      value={s.walletAddress}
                      onChange={e => handleSplitChange(idx, 'walletAddress', e.target.value)}
                      className="w-full text-[12px] bg-[#1C1C24] border border-gray-800 rounded-md p-1.5 text-white font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveSplit(idx)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddSplit}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#1C1C24] hover:bg-[#252530] text-[12px] text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-all font-semibold"
              >
                <IconPlus size={13} /> Add Contributor
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmitCorrection}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-[12px] text-black font-bold rounded-lg transition-all"
          >
            <IconSend size={13} />
            {submitting ? 'Submitting On-Chain Proposal…' : 'Submit Correction Proposal'}
          </button>
        </div>
      )}

      {/* Corrections List Section */}
      {corrections.map((corr) => (
        <CorrectedGraphCard key={corr.id} correction={corr} />
      ))}

      {activeGraph && (
        <div className="pp-card">
          <div className="pp-card-title">Source metadata — MusicBrainz API</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
            {activeGraph.nodes?.map((n: any) => (
              <div key={n.mbid} className="flex gap-4">
                <span className="uppercase w-36 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {n.role?.replace(/_/g, ' ')}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{n.name}</span>
                <span className="ml-auto" style={{ color: 'var(--text-accent)' }}>{n.mbid}</span>
              </div>
            ))}
            {trackMbid && (
              <div className="flex gap-4 mt-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="uppercase w-36 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Track MBID</span>
                <span style={{ color: 'var(--text-accent)' }}>{trackMbid}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
