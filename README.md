# Provenance Pay — Credit where credit is due. On-chain. At playback speed.

> **"Every second a track plays, every hand that made it gets paid."**

---
**Provenance Pay** is a Next.js application integrated with a Node.js sidecar agent that reads music credit metadata from files tagged via Beets/Picard/MusicBrainz, constructs a recursive provenance graph of every contributor to a track, and fires Circle Nanopayments (gas-free USDC on Arc Testnet) to each credited wallet simultaneously — in real time as a track plays.

This project bridges existing music attribution standards (MusicBrainz artist credits) directly into a multi-recipient real-time payment rail. It utilizes the full Circle Agent Stack: Agent Wallets, Nanopayments (Circle Gateway), x402, Arc Testnet, Circle CLI, and smart contract templates (deployed on Arc Testnet).

---

## Architecture Overview

The system consists of three main components:
1. **Next.js Frontend**: Interactive dashboard that visualizes the provenance graph using a D3 force-directed layout, displays live rolling USDC tickers for each contributor, and allows claiming escrowed royalties.
2. **Node.js Sidecar (Provenance Agent)**: An autonomous server that consumes playback webhooks from Navidrome/media players, fetches metadata from MusicBrainz, computes revenue splits, provisions developer/agent-controlled wallets, and dispatches nanopayment batches.
3. **EVM Provenance Registry Contract**: A Solidity contract deployed on Arc Testnet storing immutable royalty split percentages keyed by the track's MusicBrainz Recording ID (MBID).

### System Diagram

```mermaid
graph TD
    %% Browser Layer
    subgraph Browser [Browser Frontend - Next.js]
        PGV[Provenance Graph Visualizer]
        LPD[Live Payment Dashboard]
        CCR[Contributor Claim Portal]
    end

    %% API Gateway / Backend Layer
    subgraph NextBackend [Next.js API Routes / Edge Runtime]
        API_Prov[/api/track/:id/provenance]
        API_Stream[/api/payments/stream]
        API_Claim[/api/escrow/claim]
    end

    %% Sidecar / Agent Layer
    subgraph AgentLayer [Provenance Agent - Node.js Sidecar]
        BTR[Beets Tag Reader]
        MBA[MusicBrainz REST API]
        GB[Graph Builder]
        WP[Wallet Provisioner]
        PD[Payment Dispatcher]
    end

    %% External Systems
    subgraph ExtSystems [External Music Services]
        Navidrome[Navidrome Instance]
        Beets[MusicBrainz / Beets DB]
    end

    %% Circle & On-chain Settlement Layer
    subgraph CircleStack [Circle Agent Stack & Blockchain]
        AW[Agent Wallets]
        NP[Nanopayments - Circle Gateway]
        CLI[Circle CLI]
        PRC[ProvenanceRegistry.sol Contract]
        Arc[Arc Testnet]
    end

    %% Data Flows
    Navidrome -- Playback Webhook --> NextBackend
    NextBackend -- IPC Webhook --> AgentLayer
    Beets -- MBID Lookup --> BTR
    BTR --> GB
    MBA -- Fetch Credits --> GB
    GB -- Reads Splits / Registers --> PRC
    PD -- Batched USDC --> NP
    WP -- Create Wallet --> AW
    CLI -- Spending Policies --> AW
    NP -- Settle Batches --> Arc
    PRC -- Deployed on --> Arc
    AW -- On-chain Accounts --> Arc

    %% Streaming to Frontend
    AgentLayer -- Server-Sent Events --> API_Stream
    API_Stream -- Real-time Ticks --> LPD
```

### Detailed Data Flow

1. **Playback Event**: A self-hosted media server (e.g. Navidrome) triggers a webhook on playback startup: `POST /api/playback/webhook { event: "play", trackId: "abc123" }`.
2. **Tag Resolution**: The Provenance Agent extracts the track's MusicBrainz Recording ID (`mb_trackid` / `MBID`) from file tags or local caches.
3. **On-chain Lookup**: The agent queries the `ProvenanceRegistry` contract on Arc Testnet:
   - **If registered**: Loads the canonical split percentage graph.
   - **If not registered**: Queries the MusicBrainz REST API, builds the split graph, and registers it to the `ProvenanceRegistry` contract (making it immutable).
4. **Wallet Resolution**: The agent maps each contributor to their on-chain address:
   - **Registered Contributor**: Pulls their wallet from Circle Developer-Controlled Wallets.
   - **Unregistered Contributor**: Provisions a new **Agent Wallet** via Circle CLI with spending limits, flag-marked as escrow, and registers it in the local DB.
5. **Play-Gate (15s)**: A 15-second timer starts. If the track is skipped/stopped before 15 seconds, no payouts occur.
6. **Disbursement Loop**: If the play-gate is cleared, the agent signs EIP-3009 local authorizations and submits them to **Circle Nanopayments** every 2 seconds.
7. **Real-time UI Update**: The sidecar streams ticks via **Server-Sent Events (SSE)** to Next.js. The UI animates nodes and updates live rolling counters for each contributor.
8. **On-chain Settlement**: Circle Gateway batches these nanopayments and settles them on **Arc Testnet** periodically (~60 seconds).

---

## Circle Agent Stack Integration

Provenance Pay utilizes the full 7-layer Circle Agent Stack to implement secure, gas-free, real-time payouts:

1. **Arc Testnet**: EVM-compatible settlement layer running Malachite BFT consensus for sub-second finality. Uses USDC as the native gas token.
2. **Nanopayments powered by Circle Gateway**: Processes high-frequency micropayments by validating EIP-3009 signed authorizations off-chain and settling on-chain in batches, preventing transaction fee overhead from exceeding payment value.
3. **x402 Protocol**: Secure HTTP-native payment protocol protecting playback webhooks behind payment gates.
4. **Agent Wallets**: Programmatically generated and secured on-chain accounts for unregistered artists. Escrowed USDC accumulates safely in these wallets.
5. **Circle CLI**: Used by the sidecar agent to instantiate wallets, set daily transaction limits/caps (e.g. `$0.10` daily limit for sandbox security), and handle payouts.
6. **Developer-Controlled Wallets (MPC)**: Secure wallet accounts managed for known ecosystem contributors via multi-party computation.
7. **Circle Contracts**: The Solidity `ProvenanceRegistry` contract deployed on Arc Testnet ensuring split templates are decentralized, permanent, and tamper-proof.

---

## Project Structure

```
lepton/
├── README.md                 # Project Overview & Architecture Guide
├── provenance-pay-prd.md     # Detailed Product Requirements Document
├── package.json              # Main project package configurations
├── create-wallet.ts          # Script to generate wallets for sandbox testing
├── register-entity-secret.ts # Circle Developer Wallet setup helper
├── contracts/                # Smart Contracts (Foundry project)
│   ├── src/                  # Solidity contract source files
│   │   └── ProvenanceRegistry.sol
│   ├── script/               # Deployment scripts
│   │   └── Deploy.s.sol
│   └── foundry.toml          # Foundry config targeting Arc Testnet
└── app/                      # Web App & Agent Sidecar (Next.js & Express)
    ├── package.json          # Frontend & Sidecar package configurations
    ├── sidecar/              # Standalone Node.js Agent
    │   ├── index.js          # Core Express server & SSE event dispatcher
    │   ├── mb-graph-builder.js # MusicBrainz metadata parser
    │   ├── payment-dispatcher.js # EIP-3009 signer and Nanopayments client
    │   └── db/               # SQLite database setup & migrations
    └── app/                  # Next.js App Router (Dashboard, Library, Claim)
```

---

## Configuration & Environment Variables

Copy or create a `.env` file in the root directory (the Next.js app and the Sidecar agent load it automatically):

```env
# Circle API Credentials
CIRCLE_API_KEY=your_circle_api_key_here
CIRCLE_ENTITY_SECRET=your_registered_32_byte_entity_secret
CIRCLE_WALLET_SET_ID=your_circle_wallet_set_id

# Blockchain Configuration (Arc Testnet)
ARC_RPC_URL=https://rpc.testnet.arcnetwork.xyz
ARC_CHAIN_ID=your_arc_chain_id
PLATFORM_WALLET_ADDRESS=0xYourPlatformEscrowWalletAddress
PROVENANCE_REGISTRY_ADDRESS=0xYourDeployedProvenanceRegistryContract

# Application Ports & Integrations
SIDECAR_PORT=3001
NAVIDROME_URL=http://localhost:4533
NAVIDROME_WEBHOOK_SECRET=your_webhook_auth_secret

# MusicBrainz API User Agent (compliant with MB rate-limits)
MUSICBRAINZ_APP_NAME=ProvenancePay
MUSICBRAINZ_APP_VERSION=1.0.0
MUSICBRAINZ_CONTACT=your-contact-email@domain.com
```

---

## Running Locally

### 1. Smart Contract Deployment (Foundry)
Ensure you have [Foundry](https://book.getfoundry.sh/getting-started/installation) installed.

```bash
cd contracts
# Build contracts
forge build

# Deploy & Verify to Arc Testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url arc_testnet \
  --broadcast \
  --verify \
  --legacy
```

### 2. Frontend & Agent Sidecar Development
From the root directory, run the concurrent dev environment:

```bash
# Install dependencies in root and app folder
npm install
npm --prefix app install

# Start Next.js App and Node.js Agent Sidecar concurrently
npm run dev
```

The services will be running on:
- **Next.js Web Interface**: [http://localhost:3000](http://localhost:3000)
- **Provenance Agent Sidecar**: [http://localhost:3001](http://localhost:3001)
