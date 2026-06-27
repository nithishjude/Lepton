import { db } from './db/index.js';

export async function buildProvenanceGraph(mbid) {
  // Check if we have it in DB first
  const existing = db.prepare('SELECT graph_json FROM provenance_graphs WHERE mbid = ?').get(mbid);
  if (existing) {
    return JSON.parse(existing.graph_json);
  }

  const url = `https://musicbrainz.org/ws/2/recording/${mbid}?inc=artists+artist-rels+work-rels&fmt=json`;
  
  const headers = {
    'User-Agent': `${process.env.MUSICBRAINZ_APP_NAME}/${process.env.MUSICBRAINZ_APP_VERSION} ( ${process.env.MUSICBRAINZ_CONTACT} )`
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`MusicBrainz API error: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  const nodes = [];
  const edges = [];

  // Primary artist credits
  if (data['artist-credit']) {
    for (const credit of data['artist-credit']) {
      if (credit.artist) {
        nodes.push({ mbid: credit.artist.id, name: credit.artist.name, role: 'artist' });
      }
    }
  }

  // Normalize role function
  const normalizeRole = (type) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('mix')) return 'mixer';
    if (typeLower.includes('instrument')) return 'session_musician';
    if (typeLower.includes('produce')) return 'producer';
    if (typeLower.includes('vocal')) return 'featured_artist';
    if (typeLower.includes('compose')) return 'composer';
    return 'other';
  };

  // Relationship-level credits
  if (data.relations) {
    for (const rel of data.relations) {
      if (rel['target-type'] === 'artist' && rel.artist) {
        const role = normalizeRole(rel.type);
        nodes.push({ mbid: rel.artist.id, name: rel.artist.name, role });
        edges.push({ from: rel.artist.id, to: data.id, relationship: rel.type });
      }
    }
  }

  // Deduplicate nodes
  const uniqueNodesMap = new Map();
  for (const n of nodes) {
    if (!uniqueNodesMap.has(n.mbid)) {
      uniqueNodesMap.set(n.mbid, n);
    }
  }
  const uniqueNodes = Array.from(uniqueNodesMap.values());

  const splits = computeSplits(uniqueNodes);

  // Capture real title from MusicBrainz response
  const realTitle = data.title || null;
  const primaryArtist = uniqueNodes.find(n => n.role === 'artist')?.name || null;

  const graph = { mbid, title: realTitle, artist: primaryArtist, nodes: uniqueNodes, edges, splits };
  
  db.prepare('INSERT OR IGNORE INTO provenance_graphs (mbid, graph_json) VALUES (?, ?)').run(mbid, JSON.stringify(graph));
  
  return graph;
}

function computeSplits(nodes) {
  // Default split logic based on PRD
  // artist: 35%, producer: 25%, featured_artist: 15%, composer: 10%, mixer: 8%, session_musician: 7%
  
  const roleWeights = {
    'artist': 3500,
    'producer': 2500,
    'featured_artist': 1500,
    'composer': 1000,
    'mixer': 800,
    'session_musician': 700
  };

  let totalAllocated = 0;
  const initialSplits = nodes.map(n => {
    const weight = roleWeights[n.role] || 0;
    return { ...n, bps: weight };
  });

  // Adjust logic: redistribute proportionally among matched roles.
  let currentTotal = initialSplits.reduce((acc, n) => acc + n.bps, 0);
  
  if (currentTotal === 0) {
     // Real implementation: if we found no credited roles with assigned weights, 
     // we cannot accurately split the royalties based on our contract.
     // In a production app we might have a default pool or reject.
     throw new Error("No recognized roles found for this track to compute splits.");
  }

  const normalizedSplits = initialSplits.map(n => {
    return {
      mbid: n.mbid,
      name: n.name,
      role: n.role,
      bps: Math.floor((n.bps / currentTotal) * 10000)
    };
  });

  // Fix rounding error to ensure exactly 10000
  const finalTotal = normalizedSplits.reduce((acc, s) => acc + s.bps, 0);
  if (finalTotal < 10000 && normalizedSplits.length > 0) {
    // Add remainder to the highest weighted contributor to minimize disparity
    normalizedSplits.sort((a, b) => b.bps - a.bps);
    normalizedSplits[0].bps += (10000 - finalTotal);
    // Restore original order
    normalizedSplits.sort((a, b) => initialSplits.findIndex(x => x.mbid === a.mbid) - initialSplits.findIndex(x => x.mbid === b.mbid));
  }

  return normalizedSplits.map(s => ({ mbid: s.mbid, name: s.name, bps: s.bps, walletAddress: null }));
}
