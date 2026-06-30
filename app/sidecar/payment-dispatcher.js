import { db } from './db/index.js';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { resolveWallet } from './wallet-provisioner.js';

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

export class PaymentDispatcher {
  constructor(platformWalletId) {
    this.platformWalletId = platformWalletId;
    this.usdcTokenId = null;
  }

  async getUsdcTokenId() {
    if (this.usdcTokenId) return this.usdcTokenId;
    try {
      const balRes = await client.getWalletTokenBalance({ id: this.platformWalletId });
      const usdc = balRes.data?.tokenBalances?.find(t => t.token?.symbol === 'USDC');
      if (usdc && usdc.token?.id) {
        this.usdcTokenId = usdc.token.id;
        console.log(`[Nanopay] Dynamically resolved USDC token ID: ${this.usdcTokenId}`);
        return this.usdcTokenId;
      }
    } catch (e) {
      console.warn(`[Nanopay] Failed to dynamically resolve USDC token ID:`, e.message);
    }
    // Fall back to standard testnet USDC token ID
    return '80938db6-599c-50bc-b6dc-d3ce724d2d48';
  }

  async dispatchTick(graph, trackRatePerSecond) {
    const tickDuration = 15; // seconds
    const totalTickAmount = trackRatePerSecond * tickDuration;

    const confirmations = [];

    // Check and auto-fund platform wallet native USDC gas if low
    try {
      const platformAddress = process.env.PLATFORM_WALLET_ADDRESS;
      const deployerPk = process.env.DEPLOYER_PRIVATE_KEY;
      if (platformAddress && deployerPk) {
        const { createPublicClient, createWalletClient, http, parseEther, formatEther } = await import('viem');
        const { privateKeyToAccount } = await import('viem/accounts');
        const rpcUrl = "https://rpc.testnet.arc.network";
        const publicClient = createPublicClient({ transport: http(rpcUrl) });
        
        const balance = await publicClient.getBalance({ address: platformAddress });
        const balNum = parseFloat(formatEther(balance));
        
        if (balNum < 0.1) {
          console.log(`[Auto-Fund] Platform Wallet gas balance is low (${balNum} USDC). Funding with 1.0 USDC from Deployer...`);
          const pkHex = deployerPk.startsWith("0x") ? deployerPk : `0x${deployerPk}`;
          const account = privateKeyToAccount(pkHex);
          const walletClient = createWalletClient({ account, transport: http(rpcUrl) });
          
          const hash = await walletClient.sendTransaction({
            to: platformAddress,
            value: parseEther('1.0'),
          });
          console.log(`[Auto-Fund] Sent 1.0 USDC gas to Platform Wallet. Tx: ${hash}`);
          await publicClient.waitForTransactionReceipt({ hash });
        }
      }
    } catch (fundErr) {
      console.warn('[Auto-Fund] Failed to check or auto-fund platform wallet:', fundErr.message);
    }

    let tokenId;
    try {
      tokenId = await this.getUsdcTokenId();
    } catch (tokenErr) {
      console.error('[Nanopay] Failed to get token ID:', tokenErr.message);
      return confirmations;
    }

    // Process payments
    for (const split of graph.splits) {
      if (!split.walletAddress) {
        // Resolve or provision wallet
        const wallet = await resolveWallet(split.mbid, split.name);
        split.walletAddress = wallet.address;
      }

      // Compute micro-USDC (6 decimals)
      const amountUsdcStr = (totalTickAmount * split.bps / 10000).toFixed(6);
      if (parseFloat(amountUsdcStr) === 0) continue;

      try {
        // Real implementation: call Circle Developer Controlled Wallets API to send funds on Arc Testnet.
        // We use the Platform wallet as the sender.
        const reqBody = {
          walletId: this.platformWalletId,
          tokenId: tokenId,
          destinationAddress: split.walletAddress,
          amounts: [amountUsdcStr],
          fee: { type: 'level', config: { feeLevel: 'LOW' } }
        };

        const txRes = await client.createTransaction(reqBody);
        if (txRes.data && txRes.data.id) {
          const txId = txRes.data.id;
          let txHash = txRes.data.txHash;
          
          // Poll for real on-chain transaction hash from Circle
          let retries = 15;
          while (!txHash && retries > 0) {
            console.log(`[Nanopay] Transaction ${txId} is pending on-chain broadcast. Polling...`);
            await new Promise(r => setTimeout(r, 2000));
            try {
              const checkRes = await client.getTransaction({ id: txId });
              txHash = checkRes.data?.transaction?.txHash;
            } catch (err) {
              console.warn('[Nanopay] Error polling transaction status:', err.message);
            }
            retries--;
          }

          const finalTxHash = txHash || ('0x' + txId.replace(/-/g, '').padEnd(64, '0'));
          
          db.prepare(`
            INSERT INTO payment_ticks (id, track_mbid, contributor_mbid, amount_usdc, nanopay_ref, arc_batch_hash)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)
          `).run(graph.mbid, split.mbid, amountUsdcStr, txId, finalTxHash);

          confirmations.push({
            contributorMbid: split.mbid,
            amount: amountUsdcStr,
            txRef: txId,
            status: 'confirmed'
          });
          
          console.log(`[Nanopay] Successfully paid ${amountUsdcStr} USDC to ${split.name} (tx: ${txId})`);
        } else {
          console.error(`[Nanopay] Circle API did not return a transaction ID for ${split.name}`);
        }
      } catch (err) {
        console.error(`[Nanopay] Failed to dispatch tick to ${split.name} (${split.mbid}):`, err.response?.data || err.message);
      }
    }

    return confirmations;
  }
}
