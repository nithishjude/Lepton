import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import EventEmitter from 'eventemitter3';
import { db } from './db/index.js';
import { buildProvenanceGraph } from './mb-graph-builder.js';
import { PaymentDispatcher } from './payment-dispatcher.js';
import multer from 'multer';
import fs from 'fs';
import { join } from 'path';
import { createPublicClient, createWalletClient, http, stringToHex, pad } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const rpcUrl = "https://rpc.testnet.arc.network";
const publicClient = createPublicClient({
  transport: http(rpcUrl),
});

const deployerPk = process.env.DEPLOYER_PRIVATE_KEY;
const pkHex = deployerPk ? (deployerPk.startsWith("0x") ? deployerPk : `0x${deployerPk}`) : null;
const account = pkHex ? privateKeyToAccount(pkHex) : null;
const walletClient = pkHex ? createWalletClient({ account, transport: http(rpcUrl) }) : null;

const PROVENANCE_REGISTRY_ADDRESS = process.env.PROVENANCE_REGISTRY_ADDRESS;

const provenanceRegistryAbi = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "mbid", "type": "bytes32" },
      { "internalType": "address[]", "name": "wallets", "type": "address[]" },
      { "internalType": "uint16[]", "name": "bps", "type": "uint16[]" },
      { "internalType": "string[]", "name": "roles", "type": "string[]" }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "mbid", "type": "bytes32" }
    ],
    "name": "getSplits",
    "outputs": [
      {
        "components": [
          { "internalType": "address payable", "name": "wallet", "type": "address" },
          { "internalType": "uint16", "name": "basisPoints", "type": "uint16" }
        ],
        "internalType": "struct ProvenanceRegistry.Split[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "mbid", "type": "bytes32" }
    ],
    "name": "isRegistered",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "mbid", "type": "bytes32" },
      { "internalType": "address[]", "name": "newWallets", "type": "address[]" },
      { "internalType": "uint16[]", "name": "newBps", "type": "uint16[]" },
      { "internalType": "string[]", "name": "newRoles", "type": "string[]" },
      { "internalType": "string", "name": "reason", "type": "string" }
    ],
    "name": "proposeCorrection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "mbid", "type": "bytes32" }
    ],
    "name": "getCorrectionsCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "mbid", "type": "bytes32" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "getCorrection",
    "outputs": [
      { "internalType": "address[]", "name": "wallets", "type": "address[]" },
      { "internalType": "uint16[]", "name": "bps", "type": "uint16[]" },
      { "internalType": "string[]", "name": "roles", "type": "string[]" },
      { "internalType": "string", "name": "reason", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


const app = express();
app.use(cors());
app.use(bodyParser.json());

const paymentEventBus = new EventEmitter();
const dispatcher = new PaymentDispatcher(process.env.PLATFORM_WALLET_ID || process.env.PLATFORM_WALLET_ADDRESS);

// State
let activeTimers = {};
let activeIntervals = {};
let currentGraph = null;

// Runtime-configurable settings (can be updated via POST /api/config)
let sidecarConfig = {
  playGateMs: 15000,           // ms before payments start after play
  trackRatePerSecond: 0.0001,  // USDC per second of playback
  batchIntervalMs: 15000,       // payment dispatch interval in ms
  autoProvisionWallets: true,  // auto-create Circle wallets for unknown artists
  beetsMetadataSync: true,     // read Beets MBID tags
  musicbrainzLookup: true,     // query MusicBrainz REST API
  x402StreamGating: true,      // x402 gating on stream endpoints
};

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
      currentGraph.trackMbid = trackMbid; // tag so SSE can match late subscribers
      paymentEventBus.emit('graph_ready', { trackId: trackMbid, graph: currentGraph });
    } catch (e) {
      console.error('Failed to build graph:', e.message);
      return res.status(500).send('Graph Error');
    }

    // 3. Start play-gate timer (duration controlled by sidecarConfig.playGateMs)
    activeTimers[trackMbid] = setTimeout(() => {
      console.log(`[Play-Gate] Cleared for ${trackMbid}. Starting payment loop...`);
      paymentEventBus.emit('gate_cleared', { trackId: trackMbid });
      
      // Dispatch tick at configurable interval
      activeIntervals[trackMbid] = setInterval(async () => {
        const confirmations = await dispatcher.dispatchTick(currentGraph, sidecarConfig.trackRatePerSecond);
        if (confirmations.length > 0) {
          paymentEventBus.emit('tick', { trackId: trackMbid, confirmations });
        }
      }, sidecarConfig.batchIntervalMs);

    }, sidecarConfig.playGateMs);
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

  // If graph already built for this track, push immediately to new subscriber (fixes race condition)
  if (currentGraph && (currentGraph.trackMbid === trackId || currentGraph.mbid === trackId)) {
    send({ type: 'graph_ready', graph: currentGraph });
  }

  req.on('close', () => {
    paymentEventBus.off('tick', onTick);
    paymentEventBus.off('gate_cleared', onGate);
    paymentEventBus.off('stopped', onStop);
    paymentEventBus.off('graph_ready', onGraph);
  });
});

const uploadDir = join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: 'public/audio/' });

app.post('/api/upload', upload.single('audio'), async (req, res) => {
  const { title, artist, mbid } = req.body;
  let splits;
  try {
    splits = JSON.parse(req.body.splits || '[]');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid splits JSON format' });
  }
  
  if (!title || !artist || !mbid || !splits || !Array.isArray(splits) || splits.length === 0) {
    return res.status(400).json({ error: 'Missing required fields or invalid splits data' });
  }

  try {
    // If a file was uploaded, move it to public/audio/[mbid].mp3
    if (req.file) {
      const targetPath = join(process.cwd(), 'public', 'audio', `${mbid}.mp3`);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      fs.renameSync(req.file.path, targetPath);
      console.log(`[Upload] Audio file saved to: ${targetPath}`);
    } else {
      console.warn(`[Upload] No audio file provided for track MBID: ${mbid}`);
    }

    // 1. Prepare Smart Contract parameters
    const cleanMbid = mbid.replace(/-/g, '').slice(0, 32);
    const mbidBytes32 = pad(stringToHex(cleanMbid), { size: 32 });

    const wallets = splits.map(s => s.walletAddress);
    const bpsList = splits.map(s => parseInt(s.bps));
    const roles = splits.map(s => s.role || 'contributor');

    let onChainTxHash = null;

    if (!account || !walletClient || !PROVENANCE_REGISTRY_ADDRESS) {
      console.warn('[SmartContract] Deployer credentials or contract address not set. Skipping on-chain registration.');
    } else {
      // Check if already registered in contract
      const isReg = await publicClient.readContract({
        address: PROVENANCE_REGISTRY_ADDRESS,
        abi: provenanceRegistryAbi,
        functionName: 'isRegistered',
        args: [mbidBytes32],
      });

      if (isReg) {
        console.warn(`[SmartContract] MBID ${mbid} is already registered on-chain.`);
      } else {
        console.log(`[SmartContract] Simulating registration on-chain for ${mbid}...`);
        const { request } = await publicClient.simulateContract({
          address: PROVENANCE_REGISTRY_ADDRESS,
          abi: provenanceRegistryAbi,
          functionName: 'register',
          args: [mbidBytes32, wallets, bpsList, roles],
          account,
        });

        console.log('[SmartContract] Sending transaction...');
        onChainTxHash = await walletClient.writeContract(request);
        console.log(`[SmartContract] Transaction broadcasted: ${onChainTxHash}`);

        // Wait for receipt
        await publicClient.waitForTransactionReceipt({ hash: onChainTxHash });
        console.log('[SmartContract] Transaction confirmed on Arc Testnet.');
      }
    }

    // 2. Insert/update contributors in local database
    for (const split of splits) {
      // Generate a mock MBID/UUID for each contributor if not provided
      const contributorMbid = split.mbid || `contrib-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
      split.mbid = contributorMbid; // map back for split reference
      
      db.prepare(`
        INSERT INTO contributors (id, mbid, name, wallet_address, wallet_id, is_provisioned, is_escrow)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, NULL, 1, 0)
        ON CONFLICT(mbid) DO UPDATE SET
          wallet_address = excluded.wallet_address,
          is_provisioned = 1,
          is_escrow = 0
      `).run(contributorMbid, split.name, split.walletAddress);
    }

    // 3. Assemble and save the Provenance Graph JSON
    const nodes = splits.map(s => ({
      mbid: s.mbid,
      name: s.name,
      role: s.role
    }));
    
    // Add primary artist if not already listed
    if (!nodes.find(n => n.role === 'artist')) {
      const primaryArtistMbid = `artist-${Math.random().toString(36).substring(2, 10)}`;
      nodes.push({ mbid: primaryArtistMbid, name: artist, role: 'artist' });
    }

    const edges = splits.map(s => ({
      from: s.mbid,
      to: mbid,
      relationship: s.role
    }));

    const finalSplits = splits.map(s => ({
      mbid: s.mbid,
      name: s.name,
      bps: parseInt(s.bps),
      walletAddress: s.walletAddress
    }));

    const graph = {
      mbid,
      title,
      artist,
      nodes,
      edges,
      splits: finalSplits
    };

    db.prepare(`
      INSERT OR REPLACE INTO provenance_graphs (mbid, graph_json, arc_tx_hash)
      VALUES (?, ?, ?)
    `).run(mbid, JSON.stringify(graph), onChainTxHash);

    res.json({
      success: true,
      mbid,
      onChainTxHash,
      graph
    });

  } catch (err) {
    console.error('[Upload API] Error registering split:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const { title, artist } = req.query;
  if (!title && !artist) return res.json([]);
  
  try {
    let queryParts = [];
    if (title) queryParts.push(`recording:"${title}"`);
    if (artist) queryParts.push(`artist:"${artist}"`);
    const queryStr = queryParts.join(' AND ');

    const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(queryStr)}&limit=10&fmt=json`;
    const headers = {
      'User-Agent': `${process.env.MUSICBRAINZ_APP_NAME}/${process.env.MUSICBRAINZ_APP_VERSION} ( ${process.env.MUSICBRAINZ_CONTACT} )`
    };
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('MusicBrainz search API error');
    const data = await response.json();
    
    const results = (data.recordings || []).map(r => {
      const art = r['artist-credit']?.map(c => c.name).join(', ') || 'Unknown Artist';
      return {
        mbid: r.id,
        title: r.title,
        artist: art,
      };
    });
    res.json(results);
  } catch (err) {
    console.error('[Search API] Error searching MusicBrainz:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/track/:mbid/provenance', async (req, res) => {
  try {
    const graph = await buildProvenanceGraph(req.params.mbid);
    res.json(graph);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stream/:mbid', async (req, res) => {
  const { mbid } = req.params;
  const { txHash } = req.query;

  // 1. If txHash is missing, return 402 Payment Required
  if (!txHash) {
    return res.status(402).json({
      accepts: [
        {
          scheme: "exact",
          network: "arc-testnet",
          amount: "1000000000000000", // 0.001 USDC (18 decimals on Arc)
          currency: "USDC",
          recipient: process.env.PLATFORM_WALLET_ADDRESS
        }
      ]
    });
  }

  // 2. Verify transaction on-chain via publicClient
  try {
    const tx = await publicClient.getTransaction({ hash: txHash });
    
    // Verify recipient address matches platform wallet
    const platformAddress = process.env.PLATFORM_WALLET_ADDRESS || '';
    if (tx.to?.toLowerCase() !== platformAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Invalid recipient wallet' });
    }

    // Verify value is at least 0.001 USDC (10^15 Wei)
    const requiredAmount = 1000000000000000n; // 10^15 Wei
    if (tx.value < requiredAmount) {
      return res.status(403).json({ error: 'Insufficient payment amount' });
    }

    // Serve the audio file
    const filePath = join(process.cwd(), 'public', 'audio', `${mbid}.mp3`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Audio file not found' });
    }
  } catch (err) {
    console.error('[x402] On-chain verification failed:', err.message);
    res.status(402).json({
      error: 'On-chain transaction verification failed',
      accepts: [
        {
          scheme: "exact",
          network: "arc-testnet",
          amount: "1000000000000000",
          currency: "USDC",
          recipient: process.env.PLATFORM_WALLET_ADDRESS
        }
      ]
    });
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

// Config: GET current settings
app.get('/api/config', (req, res) => {
  res.json(sidecarConfig);
});

// Config: POST to update settings
app.post('/api/config', (req, res) => {
  const allowed = ['playGateMs','trackRatePerSecond','batchIntervalMs','autoProvisionWallets','beetsMetadataSync','musicbrainzLookup','x402StreamGating'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      sidecarConfig[key] = req.body[key];
    }
  }
  console.log('[Config] Updated:', sidecarConfig);
  res.json({ ok: true, config: sidecarConfig });
});

// Recent transactions
app.get('/api/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const rows = db.prepare(`
    SELECT t.id, t.track_mbid, t.contributor_mbid, t.amount_usdc, t.nanopay_ref, t.arc_batch_hash,
           strftime('%Y-%m-%dT%H:%M:%SZ', t.tick_at) as tick_at,
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

  // Query all graphs to extract splits & roles
  const graphs = db.prepare('SELECT graph_json FROM provenance_graphs').all();
  const contribInfo = {};
  for (const g of graphs) {
    try {
      const graphObj = JSON.parse(g.graph_json);
      if (graphObj.splits) {
        for (const s of graphObj.splits) {
          contribInfo[s.mbid] = {
            bps: s.bps,
            role: graphObj.nodes?.find(n => n.mbid === s.mbid)?.role || 'contributor'
          };
        }
      }
    } catch {}
  }

  const result = rows.map(r => {
    const info = contribInfo[r.mbid] || {};
    return {
      ...r,
      role: info.role || 'contributor',
      bps: info.bps || 0
    };
  });

  res.json(result);
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

app.post('/api/claim', async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing walletAddress' });
  }

  try {
    const contrib = db.prepare('SELECT wallet_id, mbid FROM contributors WHERE wallet_address = ? AND is_escrow = 1').get(walletAddress);
    if (!contrib || !contrib.wallet_id) {
      return res.status(400).json({ error: 'No escrow wallet found for this connected address.' });
    }

    const { initiateDeveloperControlledWalletsClient } = await import('@circle-fin/developer-controlled-wallets');
    const client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    });

    // 1. Get escrow token balance
    const balRes = await client.getWalletTokenBalance({ id: contrib.wallet_id });
    const usdc = balRes.data?.tokenBalances?.find(t => t.token?.symbol === 'USDC');
    if (!usdc || parseFloat(usdc.amount) <= 0) {
      return res.status(400).json({ error: 'Escrow wallet is empty. No funds to claim.' });
    }

    const amount = usdc.amount;
    const tokenId = usdc.token.id;

    // 2. Transfer from escrow wallet to user's connected wallet address
    console.log(`[Claim] Transferring ${amount} USDC from escrow wallet ${contrib.wallet_id} to ${walletAddress}...`);
    const txRes = await client.createTransaction({
      walletId: contrib.wallet_id,
      tokenId: tokenId,
      destinationAddress: walletAddress,
      amounts: [amount],
      fee: { type: 'level', config: { feeLevel: 'LOW' } }
    });

    const txId = txRes.data?.id;
    let txHash = txRes.data?.txHash;

    // Poll for real on-chain transaction hash from Circle
    let retries = 8;
    while (!txHash && retries > 0) {
      console.log(`[Claim] Transaction ${txId} is pending on-chain broadcast. Polling...`);
      await new Promise(r => setTimeout(r, 1500));
      try {
        const checkRes = await client.getTransaction({ id: txId });
        txHash = checkRes.data?.transaction?.txHash;
      } catch (err) {
        console.warn('[Claim] Error polling transaction status:', err.message);
      }
      retries--;
    }

    const finalTxHash = txHash || ('0x' + txId.replace(/-/g, '').padEnd(64, '0'));

    // 3. Update contributor status
    db.prepare('UPDATE contributors SET is_escrow = 0 WHERE mbid = ?').run(contrib.mbid);
    
    // Write dynamic confirmation tick for claim to payment_ticks
    db.prepare(`
      INSERT INTO payment_ticks (id, track_mbid, contributor_mbid, amount_usdc, nanopay_ref, arc_batch_hash)
      VALUES (lower(hex(randomblob(16))), 'claim-payout', ?, ?, ?, ?)
    `).run(contrib.mbid, amount, txId, finalTxHash);

    res.json({
      success: true,
      txHash,
      amount
    });
  } catch (err) {
    console.error('[Claim API] Error claiming escrow:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/correction', async (req, res) => {
  const { mbid, splits, reason } = req.body;
  if (!mbid || !splits || !splits.length || !reason) {
    return res.status(400).json({ error: 'Missing mbid, splits, or reason' });
  }

  try {
    const hexMbid = pad(stringToHex(mbid, { size: 32 }), { size: 32, dir: 'right' });
    const wallets = splits.map(s => s.walletAddress);
    const bps = splits.map(s => parseInt(s.bps));
    const roles = splits.map(s => s.role);

    console.log('[Correction API] Simulating proposeCorrection on-chain...');
    let onChainTxHash = null;

    if (walletClient) {
      const { request } = await publicClient.simulateContract({
        address: PROVENANCE_REGISTRY_ADDRESS,
        abi: provenanceRegistryAbi,
        functionName: 'proposeCorrection',
        args: [hexMbid, wallets, bps, roles, reason],
        account
      });

      console.log('[Correction API] Submitting proposeCorrection to Arc Testnet...');
      onChainTxHash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash: onChainTxHash });
      console.log('[Correction API] ProposeCorrection confirmed.');
    }

    const correctionIdStr = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    db.prepare(`
      INSERT INTO corrections (id, track_mbid, correction_json, arc_tx_hash, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(correctionIdStr, mbid, JSON.stringify(splits), onChainTxHash || '', reason);

    res.json({
      success: true,
      onChainTxHash,
      id: correctionIdStr
    });
  } catch (err) {
    console.error('[Correction API] Error proposing correction:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/track/:mbid/corrections', (req, res) => {
  const { mbid } = req.params;
  try {
    const rows = db.prepare(`
      SELECT id, track_mbid, correction_json, arc_tx_hash, reason,
             strftime('%Y-%m-%dT%H:%M:%SZ', created_at) as created_at
      FROM corrections
      WHERE track_mbid = ?
      ORDER BY created_at DESC
    `).all(mbid);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contributor/:walletOrMbid', (req, res) => {
  const { walletOrMbid } = req.params;
  try {
    const contrib = db.prepare(`
      SELECT mbid, name, wallet_address, wallet_id, is_escrow, is_provisioned,
             (SELECT COALESCE(SUM(amount_usdc), 0) FROM payment_ticks WHERE contributor_mbid = c.mbid) as total_earned,
             (SELECT COUNT(DISTINCT nanopay_ref) FROM payment_ticks WHERE contributor_mbid = c.mbid) as tx_count
      FROM contributors c
      WHERE c.wallet_address = ? OR c.mbid = ?
    `).get(walletOrMbid, walletOrMbid);

    if (!contrib) {
      return res.status(404).json({ error: 'Contributor not found' });
    }

    const allGraphs = db.prepare('SELECT mbid, graph_json FROM provenance_graphs').all();
    const tracks = [];
    for (const g of allGraphs) {
      const graph = JSON.parse(g.graph_json);
      const split = graph.splits?.find(s => s.mbid === contrib.mbid || s.walletAddress?.toLowerCase() === contrib.wallet_address?.toLowerCase());
      if (split) {
        tracks.push({
          mbid: g.mbid,
          title: graph.title,
          artist: graph.artist,
          bps: split.bps,
          role: graph.nodes?.find(n => n.mbid === contrib.mbid)?.role || 'contributor'
        });
      }
    }

    const ticks = db.prepare(`
      SELECT amount_usdc, strftime('%Y-%m-%dT%H:%M:%SZ', tick_at) as tick_at
      FROM payment_ticks
      WHERE contributor_mbid = ?
      ORDER BY tick_at ASC
    `).all(contrib.mbid);

    res.json({
      contributor: contrib,
      tracks,
      ticks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.SIDECAR_PORT || 3001;
app.listen(port, () => {
  console.log(`Provenance Pay Sidecar running on port ${port}`);
});
