# Provenance Pay — Complete Project Technical Report

## 1. Executive Summary

**Provenance Pay** is a stablecoin-native music registry, search directory, and real-time royalty disbursement system. It links MusicBrainz metadata directly to an on-chain split ledger and a real-time Circle payment rail on the **Arc Testnet** (Circle's Layer-1 EVM blockchain using USDC as the native gas token). 

Every second a song plays in the browser, the system splits and routes micropayments directly to the wallet addresses of the writers, producers, mixers, and session musicians credited with making the track—with zero simulated elements, gas-free transfers, and an immutable smart contract split registry.

---

## 2. Technology Stack

### On-Chain Layer
- **Blockchain Network**: Arc Testnet (Chain ID: `5042002`, RPC: `https://rpc.testnet.arc.network`)
- **Gas Model**: stablecoin-native gas (USDC represents the native currency of the chain, decimals: 18)
- **Smart Contract**: EVM Solidity `ProvenanceRegistry.sol`
- **Wallet Provider**: Circle Developer-Controlled Wallets API (MPC 2-of-2 key custody)

### Sidecar Server (Node.js & Express)
- **Runtime Environment**: Node.js ES Modules
- **File Upload Handler**: `multer` for multipart audio file parsing
- **Local Cache Database**: `better-sqlite3` (SQLite)
- **Blockchain Interaction**: `viem` (accounts, clients, contract simulators)
- **Real-Time Client Streaming**: HTML5 Server-Sent Events (SSE)

### Frontend Application (Next.js 15 & React 19)
- **Framework**: Next.js App Router
- **Web3 Connectivity**: RainbowKit & Wagmi (v2)
- **Audio Engine**: HTML5 Audio API
- **Visuals & Layout**: Tailwind CSS & Space Grotesk typography
- **Interactive Graphs**: D3.js force-directed graph renderer
- **Micro-Animations**: Framer Motion & CSS keyframe floats

---

## 3. Core Production Features & Implementations

### 3.1. Structured Music Search Engine
- Implemented structured inputs for **Track Title** and **Artist Name** that query the global **MusicBrainz XML/JSON Search API** live (via `/api/search` on the sidecar).
- Users can search the global database and click **"Load & Play"** next to any search result. The sidecar automatically fetches its credits, maps splits, writes them to the blockchain, and registers it into the local catalog library.

### 3.2. x402 Stream Access Gate
- Added a secure HTTP 402 stream gate on `/api/stream/:mbid`. If a track is played, it requires a query parameter `txHash` confirming that `0.001 USDC` was sent on-chain to the Platform Wallet.
- The sidecar queries the Arc Testnet RPC via `publicClient.getTransaction` to verify the payment on-chain before returning the audio stream.
- Includes a premium modal popup in the browser prompting users to switch to Arc Testnet and sign the stream authorization fee.

### 3.3. Transaction Hash Polling
- Resolved Circle's asynchronous broadcast delay by adding a polling loop (`client.getTransaction`) in both the **royalty payments loop** and the **escrow claim API**.
- The sidecar polls Circle until the transaction is successfully broadcasted and a real, valid on-chain transaction hash is returned and saved to the SQLite database. All transaction hash links in the UI open valid, indexed block explorer pages on ArcScan.

### 3.4. Dynamic Wallets & Split Displays
- Refactored `/api/contributors` to scan all SQLite provenance graphs on-the-fly to extract the split basis points (BPS) and roles assigned to each contributor.
- Every card on the **Wallets** page reads and displays correct roles and split percentages (e.g. `30.0%` or `50.0%` instead of `—`) even when no track is currently playing.

### 3.5. On-Chain Claim Portal
- Enabled a live claim portal at `/claim`. Connected Web3 wallets query the database for matched escrow contributor accounts.
- Clicking **"Claim Now"** sends a request to the `/api/claim` backend, which uses the Circle SDK to withdraw all escrowed USDC funds from the contributor's Circle DCW wallet directly to their connected destination address on Arc Testnet.

### 3.6. Testnet Gas Faucet Safety Net
- Integrated an automatic testnet gas checker in the payment dispatcher. If the Platform Wallet's native USDC gas balance drops below 0.1 USDC, the sidecar automatically replenishes it with 1.0 USDC from the faucet/deployer account to guarantee uninterrupted demonstration flows.

---

## 4. System Architecture & Data Flow

```
                                 ┌──────────────────────┐
                                 │  React Web App (3000)│
                                 └──────────┬───────────┘
                                            │ FormData (Title, Audio File, Splits)
                                            ▼
┌────────────────────────┐       ┌──────────────────────┐
│  ProvenanceRegistry    │◄──────│   Sidecar API (3001) │
│  Smart Contract (Arc)  │  Viem │   (Express, SQLite)  │
└────────────────────────┘       └──────────┬───────────┘
                                            │ Circle DCW Client
                                            ▼
                                 ┌──────────────────────┐
                                 │  Circle API Gateway  │
                                 └──────────────────────┘
```

---

## 5. Smart Contract Specification

### `ProvenanceRegistry.sol`
- **Address**: `0x8d866b56e76c0052913f5d2374e6441CfeAB4790`
- **Properties**: Write-once per MBID (once registered, splits are immutable to prevent royalty manipulation).
- **Core Functions**:
  - `register(bytes32 mbid, address[] wallets, uint16[] bps, string[] roles)`: Validates BPS sum (exactly 10000) and registers splits.
  - `getSplits(bytes32 mbid)`: Returns the array of registered address-BPS splits.
  - `isRegistered(bytes32 mbid)`: Checks registration status.
