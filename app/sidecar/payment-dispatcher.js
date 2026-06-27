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
    const tickDuration = 2; // seconds
    const totalTickAmount = trackRatePerSecond * tickDuration;

    const confirmations = [];
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
          
          db.prepare(`
            INSERT INTO payment_ticks (id, track_mbid, contributor_mbid, amount_usdc, nanopay_ref)
            VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?)
          `).run(graph.mbid, split.mbid, amountUsdcStr, txId);

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
