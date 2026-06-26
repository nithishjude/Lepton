import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import EventEmitter from 'eventemitter3';
import { db } from './db/index.js';
import { buildProvenanceGraph } from './mb-graph-builder.js';
import { PaymentDispatcher } from './payment-dispatcher.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const paymentEventBus = new EventEmitter();
const dispatcher = new PaymentDispatcher(process.env.PLATFORM_WALLET_ADDRESS);

// State
let activeTimers = {};
let activeIntervals = {};
let currentGraph = null;

// The simulated "play-gate" threshold in milliseconds
const PLAY_GATE_MS = 15000;
const TRACK_RATE_PER_SECOND = 0.0001; // $0.0001 USDC per second

app.post('/webhook', async (req, res) => {
  const { event, trackId, mbid } = req.body;
  // Navidrome integration would normally extract MBID from file tags via Beets.
  // We'll pass it directly for the demo.
  const trackMbid = mbid || trackId;
  console.log(`[Webhook] Event: ${event}, Track MBID: ${trackMbid}`);

  if (event === 'play') {
    // 1. Clear existing
    if (activeTimers[trackMbid]) clearTimeout(activeTimers[trackMbid]);
    if (activeIntervals[trackMbid]) clearInterval(activeIntervals[trackMbid]);

    // 2. Fetch/Build Graph
    try {
      currentGraph = await buildProvenanceGraph(trackMbid);
      paymentEventBus.emit('graph_ready', { trackId: trackMbid, graph: currentGraph });
    } catch (e) {
      console.error('Failed to build graph:', e.message);
      return res.status(500).send('Graph Error');
    }

    // 3. Start 15s play-gate timer
    activeTimers[trackMbid] = setTimeout(() => {
      console.log(`[Play-Gate] Cleared for ${trackMbid}. Starting payment loop...`);
      paymentEventBus.emit('gate_cleared', { trackId: trackMbid });
      
      // Dispatch tick every 2 seconds
      activeIntervals[trackMbid] = setInterval(async () => {
        const confirmations = await dispatcher.dispatchTick(currentGraph, TRACK_RATE_PER_SECOND);
        if (confirmations.length > 0) {
          paymentEventBus.emit('tick', { trackId: trackMbid, confirmations });
        }
      }, 2000);

    }, PLAY_GATE_MS);
  }

  if (event === 'skip' || event === 'stop') {
    console.log(`[Webhook] Stop/Skip received for ${trackMbid}. Cancelling payments.`);
    if (activeTimers[trackMbid]) clearTimeout(activeTimers[trackMbid]);
    if (activeIntervals[trackMbid]) clearInterval(activeIntervals[trackMbid]);
    paymentEventBus.emit('stopped', { trackId: trackMbid });
  }

  res.json({ ok: true });
});

// SSE endpoint for the Next.js UI
app.get('/api/payments/stream', (req, res) => {
  const { trackId } = req.query;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const onTick = (data) => {
    if (data.trackId === trackId) send({ type: 'tick', ...data });
  };
  const onGate = (data) => {
    if (data.trackId === trackId) send({ type: 'gate_cleared' });
  };
  const onStop = (data) => {
    if (data.trackId === trackId) send({ type: 'stopped' });
  };
  const onGraph = (data) => {
    if (data.trackId === trackId) send({ type: 'graph_ready', graph: data.graph });
  };

  paymentEventBus.on('tick', onTick);
  paymentEventBus.on('gate_cleared', onGate);
  paymentEventBus.on('stopped', onStop);
  paymentEventBus.on('graph_ready', onGraph);

  req.on('close', () => {
    paymentEventBus.off('tick', onTick);
    paymentEventBus.off('gate_cleared', onGate);
    paymentEventBus.off('stopped', onStop);
    paymentEventBus.off('graph_ready', onGraph);
  });
});

app.get('/api/track/:mbid/provenance', async (req, res) => {
  try {
    const graph = await buildProvenanceGraph(req.params.mbid);
    res.json(graph);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/wallet/:address/balance', async (req, res) => {
  const address = req.params.address;
  try {
    // Try fetching real balance from Circle API
    const { initiateDeveloperControlledWalletsClient } = await import('@circle-fin/developer-controlled-wallets');
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    });
    // Find wallet by address
    const contrib = db.prepare('SELECT wallet_id FROM contributors WHERE wallet_address = ?').get(address);
    if (contrib?.wallet_id) {
      const balRes = await client.getWalletTokenBalance({ id: contrib.wallet_id });
      const usdc = balRes.data?.tokenBalances?.find(t => t.token?.symbol === 'USDC');
      if (usdc) return res.json({ balance: parseFloat(usdc.amount).toFixed(6), source: 'circle' });
    }
  } catch (e) {
    console.warn('[Balance] Circle API fallback:', e.message);
  }
  // Fallback: sum from local payment_ticks DB
  const row = db.prepare(`
    SELECT SUM(t.amount_usdc) as total
    FROM payment_ticks t
    JOIN contributors c ON t.contributor_mbid = c.mbid
    WHERE c.wallet_address = ?
  `).get(address);
  res.json({ balance: row?.total?.toFixed(6) || '0.000000', source: 'local' });
});

// Dashboard metrics
app.get('/api/metrics', (req, res) => {
  const totalPaid = db.prepare('SELECT COALESCE(SUM(amount_usdc),0) as total FROM payment_ticks').get();
  const txCount = db.prepare('SELECT COUNT(*) as count FROM payment_ticks').get();
  const contributorCount = db.prepare('SELECT COUNT(*) as count FROM contributors WHERE is_provisioned=1').get();
  const escrowCount = db.prepare('SELECT COUNT(*) as count FROM contributors WHERE is_escrow=1').get();
  const trackCount = db.prepare('SELECT COUNT(*) as count FROM provenance_graphs').get();
  res.json({
    totalPaid: parseFloat(totalPaid.total).toFixed(6),
    txCount: txCount.count,
    contributorCount: contributorCount.count,
    escrowCount: escrowCount.count,
    trackCount: trackCount.count,
  });
});

// Recent transactions
app.get('/api/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const rows = db.prepare(`
    SELECT t.id, t.track_mbid, t.contributor_mbid, t.amount_usdc, t.nanopay_ref, t.tick_at,
           c.name as contributor_name, c.wallet_address, c.is_escrow
    FROM payment_ticks t
    LEFT JOIN contributors c ON t.contributor_mbid = c.mbid
    ORDER BY t.tick_at DESC
    LIMIT ?
  `).all(limit);
  res.json(rows);
});

// All contributors / wallet splits
app.get('/api/contributors', (req, res) => {
  const rows = db.prepare(`
    SELECT c.mbid, c.name, c.wallet_address, c.wallet_id, c.is_escrow, c.is_provisioned,
           COALESCE(SUM(t.amount_usdc), 0) as total_earned,
           COUNT(t.id) as tx_count
    FROM contributors c
    LEFT JOIN payment_ticks t ON c.mbid = t.contributor_mbid
    GROUP BY c.mbid
    ORDER BY total_earned DESC
  `).all();
  res.json(rows);
});

// Top earning tracks 
app.get('/api/top-tracks', (req, res) => {
  const rows = db.prepare(`
    SELECT t.track_mbid, COALESCE(g.graph_json, '{}') as graph_json,
           SUM(t.amount_usdc) as total_earned, COUNT(DISTINCT t.id) as tick_count
    FROM payment_ticks t
    LEFT JOIN provenance_graphs g ON t.track_mbid = g.mbid
    GROUP BY t.track_mbid
    ORDER BY total_earned DESC
    LIMIT 10
  `).all();
  const result = rows.map(r => {
    let graph = {};
    try { graph = JSON.parse(r.graph_json); } catch {}
    const nodes = graph.nodes || [];
    const mainArtist = nodes.find(n => n.role === 'artist')?.name || r.track_mbid.slice(0,8);
    return {
      mbid: r.track_mbid,
      title: graph.title || `Track ${r.track_mbid.slice(0,8)}`,
      artist: mainArtist,
      totalEarned: parseFloat(r.total_earned).toFixed(6),
      tickCount: r.tick_count,
    };
  });
  res.json(result);
});

// Library - ingested tracks (from provenance_graphs)
app.get('/api/library', (req, res) => {
  const rows = db.prepare(`
    SELECT g.mbid, g.graph_json, g.arc_tx_hash,
           COUNT(DISTINCT t.contributor_mbid) as contributor_count,
           COALESCE(SUM(t.amount_usdc), 0) as total_paid,
           COUNT(DISTINCT CASE WHEN c.is_escrow=1 THEN c.mbid END) as escrow_count
    FROM provenance_graphs g
    LEFT JOIN payment_ticks t ON g.mbid = t.track_mbid
    LEFT JOIN contributors c ON t.contributor_mbid = c.mbid
    GROUP BY g.mbid
    ORDER BY total_paid DESC
  `).all();
  const result = rows.map(r => {
    let graph = {};
    try { graph = JSON.parse(r.graph_json); } catch {}
    const nodes = graph.nodes || [];
    const mainArtist = nodes.find(n => n.role === 'artist')?.name || 'Unknown Artist';
    const tags = nodes.map(n => n.role?.toUpperCase()).filter(Boolean).join(', ');
    return {
      mbid: r.mbid,
      title: graph.title || `Track ${r.mbid.slice(0,8)}`,
      artist: mainArtist,
      contributorCount: nodes.length,
      tags,
      totalPaid: parseFloat(r.total_paid).toFixed(6),
      escrowCount: r.escrow_count,
      arcTxHash: r.arc_tx_hash,
      graphReady: nodes.length > 0,
    };
  });
  res.json(result);
});

const port = process.env.SIDECAR_PORT || 3001;
app.listen(port, () => {
  console.log(`Provenance Pay Sidecar running on port ${port}`);
});
