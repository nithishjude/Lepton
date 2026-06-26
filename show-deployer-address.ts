import { privateKeyToAddress } from "viem/accounts";

const pk = process.env.DEPLOYER_PRIVATE_KEY!;
// pk in .env is stored without 0x prefix (forge format)
const address = privateKeyToAddress(`0x${pk}` as `0x${string}`);
console.log("Deployer Address:", address);
console.log("");
console.log("Fund this address with Arc Testnet USDC at:");
console.log("https://faucet.circle.com");
console.log("Select: Arc Testnet → paste address above → request USDC");
