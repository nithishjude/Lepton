import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";

// Generate a random 32-byte private key
const privateKey = "0x" + randomBytes(32).toString("hex");

// Derive address using viem (already installed via circle SDK deps)
// We'll use a simple approach with node crypto
console.log("=== DEPLOYER WALLET ===");
console.log("Private Key:", privateKey);
console.log("");
console.log("Next step: derive the address and fund it with Arc Testnet USDC");

// Append to .env
appendFileSync("../.env", `\nDEPLOYER_PRIVATE_KEY=${privateKey.slice(2)}\n`);
console.log("DEPLOYER_PRIVATE_KEY added to .env (without 0x prefix for forge)");
