'use client';
import React, { useEffect, useRef } from 'react';
import { usePlayback } from '../../context/PlaybackContext';

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string; sub: string }> = {
  artist:           { fill: '#EEEDFE', stroke: '#AFA9EC', text: '#3C3489', sub: '#534AB7' },
  producer:         { fill: '#E1F5EE', stroke: '#5DCAA5', text: '#085041', sub: '#0F6E56' },
  featured_artist:  { fill: '#FAEEDA', stroke: '#EF9F27', text: '#633806', sub: '#854F0B' },
  composer:         { fill: '#FAEEDA', stroke: '#EF9F27', text: '#633806', sub: '#854F0B' },
  mixer:            { fill: '#FAECE7', stroke: '#F0997B', text: '#712B13', sub: '#993C1D' },
  session_musician: { fill: '#FAECE7', stroke: '#F0997B', text: '#712B13', sub: '#993C1D' },
  other:            { fill: '#f3f3f7', stroke: '#ccc',    text: '#555',    sub: '#888'    },
};

function roleLabel(role: string) {
  return role?.replace('_', ' ') || 'contributor';
}

function renderGraph(svg: SVGSVGElement, nodes: any[], edges: any[], splits: any[], liveContribs: Record<string, any>) {
  svg.innerHTML = '';
  if (!nodes.length) return;

  const W = svg.clientWidth || 600;
  const H = 280;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Layout: simple horizontal rows by role priority
  const ROLE_ORDER = ['artist','producer','featured_artist','composer','mixer','session_musician','other'];
  const grouped: Record<string, any[]> = {};
  for (const n of nodes) {
    const r = n.role || 'other';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(n);
  }

  const rows = ROLE_ORDER.filter(r => grouped[r]?.length);
  const rowH = Math.min(H / (rows.length + 1), 70);
  const positions: Record<string, { x: number; y: number }> = {};

  rows.forEach((role, ri) => {
    const group = grouped[role];
    const y = rowH * (ri + 1);
    group.forEach((n, ni) => {
      const x = (W / (group.length + 1)) * (ni + 1);
      positions[n.mbid] = { x, y };
    });
  });

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arr');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '8'); marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '5');
  marker.setAttribute('orient', 'auto-start-reverse');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M2 1L8 5L2 9');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#AFA9EC');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Draw edges
  for (const e of edges) {
    const from = positions[e.from];
    const to = positions[e.to];
    if (!from || !to) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y));
    line.setAttribute('stroke', '#AFA9EC');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('marker-end', 'url(#arr)');
    svg.appendChild(line);
  }

  // Draw nodes
  for (const n of nodes) {
    const pos = positions[n.mbid];
    if (!pos) continue;
    const colors = NODE_COLORS[n.role] || NODE_COLORS.other;
    const split = splits.find((s: any) => s.mbid === n.mbid);
    const live = liveContribs[n.mbid];
    const bpsPct = split ? `${((split.bps / 10000) * 100).toFixed(0)}%` : '';
    const liveAmt = live ? ` $${live.amount}` : '';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(pos.x - 80));
    rect.setAttribute('y', String(pos.y - 22));
    rect.setAttribute('width', '160');
    rect.setAttribute('height', '44');
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', colors.fill);
    rect.setAttribute('stroke', colors.stroke);
    rect.setAttribute('stroke-width', '0.5');
    if (n.is_escrow) rect.setAttribute('stroke-dasharray', '4 2');

    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    name.setAttribute('x', String(pos.x));
    name.setAttribute('y', String(pos.y - 6));
    name.setAttribute('text-anchor', 'middle');
    name.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    name.setAttribute('font-size', '12');
    name.setAttribute('font-weight', '500');
    name.setAttribute('fill', colors.text);
    name.textContent = n.name;

    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('x', String(pos.x));
    sub.setAttribute('y', String(pos.y + 10));
    sub.setAttribute('text-anchor', 'middle');
    sub.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    sub.setAttribute('font-size', '10');
    sub.setAttribute('fill', colors.sub);
    sub.textContent = `${roleLabel(n.role)}${bpsPct ? ' · ' + bpsPct : ''}${liveAmt}`;

    g.appendChild(rect);
    g.appendChild(name);
    g.appendChild(sub);
    svg.appendChild(g);
  }
}

export default function GraphPage() {
  const { graph, trackMbid, trackTitle, trackArtist, contributors } = usePlayback();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!graph?.nodes?.length) { svgRef.current.innerHTML = ''; return; }
    renderGraph(svgRef.current, graph.nodes, graph.edges || [], graph.splits || [], contributors);
  }, [graph, contributors]);

  return (
    <div>
      <div className="pp-card mb-[14px]">
        <div className="pp-card-title">
          Provenance graph — {trackTitle || (trackMbid ? `MBID ${trackMbid.slice(0,8)}…` : 'No track playing')}
        </div>
        {!graph ? (
          <div className="py-16 text-center">
            <p className="text-[13px] text-[var(--text-muted)]">
              {trackMbid ? 'Building graph from MusicBrainz…' : 'Play a track from the Library to see its provenance graph.'}
            </p>
          </div>
        ) : (
          <svg ref={svgRef} width="100%" style={{ display: 'block', minHeight: 280 }} aria-label="Provenance graph" />
        )}
        <div className="flex gap-4 mt-3 text-[11px] text-[var(--text-muted)]">
          {Object.entries(NODE_COLORS).slice(0, 6).map(([role, c]) => (
            <div key={role} className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c.fill, border: `1px solid ${c.stroke}` }} />
              {roleLabel(role)}
            </div>
          ))}
        </div>
      </div>

      {graph && (
        <div className="pp-card">
          <div className="pp-card-title">Source metadata — read from MusicBrainz API</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            {graph.nodes?.map((n: any) => (
              <div key={n.mbid}>
                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 120, display: 'inline-block' }}>
                  {n.role?.replace('_', ' ')}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{n.name}</span>
                {'  '}
                <span style={{ color: 'var(--text-accent)' }}>{n.mbid}</span>
              </div>
            ))}
            {trackMbid && (
              <div>
                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 120, display: 'inline-block' }}>
                  MBID
                </span>
                <span style={{ color: 'var(--text-accent)' }}>{trackMbid}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
