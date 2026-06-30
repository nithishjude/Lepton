'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePlayback } from '../../context/PlaybackContext';
import { IconRefresh } from '@tabler/icons-react';

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

function renderGraph(
  svg: SVGSVGElement,
  nodes: any[],
  edges: any[],
  splits: any[],
  liveContribs: Record<string, any>
) {
  svg.innerHTML = '';
  if (!nodes.length) return;

  const W = svg.clientWidth || 700;
  const ROLE_ORDER = ['artist', 'producer', 'featured_artist', 'composer', 'mixer', 'session_musician', 'other'];
  const grouped: Record<string, any[]> = {};
  for (const n of nodes) {
    const r = n.role || 'other';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(n);
  }

  const rows = ROLE_ORDER.filter(r => grouped[r]?.length);
  const ROW_H = 90;
  const H = ROW_H * (rows.length + 1);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', String(H));

  const positions: Record<string, { x: number; y: number }> = {};
  rows.forEach((role, ri) => {
    const group = grouped[role];
    const y = ROW_H * (ri + 1);
    group.forEach((n, ni) => {
      const x = (W / (group.length + 1)) * (ni + 1);
      positions[n.mbid] = { x, y };
    });
  });

  // defs: arrow marker + glow filter
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

  // Edges
  for (const e of edges) {
    const from = positions[e.from];
    const to = positions[e.to];
    if (!from || !to) continue;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    // shorten endpoints by node half-width
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

  // Nodes
  for (const n of nodes) {
    const pos = positions[n.mbid];
    if (!pos) continue;
    const colors = NODE_COLORS[n.role] || NODE_COLORS.other;
    const split = splits.find((s: any) => s.mbid === n.mbid);
    const live = liveContribs[n.mbid];
    const bpsPct = split ? `${((split.bps / 10000) * 100).toFixed(1)}%` : '';
    const liveAmt = live ? ` · $${parseFloat(live.amount).toFixed(4)}` : '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Glow ring for live contributors
    if (live) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      glow.setAttribute('x', String(pos.x - 84)); glow.setAttribute('y', String(pos.y - 26));
      glow.setAttribute('width', '168'); glow.setAttribute('height', '52');
      glow.setAttribute('rx', '10');
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', colors.stroke);
      glow.setAttribute('stroke-width', '2');
      glow.setAttribute('opacity', '0.4');
      glow.setAttribute('filter', 'url(#glow)');
      g.appendChild(glow);
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
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
    sub.setAttribute('x', String(pos.x)); sub.setAttribute('y', String(pos.y + 13));
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    sub.setAttribute('font-size', '10');
    sub.setAttribute('fill', colors.sub);
    sub.textContent = `${roleLabel(n.role)}${bpsPct ? ' · ' + bpsPct : ''}${liveAmt}`;

    g.appendChild(rect); g.appendChild(name); g.appendChild(sub);
    svg.appendChild(g);
  }
}

export default function GraphPage() {
  const { graph, trackMbid, trackTitle, contributors } = usePlayback();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [manualGraph, setManualGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Use context graph OR manually fetched graph
  const activeGraph = graph || manualGraph;

  // Re-render graph when data or size changes
  const draw = () => {
    if (!svgRef.current || !activeGraph?.nodes?.length) {
      if (svgRef.current) svgRef.current.innerHTML = '';
      return;
    }
    renderGraph(svgRef.current, activeGraph.nodes, activeGraph.edges || [], activeGraph.splits || [], contributors);
  };

  useEffect(() => { draw(); }, [activeGraph, contributors]);

  // ResizeObserver — redraw when container width changes
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [activeGraph, contributors]);

  // Fallback: if trackMbid is set but no graph arrived via SSE (race condition recovery)
  useEffect(() => {
    if (!trackMbid || activeGraph) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/track/${trackMbid}/provenance`)
      .then(r => r.json())
      .then(g => { setManualGraph(g); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trackMbid, activeGraph]);

  // Auto-load most recent track graph if nothing is currently playing
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

  // Reset manual graph when track changes
  useEffect(() => { setManualGraph(null); }, [trackMbid]);

  const refetch = () => {
    if (!trackMbid) return;
    setLoading(true);
    fetch(`http://localhost:3001/api/track/${trackMbid}/provenance`)
      .then(r => r.json())
      .then(g => { setManualGraph(g); setLoading(false); })
      .catch(() => setLoading(false));
  };

  return (
    <div>
      <div className="pp-card mb-[14px]">
        <div className="flex items-center justify-between pp-card-title mb-3">
          <span>
            Provenance graph —{' '}
            {trackTitle || (trackMbid ? `MBID ${trackMbid.slice(0, 8)}…` : 'No track playing')}
          </span>
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

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {Object.entries(NODE_COLORS).slice(0, 6).map(([role, c]) => (
            <div key={role} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: c.fill, border: `1.5px solid ${c.stroke}` }} />
              {roleLabel(role)}
            </div>
          ))}
        </div>
      </div>

      {/* Source metadata */}
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
