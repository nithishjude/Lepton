import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { appendFileSync, readFileSync } from "node:fs";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

async function main() {
  // Step 1: Create a wallet set for provenance-pay
  const walletSetResponse = await client.createWalletSet({
    name: "provenance-pay",
  });

  const walletSet = walletSetResponse.data?.walletSet;
  if (!walletSet?.id) {
    throw new Error("Wallet set creation failed: no ID returned");
  }
  console.log("✅ Wallet Set created:", walletSet.id);

  // Step 2: Create the platform wallet on Arc Testnet
  const walletResponse = await client.createWallets({
    walletSetId: walletSet.id,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "EOA",
  });

  const wallet = walletResponse.data?.wallets?.[0];
  if (!wallet?.address) {
    throw new Error("Wallet creation failed: no address returned");
  }
  console.log("✅ Platform Wallet created:", wallet.address);
  console.log("   Wallet ID:", wallet.id);
  console.log("   Blockchain:", wallet.blockchain);

  // Step 3: Append to .env
  appendFileSync(
    ".env",
    `\nCIRCLE_WALLET_SET_ID=${walletSet.id}\nPLATFORM_WALLET_ADDRESS=${wallet.address}\nPLATFORM_WALLET_ID=${wallet.id}\n`
  );

  console.log("\n✅ Appended to .env:");
  console.log(`   CIRCLE_WALLET_SET_ID=${walletSet.id}`);
  console.log(`   PLATFORM_WALLET_ADDRESS=${wallet.address}`);
  console.log(`   PLATFORM_WALLET_ID=${wallet.id}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
