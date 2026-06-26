# Provenance Pay — Product Requirements Document

> **"Every second a track plays, every hand that made it gets paid."**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [The Idea in One Sentence](#the-idea-in-one-sentence)
4. [Why Now / Competitive Gap](#why-now--competitive-gap)
5. [Sponsor Technology Alignment](#sponsor-technology-alignment)
6. [System Architecture](#system-architecture)
7. [UI/UX Design Philosophy & Screens](#uiux-design-philosophy--screens)
8. [Feature Specification](#feature-specification)
9. [Technical Implementation Details](#technical-implementation-details)
10. [API Route Map](#api-route-map)
11. [Smart Contract Specification](#smart-contract-specification)
12. [Data Models](#data-models)
13. [Demo Script (Judging Video)](#demo-script-judging-video)
14. [3-Week Build Plan](#3-week-build-plan)
15. [README Snippets & Integration Proofs](#readme-snippets--integration-proofs)
16. [Judging Rubric Self-Score](#judging-rubric-self-score)

---

## Executive Summary

**Provenance Pay** is a Next.js application with a Node.js sidecar agent that reads music credit metadata from Beets/Picard/MusicBrainz, constructs a recursive provenance graph of every contributor to a track, and fires Circle Nanopayments (gas-free USDC on Arc Testnet) to each credited wallet simultaneously — in real time as a Navidrome track plays.

It is the first project to wire an existing attribution data standard (MusicBrainz artist credits) directly into a multi-recipient real-time payment rail. It uses the full Circle Agent Stack — Agent Wallets, Nanopayments powered by Circle Gateway, x402 v2, Arc Testnet, Circle CLI, and the Circle Contracts library — in a single, coherent product.

**Tagline:** `CREDIT WHERE CREDIT IS DUE. ON-CHAIN. AT PLAYBACK SPEED.`

---

## Problem Statement

The recorded music industry generates ~$28B annually. The average session musician or co-writer receives their royalty statement 12–18 months after the work is consumed, via a chain of PROs, labels, distributors, and publishers each extracting margin. The root pathology is not malice — it is the absence of a payment rail that can:

1. Identify every contributor at consumption time (not licensing time)
2. Split a sub-cent amount across 5+ parties without the gas cost exceeding the payment itself
3. Execute without a human administrator approving every disbursement

MusicBrainz has solved problem #1 for free music metadata — it holds structured, machine-readable artist credit data for over 2 million releases including recursive relationships (producer → mix engineer → session musician → featured artist). Beets and Picard embed that data directly into local music file tags.

Circle has solved problems #2 and #3 with the May 2026 Agent Stack: Nanopayments on Arc Testnet enables $0.000001 gas-free transfers at machine speed; Agent Wallets with spending policies let an autonomous agent provision wallets and disburse funds without human sign-off.

The gap between them — a sidecar agent that reads MusicBrainz tags and calls Circle — is what Provenance Pay fills.

---

## The Idea in One Sentence

A sidecar agent reads Beets/Picard music credits, builds a recursive royalty graph, and fires Circle Nanopayments to every credited contributor in real time as a Navidrome track plays — with a play-gate so a skip under 15 seconds costs nothing.

---

## Why Now / Competitive Gap

| Prior hackathon submissions | Gap Provenance Pay fills |
|---|---|
| SuperPage (per-article x402 paywall) | Static paywall; single recipient; no attribution data |
| Pay-per-crawl middleware | Infrastructure layer; no end-user domain |
| AI marketing agent A2A loop | Synthetic payment loop; no real attributed data |
| StreamArc (pay-per-second video) | Single recipient; no provenance graph |
| Cairn (IoT nanopayment oracle) | Sensor data; no human royalty attribution |

The hackathon brief explicitly calls out "royalties that follow a work through every hand that made it" and references beetbox/beets and metabrainz/picard as sources of track credit data. No prior submission has used pre-existing attribution metadata as the payout rule engine. That is the moat.

Additionally: Circle Agent Stack shipped May 11, 2026 — three weeks before this hackathon's submission window. Any project that uses the full Agent Stack (Agent Wallets + Agent Marketplace + CLI + Nanopayments + Circle Skills) signals judges that the builder has been tracking the platform in real time. This is a 30-point signal on the innovation rubric.

---

## Sponsor Technology Alignment

### Circle Technologies Used (All 7 layers of the Agent Stack)

| Technology | Version / Status | How Provenance Pay Uses It |
|---|---|---|
| **Arc Testnet** | Public testnet (Oct 2025–) | All wallets and settlements run on Arc; USDC gas ensures predictable sub-cent fees via EIP-1559 weighted moving average |
| **Nanopayments powered by Circle Gateway** | Mainnet April 2026; SDK `@circle-fin/x402-batching` | Per-second royalty disbursements to 5+ wallets simultaneously; off-chain batch authorization, on-chain settlement — the economic primitive at the heart of the product |
| **x402 v2 protocol** | Integrated with Nanopayments | Navidrome playback webhook endpoint responds with HTTP 402 when track starts; the sidecar agent pays the x402 invoice and the play begins |
| **Agent Wallets** | Launched May 11, 2026 via agents.circle.com | Unknown contributors (new producer tag in Beets) are auto-provisioned as Agent Wallets; spending policies cap daily outflow; MPC key management means no private key exposure |
| **Circle CLI** | Launched May 11, 2026 | Used in the sidecar agent to create wallets, define spending limits, and trigger withdrawals via terminal commands |
| **Circle Developer-Controlled Wallets (MPC)** | Stable API | Known contributors receive wallets provisioned via the Wallets API with 2-of-2 MPC key management; the entity secret never leaves the server |
| **Circle Contracts (smart contract templates)** | Contracts library | A `ProvenanceRegistry` contract on Arc records the canonical split for each MusicBrainz recording MBID; immutable after first write; payment agent reads it before disbursing |

### Why This Impresses the Judges

Circle shipped Agent Stack on May 11, 2026 because they desperately need a real-world non-trading use case to validate the thesis that "USDC is the payment rail for the agentic economy." The Provenance Pay demo is that use case: a domain (music) that everyone understands, a beneficiary (session musicians) that everyone sympathizes with, and a live dashboard that makes the value proposition viscerally obvious. It is the robot-dog-recharging demo but with human stakes.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js)                             │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Provenance Graph   │  │  Live Payment    │  │  Contributor  │  │
│  │  Visualizer         │  │  Dashboard       │  │  Registry     │  │
│  │  (D3 force-graph)   │  │  (per-wallet     │  │  (claim       │  │
│  │                     │  │   USDC tickers)  │  │   escrow)     │  │
│  └─────────────────────┘  └──────────────────┘  └───────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP / Server-Sent Events (SSE)
┌──────────────────────────────▼──────────────────────────────────────┐
│                     NEXT.JS API ROUTES (Edge Runtime)                │
│  /api/track/[id]/provenance   /api/payments/stream   /api/wallet/*  │
│  /api/playback/webhook        /api/escrow/claim      /api/graph/*   │
└──────────────┬──────────────────────────────────────────────────────┘
               │
   ┌───────────▼────────────┐          ┌─────────────────────────────┐
   │  PROVENANCE AGENT      │          │  NAVIDROME INSTANCE         │
   │  (Node.js sidecar)     │◄─────────│  (self-hosted; webhooks     │
   │                        │  webhook │   on play / skip / stop)    │
   │  • Beets tag reader    │          └─────────────────────────────┘
   │  • MusicBrainz API     │
   │  • Graph builder       │          ┌─────────────────────────────┐
   │  • Wallet provisioner  │◄─────────│  MUSICBRAINZ / BEETS        │
   │  • Payment dispatcher  │  MBID    │  (local .flac tags +        │
   │                        │  lookup  │   remote MB REST API)       │
   └───────────┬────────────┘          └─────────────────────────────┘
               │
   ┌───────────▼────────────────────────────────────────────────────┐
   │                   CIRCLE AGENT STACK                           │
   │                                                                │
   │  ┌─────────────────┐   ┌──────────────────┐  ┌─────────────┐ │
   │  │  Agent Wallets  │   │  Nanopayments    │  │ Circle CLI  │ │
   │  │  (MPC, policy-  │   │  powered by      │  │ (provisioning│ │
   │  │   controlled)   │   │  Circle Gateway  │  │  + withdraw)│ │
   │  └────────┬────────┘   └────────┬─────────┘  └─────────────┘ │
   │           │                     │                              │
   │  ┌────────▼─────────────────────▼──────────────────────────┐  │
   │  │          ARC TESTNET (Malachite BFT, <1s finality)      │  │
   │  │  ProvenanceRegistry.sol  •  USDC-as-gas  •  EVM-compat  │  │
   │  └─────────────────────────────────────────────────────────┘  │
   └────────────────────────────────────────────────────────────────┘
```

### Data Flow for a Single Playback Event

```
1. Navidrome POST /api/playback/webhook  { event: "play", trackId: "abc123" }
2. Agent reads Beets tag: MUSICBRAINZ_RECORDINGID = "mbid-xxxx"
3. Agent checks ProvenanceRegistry on Arc: cached split? → yes → load graph
   (if no: query MusicBrainz REST API → build graph → write to contract)
4. Agent checks each contributor for a registered wallet:
   → known contributor: load from Wallets API
   → unknown contributor: provision new Agent Wallet via Circle CLI
      → write escrow record to DB, hold USDC for claiming
5. Timer starts (15-second play-gate)
6. At t=15s: first Nanopayments batch dispatched
   → One EIP-3009 signed authorization per contributor per tick
   → Circle Gateway validates sigs, deducts from unified balance
   → Merchant (our server) receives instant confirmation
7. Every 2s thereafter: tick → payment batch → SSE event → UI counters update
8. On skip / stop: agent cancels pending authorizations → all counters freeze
9. Every 60s: Gateway batch settles on Arc (Malachite BFT, <1s finality)
```

---

## UI/UX Design Philosophy & Screens

### Design Inspiration

The winning Arc hackathon submissions (StreamArc, Cairn) shared a visual grammar: a dark background with glowing live counters, no page navigation during a demo-critical event, and a strong "this is real money moving right now" aesthetic. Provenance Pay leans into this but adds a graph layer that makes the unique value proposition — recursive attribution — immediately legible to a non-technical judge.

**Design principles:**
- **Dark, dense, live.** Background `#0A0A0F`, accent `#00C2FF` (Circle brand cyan). Montserrat for headings, JetBrains Mono for wallet addresses and USDC amounts.
- **No page transitions during playback.** A single-page layout with the graph and dashboard as co-equal panels. Every state change is animated in-place.
- **Graph first.** The provenance graph is the hero element. It should be the first thing a judge sees in the demo video. The payment counters are the proof of work.
- **Escrow is visible.** Unknown contributors whose wallets are being auto-provisioned show a distinct amber node with a lock icon. Once provisioned, they animate to cyan.
- **No empty states.** Even before a track plays, the graph shows the pre-loaded attribution tree for a featured demo track.

### Screen 1 — Library View (Pre-Play)

```
┌────────────────────────────────────────────────────────────────────┐
│  PROVENANCE PAY                              [Wallet: 0x3f…a1] ▸  │
├─────────────────────────────┬──────────────────────────────────────┤
│  YOUR LIBRARY               │  PROVENANCE GRAPH                    │
│  ─────────────────          │                                      │
│  ▶  Midnight in Memphis     │      [Producer]────────[Artist]      │
│     J. Cole · 4:22          │          │                │         │
│                             │      [Engineer]      [Feat. Artist]  │
│  ▶  Waves (feat. Amber)     │          │                           │
│     Remi Wolf · 3:41        │      [Session Musician]              │
│                             │                                      │
│  ▶  Drift                   │  ① Select a track to see its        │
│     FKJ · 5:01              │     full provenance graph           │
│                             │                                      │
│  [Search Beets Library]     │  ② Press play to start              │
│                             │     real-time royalties             │
└─────────────────────────────┴──────────────────────────────────────┘
```

### Screen 2 — Active Playback (The Hero Demo Screen)

```
┌────────────────────────────────────────────────────────────────────┐
│  ▶ NOW PLAYING: Midnight in Memphis — J. Cole    ████████░░ 2:14  │
├────────────────────────────────────┬───────────────────────────────┤
│  PROVENANCE GRAPH                  │  LIVE ROYALTIES               │
│                                    │  ─────────────────────────    │
│     [J. Cole]──────[No I.D.]       │  J. Cole (artist)             │
│        │               │           │  $0.000312 ↑ USDC             │
│     [Amber]       [Mix: Derek]     │  ●●●●●●●●●●                   │
│        │                           │                               │
│     [Guitar: Sal]                  │  No I.D. (producer)           │
│                                    │  $0.000156 ↑ USDC             │
│  ● Paying  ○ Escrow  ◌ Pending     │  ●●●●●●●                      │
│                                    │                               │
│  [PLAY GATE: 15s]  ████████████░   │  Amber (feat. artist)         │
│  ✓ Gate cleared — payments active  │  $0.000104 ↑ USDC             │
│                                    │  ●●●●●                        │
│                                    │                               │
│                                    │  Derek Lee (mix)              │
│                                    │  $0.000052 ↑ USDC  🔒escrow   │
│                                    │                               │
│                                    │  Sal Alvarez (session)        │
│                                    │  $0.000052 ↑ USDC  🔒escrow   │
│                                    │                               │
│                                    │  TOTAL DISBURSED (session):   │
│                                    │  $0.001248 USDC               │
│                                    │  ARC TX: 0x7a…cf ✓ settled   │
└────────────────────────────────────┴───────────────────────────────┘
```

### Screen 3 — Contributor Claim Portal

For contributors whose wallet was auto-provisioned (escrow state), a separate `/claim` route lets them:

1. Enter their MusicBrainz MBID (which matches the escrow record)
2. Sign a challenge with their own wallet
3. Receive their accrued USDC from the escrow Agent Wallet

This screen demonstrates Agent Wallets' spending-policy enforcement (the escrow wallet can only release to the verified claimant address).

### Screen 4 — Analytics (Post-Demo)

Shows cumulative payments per contributor across all plays, track-level disbursement history, and a Gateway balance timeline. Intended to show judges that the product would be compelling at scale — not just for one demo track.

---

## Feature Specification

### F1: Beets Tag Ingestion
- On startup, the sidecar agent scans `~/.config/beets/library.db` (SQLite)
- Extracts `mb_trackid` (MUSICBRAINZ_RECORDINGID) and `mb_artistid` for each track
- If `mb_trackid` is absent, falls back to Picard-style tags in the FLAC/MP3 VORBIS_COMMENT block
- Caches results in a local SQLite sidecar DB

### F2: MusicBrainz Provenance Graph Builder
- Given an MBID, calls `https://musicbrainz.org/ws/2/recording/{mbid}?inc=artists+artist-rels+work-rels`
- Parses `artist-credit`, `relations` (including work relations which carry composer/lyricist)
- Builds a directed acyclic graph: `{ nodes: [{ mbid, name, role }], edges: [{ from, to, relationship }] }`
- Assigns default revenue splits by role type (configurable):

  ```
  artist:          35%
  producer:        25%
  featured_artist: 15%
  composer:        10%
  mixer:            8%
  session_musician: 7% (distributed equally among all)
  ```

- Writes canonical split to `ProvenanceRegistry.sol` on Arc (first play of any track commits the graph on-chain; subsequent plays read from the contract)

### F3: Wallet Resolution
- Checks local DB for contributor MBID → wallet address mapping
- For registered contributors: resolves to their Circle Developer-Controlled Wallet
- For unregistered contributors:
  - Provisions a new Agent Wallet via Circle CLI: `circle wallets create --policy daily_limit:0.10`
  - Writes MBID → wallet mapping + escrow flag to DB
  - Emits SSE event so UI shows new amber node in the graph

### F4: Play-Gate (15-second threshold)
- Navidrome sends `play` webhook on track start
- Sidecar starts a 15-second timer
- If `skip` or `stop` webhook arrives before 15s: no payments dispatched, timer cancelled
- At 15s: payment loop starts

### F5: Real-Time Nanopayment Dispatch
- Every 2 seconds after gate clears:
  - For each contributor: compute per-tick amount = `(track_rate_per_second * contributor_split * 2)`
  - Sign EIP-3009 authorization using Circle Gateway SDK
  - POST to Circle Nanopayments API (`/v1/payments`)
  - On 200: emit SSE event `{ contributor_mbid, amount, tx_ref }` → UI counter updates
- On `stop` webhook: cancel loop, emit SSE `{ event: "stopped" }`

### F6: Agent Wallet Auto-Provisioning (the "WOW" feature)
- When a new producer tag is detected in a Beets record that has no wallet mapping:
  - Circle CLI creates wallet: `circle agent-wallets create --label "{name}" --policy "{daily_usdc:0.10}"`
  - USDC accrues in escrow wallet under our entity secret
  - UI shows amber-locked node with tooltip: *"Wallet auto-provisioned — awaiting claim by {name}"*
  - This node turns cyan and unlocks in the UI once the contributor visits `/claim` and verifies identity

### F7: Arc Settlement Display
- The payment dashboard shows:
  - Off-chain available balance (updated per tick)
  - On-chain settled balance (polled every 30s from Gateway unified balance API)
  - Last Arc block hash and Malachite finality timestamp for the most recent batch settlement
  - Chain explorer link: `https://testnet.arcnetwork.xyz/tx/{hash}`

### F8: ProvenanceRegistry Smart Contract
- EVM-compatible Solidity contract deployed on Arc Testnet
- Stores: `mapping(bytes32 mbid => Split[] splits)` where `Split = { address wallet, uint16 bps }`
- Write-once per MBID (once a split is registered, it is immutable — prevents royalty manipulation)
- Emits `ProvenanceRegistered(bytes32 mbid, address[] wallets, uint16[] bps)` event

---

## Technical Implementation Details

### Stack

```
Frontend:       Next.js 15 (App Router, Edge Runtime where applicable)
Styling:        Tailwind CSS + CSS custom properties
Graph:          D3.js force-directed graph (no React wrapper — raw D3 + useRef)
Real-time:      Server-Sent Events (SSE) via Next.js Route Handlers (no WebSocket needed)
Sidecar:        Node.js 22 standalone process (not inside Next.js)
DB:             SQLite via better-sqlite3 (sidecar) + Postgres via Supabase (Next.js API)
Contract:       Solidity 0.8.24, Foundry, deployed on Arc Testnet
```

### Circle SDK Integration

```typescript
// lib/circle/gateway.ts
import { NanopaymentClient } from '@circle-fin/x402-batching';
import { CircleDeveloperSdk } from '@circle-developer/sdk';

export const circleSDK = new CircleDeveloperSdk({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

export const nanopayClient = new NanopaymentClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  environment: 'testnet',  // Arc Testnet
});

// Provision a new Agent Wallet for an unknown contributor
export async function provisionContributorWallet(
  mbid: string,
  name: string
): Promise<string> {
  const result = await circleSDK.createWallets({
    accountType: 'EOA',
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId: process.env.CIRCLE_WALLET_SET_ID!,
    metadata: [{ name: `provenance-${mbid}`, refId: mbid }],
  });
  const address = result.data!.wallets[0].address;

  // Set spending policy via Circle CLI (spawned as child process)
  await runCircleCLI(
    `wallets policy set ${address} --daily-usdc-limit 0.10 --label "${name}"`
  );

  return address;
}
```

### x402 Webhook Middleware (Play-Gate)

```typescript
// app/api/playback/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { x402Middleware } from '@coinbase/x402';
import { nanopayClient } from '@/lib/circle/gateway';

// x402: our Navidrome-facing endpoint requires a micropayment to "unlock"
// Each play event must be authorized before payments flow to contributors
export const POST = x402Middleware({
  amount: '0.000010',          // $0.00001 USDC per play authorization
  asset: 'USDC',
  payTo: process.env.PLATFORM_WALLET_ADDRESS!,
  network: 'arc-testnet',
  description: 'Provenance Pay play authorization',
})(async (req: NextRequest) => {
  const body = await req.json() as NavidromeWebhook;

  if (body.event === 'play') {
    // Emit play event to sidecar via internal IPC
    await fetch(`http://localhost:${process.env.SIDECAR_PORT}/play`, {
      method: 'POST',
      body: JSON.stringify({ trackId: body.trackId }),
    });
  }

  if (body.event === 'skip' || body.event === 'stop') {
    await fetch(`http://localhost:${process.env.SIDECAR_PORT}/stop`, {
      method: 'POST',
      body: JSON.stringify({ trackId: body.trackId }),
    });
  }

  return NextResponse.json({ ok: true });
});
```

### Nanopayment Dispatch (Sidecar Core)

```typescript
// sidecar/payment-dispatcher.ts
import { NanopaymentClient } from '@circle-fin/x402-batching';

export class PaymentDispatcher {
  private client: NanopaymentClient;
  private buyerAddress: string;
  private buyerPrivateKey: string;

  async dispatchTick(graph: ProvenanceGraph, trackRatePerSecond: number) {
    const tickDuration = 2; // seconds
    const totalTickAmount = trackRatePerSecond * tickDuration;

    const payments = graph.splits.map((split) => ({
      to: split.walletAddress,
      amount: String(Math.floor(totalTickAmount * split.bps / 10000 * 1_000_000)), // in micro-USDC
      asset: 'USDC',
      network: 'arc-testnet',
    }));

    // EIP-3009 authorization batch — all signed locally, never broadcast individually
    const authBatch = await this.client.createBatchAuthorization({
      from: this.buyerAddress,
      privateKey: this.buyerPrivateKey,
      payments,
    });

    const result = await this.client.submitBatch(authBatch);

    // Circle Gateway validates sigs, adjusts internal ledger, confirms instantly
    // On-chain settlement to Arc happens in the next batch window (~60s)
    return result.confirmations; // [{ to, amount, ref, status: 'confirmed' }]
  }
}
```

### ProvenanceRegistry Contract (Arc Testnet)

```solidity
// contracts/ProvenanceRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProvenanceRegistry
/// @notice Immutable on-chain record of royalty splits keyed by MusicBrainz recording MBID.
/// Deployed on Arc Testnet. USDC-as-gas; EVM-compatible; Malachite BFT sub-second finality.
contract ProvenanceRegistry {
    struct Split {
        address payable wallet;
        uint16 basisPoints; // sum must equal 10000 (100%)
    }

    // mbid (bytes32-encoded UTF-8) → splits
    mapping(bytes32 => Split[]) private _registry;
    mapping(bytes32 => bool) private _registered;

    event ProvenanceRegistered(
        bytes32 indexed mbid,
        address[] wallets,
        uint16[] basisPoints,
        string[] roles
    );

    error AlreadyRegistered(bytes32 mbid);
    error InvalidSplits();

    /// @notice Register an immutable split for a recording. Write-once.
    function register(
        bytes32 mbid,
        address[] calldata wallets,
        uint16[] calldata bps,
        string[] calldata roles
    ) external {
        if (_registered[mbid]) revert AlreadyRegistered(mbid);
        if (wallets.length != bps.length) revert InvalidSplits();

        uint16 total;
        for (uint i; i < bps.length; i++) {
            total += bps[i];
            _registry[mbid].push(Split(payable(wallets[i]), bps[i]));
        }
        if (total != 10000) revert InvalidSplits();

        _registered[mbid] = true;
        emit ProvenanceRegistered(mbid, wallets, bps, roles);
    }

    function getSplits(bytes32 mbid) external view returns (Split[] memory) {
        return _registry[mbid];
    }

    function isRegistered(bytes32 mbid) external view returns (bool) {
        return _registered[mbid];
    }
}
```

### Foundry Deployment to Arc Testnet

```bash
# foundry.toml
[rpc_endpoints]
arc_testnet = "https://rpc.testnet.arcnetwork.xyz"

[etherscan]
arc_testnet = { key = "arc_explorer_not_required", url = "https://testnet.arcnetwork.xyz" }
```

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url arc_testnet \
  --broadcast \
  --verify \
  --legacy  # Arc uses EIP-1559 but Foundry needs --legacy for USDC-as-gas chains
```

### MusicBrainz Graph Builder

```typescript
// sidecar/mb-graph-builder.ts
export async function buildProvenanceGraph(mbid: string): Promise<ProvenanceGraph> {
  const url = `https://musicbrainz.org/ws/2/recording/${mbid}`
    + `?inc=artists+artist-rels+work-rels+recording-level-rels&fmt=json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ProvenancePay/1.0 (hackathon@example.com)' },
  });
  const data = await res.json();

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Primary artist credits
  for (const credit of data['artist-credit'] ?? []) {
    if (credit.artist) {
      nodes.push({ mbid: credit.artist.id, name: credit.artist.name, role: 'artist' });
    }
  }

  // Relationship-level credits (producer, engineer, featured, composer...)
  for (const rel of data.relations ?? []) {
    if (rel['target-type'] === 'artist' && rel.artist) {
      const role = normalizeRole(rel.type); // e.g. "mix" → "mixer", "instrument" → "session_musician"
      nodes.push({ mbid: rel.artist.id, name: rel.artist.name, role });
      edges.push({ from: rel.artist.id, to: data.id, relationship: rel.type });
    }
  }

  // Deduplicate nodes (same artist can appear in multiple relations)
  const unique = [...new Map(nodes.map(n => [n.mbid, n])).values()];
  const splits = computeSplits(unique); // applies default split table by role

  return { mbid, nodes: unique, edges, splits };
}
```

### Server-Sent Events — Live Payment Stream

```typescript
// app/api/payments/stream/route.ts
import { NextRequest } from 'next/server';

// SSE endpoint: client connects once, receives payment ticks indefinitely
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const trackId = req.nextUrl.searchParams.get('trackId')!;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Subscribe to sidecar payment events via internal EventEmitter bridge
      const unsubscribe = paymentEventBus.on(trackId, (tick: PaymentTick) => {
        send({
          type: 'tick',
          contributor: tick.contributorMbid,
          amount: tick.amount,
          cumulativeAmount: tick.cumulative,
          arcTxRef: tick.txRef,
          timestamp: Date.now(),
        });
      });

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## API Route Map

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/api/playback/webhook` | Navidrome play/skip/stop webhook. x402 middleware protects it. | x402 micropayment |
| `GET` | `/api/track/[id]/provenance` | Returns full provenance graph JSON for a track. Builds from MusicBrainz if not cached. | None |
| `GET` | `/api/payments/stream?trackId=X` | SSE stream of live payment ticks for a playing track. | None |
| `GET` | `/api/payments/history?trackId=X` | Full payment history for a track from Supabase. | None |
| `POST` | `/api/wallet/provision` | Provision a new Agent Wallet for an MBID. Internal use by sidecar. | API key |
| `GET` | `/api/wallet/balance/[address]` | Circle Gateway unified balance for a wallet address. | API key |
| `POST` | `/api/escrow/claim` | Contributor claims their escrow USDC. Verifies MBID + wallet ownership. | Wallet sig |
| `GET` | `/api/graph/[mbid]` | ProvenanceRegistry contract read: returns canonical splits for an MBID. | None |
| `POST` | `/api/graph/register` | Write split to ProvenanceRegistry on Arc. Called after first graph build. | API key |

---

## Data Models

### `contributors` (Supabase)
```sql
CREATE TABLE contributors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mbid        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  wallet_address TEXT,
  wallet_id   TEXT,           -- Circle wallet ID
  is_provisioned BOOLEAN DEFAULT false,
  is_escrow   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `provenance_graphs` (Supabase)
```sql
CREATE TABLE provenance_graphs (
  mbid         TEXT PRIMARY KEY,
  graph_json   JSONB NOT NULL,   -- full ProvenanceGraph object
  arc_tx_hash  TEXT,             -- ProvenanceRegistry write tx
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `payment_ticks` (Supabase)
```sql
CREATE TABLE payment_ticks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_mbid      TEXT NOT NULL,
  contributor_mbid TEXT NOT NULL,
  amount_usdc     NUMERIC(20,10) NOT NULL,
  nanopay_ref     TEXT,          -- Circle Nanopayments confirmation ref
  arc_batch_hash  TEXT,          -- Arc on-chain settlement hash (populated after batch)
  tick_at         TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Demo Script (Judging Video)

> Target: 3 minutes. All on one screen. No slide deck.

**0:00–0:20 — Setup**
Open the dashboard. Show a pre-loaded track: *"Midnight in Memphis — J. Cole"*. The provenance graph is already rendered: five nodes (J. Cole, No I.D., featured artist, mix engineer, session guitarist). Point to the node labels and split percentages.

**0:20–0:50 — Press Play**
Press play in Navidrome (visible in a terminal or browser tab side-by-side). The play-gate progress bar appears on screen. Narrate: *"Fifteen seconds. If you skip, nobody gets paid."* Watch the bar fill. At 15s, it turns green: *"Gate cleared."* The first payment batch fires. Five wallet balance counters start ticking simultaneously, each at a different rate reflecting the split. Keep playing.

**0:50–1:30 — Skip Demo**
At 30 seconds in, pause the video and rewind mentally. Press skip at 9 seconds. All counters freeze at zero. Open the Arc testnet explorer. Show zero transactions. Play again past 15s. Counters resume from zero (fresh gate). Arc explorer shows a batch settlement ~60s later.

**1:30–2:10 — Auto-Provisioning**
Load a second track: one that has a producer tag in Beets that's never been played before. The sidecar detects an unregistered MBID. A new amber node appears in the graph with a lock icon and the label *"Auto-provisioning wallet…"*. Five seconds later it turns cyan: *"Agent Wallet created. Escrow enabled."* The CLI output plays in a small terminal overlay: `circle agent-wallets create --label "..."` executing live. Payments start flowing to the new wallet immediately.

**2:10–2:40 — Claim Portal**
Navigate to `/claim`. Show the contributor entering their MBID and signing a challenge with MetaMask. Their USDC balance from escrow appears instantly. One click → withdraw to any Arc-supported chain via Circle Gateway's unified balance.

**2:40–3:00 — Close**
Return to the dashboard. Show cumulative session totals: *"$0.0048 USDC disbursed across 4 plays to 5 contributors. No intermediary. No delay. No gas cost."* End on the tagline: **CREDIT WHERE CREDIT IS DUE. ON-CHAIN. AT PLAYBACK SPEED.**

---

## 3-Week Build Plan

### Week 1 (Days 1–7): Foundation

| Day | Task |
|---|---|
| 1 | Bootstrap Next.js 15 project, Tailwind, Supabase, Arc Testnet RPC config |
| 2 | Circle SDK init: entity secret, wallet set, test USDC faucet drip |
| 3 | Beets tag reader + MusicBrainz API wrapper (rate-limit compliant: 1 req/s) |
| 4 | ProvenanceGraph builder: parse artist-credit + relations, default split table |
| 5 | ProvenanceRegistry.sol: write, test with Foundry on Arc Testnet, deploy |
| 6 | Navidrome local setup + webhook integration: play/skip/stop events → sidecar |
| 7 | Basic UI: library list, static provenance graph with D3 force-directed layout |

### Week 2 (Days 8–14): Core Feature

| Day | Task |
|---|---|
| 8 | Wallet resolution: MBID → address lookup + Circle Wallets API create |
| 9 | Agent Wallet provisioning via Circle CLI child process + escrow flag |
| 10 | Play-gate implementation: 15s timer, cancel-on-skip logic |
| 11 | Nanopayments dispatch: EIP-3009 batch signing + Circle Gateway POST |
| 12 | SSE payment stream: sidecar → Next.js API → browser EventSource |
| 13 | Live UI: animated wallet counters, graph node state transitions (pending/active/escrow) |
| 14 | Arc settlement display: Gateway balance poller, explorer link, Malachite finality timestamp |

### Week 3 (Days 15–21): Polish & Demo

| Day | Task |
|---|---|
| 15 | Claim portal: MBID entry, wallet signature verification, escrow release |
| 16 | Analytics page: cumulative disbursements, track-level history, Gateway timeline |
| 17 | Error handling: rate limits, MB API 503, Circle API retries, zero-balance guards |
| 18 | Record demo video: 3-min walkthrough following script above |
| 19 | Write README with full integration snippets (see section below) |
| 20 | Load test: simulate 10 concurrent play sessions, verify no duplicate payments |
| 21 | Buffer / polish / submit |

---

## README Snippets & Integration Proofs

> These sections belong in your actual `README.md`. They are written to show judges exactly where each Circle technology is used.

---

### Circle Agent Stack Integration

**Provenance Pay is built on the Circle Agent Stack**, launched May 11, 2026. It uses all five components:

#### 1. Nanopayments powered by Circle Gateway

```bash
npm install @circle-fin/x402-batching
```

```typescript
// Every 2 seconds while a track plays past the 15s gate:
const authBatch = await nanopayClient.createBatchAuthorization({
  from: buyerAddress,
  privateKey: buyerPrivateKey,
  payments: graph.splits.map(split => ({
    to: split.walletAddress,
    amount: String(computeTickAmount(split.bps)),
    asset: 'USDC',
    network: 'arc-testnet',
  })),
});

const confirmations = await nanopayClient.submitBatch(authBatch);
// Circle Gateway instantly validates sigs + adjusts off-chain ledger
// On-chain Arc settlement fires in the next batch window (~60s)
// Malachite BFT ensures deterministic sub-second finality once it lands
```

#### 2. Agent Wallets (new contributor auto-provisioning)

```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);

// Called when a Beets tag has an MBID with no registered wallet
async function autoProvisionWallet(mbid: string, name: string) {
  // circle CLI (from Circle Agent Stack, agents.circle.com)
  await execAsync(
    `circle agent-wallets create \
      --label "provenance-${mbid}" \
      --blockchain ARC-TESTNET \
      --policy "daily_usdc_limit:0.10" \
      --ref-id "${mbid}"`
  );
  // Wallet address returned, stored in DB with escrow=true
  // Agent cannot exceed $0.10/day spend — enforced at wallet layer, not application layer
}
```

#### 3. Developer-Controlled Wallets (MPC) for known contributors

```typescript
import { CircleDeveloperSdk } from '@circle-developer/sdk';

const sdk = new CircleDeveloperSdk({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!, // never sent to Circle; stored encrypted
});

const wallet = await sdk.createWallets({
  accountType: 'EOA',
  blockchains: ['ARC-TESTNET'],
  count: 1,
  walletSetId: process.env.WALLET_SET_ID!,
  metadata: [{ name: name, refId: mbid }],
});
```

#### 4. Arc Testnet + Malachite BFT

Arc is the settlement layer. All wallets are Arc Testnet addresses. USDC is the gas token — fees are predictable to the microdollar. Malachite BFT consensus provides deterministic finality in under 1 second, meaning once a batch settles, there is no probabilistic reorg risk. This matters for royalty accounting: a confirmed Arc transaction is a final payment, not a pending one.

```typescript
// foundry.toml — Arc Testnet RPC
[rpc_endpoints]
arc_testnet = "https://rpc.testnet.arcnetwork.xyz"
```

```typescript
// viem client pointing at Arc Testnet
import { createPublicClient, http } from 'viem';
const arc = createPublicClient({
  chain: {
    id: parseInt(process.env.ARC_CHAIN_ID!),
    name: 'Arc Testnet',
    rpcUrls: { default: { http: [process.env.ARC_RPC_URL!] } },
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  },
  transport: http(),
});
```

#### 5. x402 v2 Protocol

```typescript
// The Navidrome webhook endpoint is x402-protected.
// Our platform wallet receives a micro-fee per play authorization.
// This demonstrates x402 as an HTTP-native payment layer — not a bolt-on.

import { x402Middleware } from '@coinbase/x402';
export const POST = x402Middleware({
  amount: '0.000010',
  asset: 'USDC',
  payTo: process.env.PLATFORM_WALLET_ADDRESS!,
  network: 'arc-testnet',
})(webhookHandler);
```

#### 6. ProvenanceRegistry on Arc (Circle Contracts pattern)

```bash
# Deploy with Foundry to Arc Testnet
forge create ProvenanceRegistry \
  --rpc-url https://rpc.testnet.arcnetwork.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

The registry makes royalty splits immutable and on-chain. The agent reads from it (not from a database) before dispatching payments. This is not decorative blockchain usage — the contract is the source of truth for payment computation.

#### 7. Circle CLI (from Circle Agent Stack)

```bash
# Install Circle CLI
curl -sL https://agents.circle.com/install.sh | bash

# Create an Agent Wallet for an unknown contributor, with spending guardrails
circle agent-wallets create \
  --label "provenance-{mbid}" \
  --blockchain ARC-TESTNET \
  --policy "daily_usdc_limit:0.10,allowlist:{platform_address}"

# Withdraw accrued escrow to a contributor's personal address (after claim verification)
circle wallets transfer \
  --from {escrow_wallet_address} \
  --to {contributor_address} \
  --amount {accrued_usdc} \
  --asset USDC \
  --network ARC-TESTNET
```

---

### Environment Variables

```bash
# .env.local
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret_never_sent_to_circle
CIRCLE_WALLET_SET_ID=your_wallet_set_id
PLATFORM_WALLET_ADDRESS=0xYourPlatformWallet
ARC_RPC_URL=https://rpc.testnet.arcnetwork.xyz
ARC_CHAIN_ID=YOUR_ARC_TESTNET_CHAIN_ID
PROVENANCE_REGISTRY_ADDRESS=0xYourDeployedContract
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NAVIDROME_URL=http://localhost:4533
NAVIDROME_WEBHOOK_SECRET=your_webhook_secret
SIDECAR_PORT=3001
MUSICBRAINZ_APP_NAME=ProvenancePay
MUSICBRAINZ_APP_VERSION=1.0
MUSICBRAINZ_CONTACT=your@email.com
```

---

## Judging Rubric Self-Score

| Category | Weight | Why This Scores High |
|---|---|---|
| **Agentic Sophistication** | 30% | Agent autonomously builds provenance graphs from external data, provisions wallets without human input, enforces spending policies, dispatches parallel payments, and handles escrow. This is a genuine autonomous agent — not a script with a Circle SDK call. |
| **Traction Potential** | 30% | Navidrome has 21,000+ GitHub stars and an active self-hosting community on r/selfhosted (~180k members). Real users who run Navidrome today can install the Provenance Pay sidecar and start paying contributors from day 1. This is not a speculative TAM — the community already exists. |
| **Circle Tool Usage** | 20% | Uses: Nanopayments (core), Agent Wallets (auto-provisioning), Developer-Controlled Wallets (known contributors), Circle CLI (provisioning + withdrawal), x402 v2 (webhook protection), ProvenanceRegistry on Arc Testnet (smart contract), Circle Gateway unified balance API (settlement display). 7 distinct Circle technologies, all load-bearing. |
| **Innovation** | 20% | First project to use MusicBrainz attribution metadata as the payout rule engine for a real-time royalty system on any blockchain. No prior submission at any Arc hackathon has used pre-existing semantic attribution data as the payment topology. |

**Projected rubric total: 1st quartile.**

---

*Provenance Pay — built for the Lepton Hackathon by Circle & Arc, June 2026.*
*Every second a track plays, every hand that made it gets paid.*
