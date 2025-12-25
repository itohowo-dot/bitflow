/**
 * Utility functions for WalletConnect operations
 */

import { getWeb3Wallet } from "./walletConnect";

/**
 * Generate a pairing URI for wallet connections
 */
export async function generatePairingUri(): Promise<string> {
  const web3wallet = getWeb3Wallet();
  if (!web3wallet) {
    throw new Error("WalletConnect not initialized");
  }

  // Create a new pairing
  const { uri } = await web3wallet.core.pairing.create();
  return uri;
}

/**
 * Pair with a wallet using URI
 */
export async function pairWithUri(uri: string): Promise<boolean> {
  const web3wallet = getWeb3Wallet();
  if (!web3wallet) {
    throw new Error("WalletConnect not initialized");
  }

  try {
    await web3wallet.core.pairing.pair({ uri });
    return true;
  } catch (error) {
    console.error("Pairing failed:", error);
    return false;
  }
}

/**
 * Format Stacks address
 */
export function formatStacksAddress(address: string): string {
  if (!address.startsWith("SP") && !address.startsWith("SN")) {
    throw new Error("Invalid Stacks address");
  }
  return address.toUpperCase();
}

/**
 * Validate Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  // Basic validation for Stacks mainnet and testnet addresses
  return /^(SP|SN)[0-9A-Z]{39}$/.test(address);
}

/**
 * Convert microBTC to BTC
 */
export function microBtcToBtc(microBtc: number): number {
  return microBtc / 1_000_000;
}

/**
 * Convert BTC to microBTC
 */
export function btcToMicroBtc(btc: number): number {
  return Math.round(btc * 1_000_000);
}

/**
 * Format amount for display
 */
export function formatBTCAmount(
  microBtc: number,
  decimals: number = 6
): string {
  const btc = microBtcToBtc(microBtc);
  return btc.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get session details
 */
export async function getSessionDetails(topic: string): Promise<any> {
  const web3wallet = getWeb3Wallet();
  if (!web3wallet) {
    throw new Error("WalletConnect not initialized");
  }

  const sessions = web3wallet.getActiveSessions();
  return sessions[topic];
}

/**
 * Get all active session topics
 */
export async function getActiveSessions(): Promise<string[]> {
  const web3wallet = getWeb3Wallet();
  if (!web3wallet) {
    throw new Error("WalletConnect not initialized");
  }

  const sessions = web3wallet.getActiveSessions();
  return Object.keys(sessions);
}

/**
 * Check if a session is active
 */
export async function isSessionActive(topic: string): Promise<boolean> {
  const activeSessions = await getActiveSessions();
  return activeSessions.includes(topic);
}

/**
 * Format blockchain namespace for display
 */
export function formatNamespace(namespace: string): string {
  const displayNames: Record<string, string> = {
    stacks: "Stacks (sBTC)",
    ethereum: "Ethereum",
    solana: "Solana",
  };

  return displayNames[namespace] || namespace;
}

/**
 * Get chain display name
 */
export function getChainName(chainId: string): string {
  const chainNames: Record<string, string> = {
    "stacks:1": "Stacks Mainnet",
    "stacks:2147483648": "Stacks Testnet",
    "stacks:2147483649": "Stacks Devnet",
  };

  return chainNames[chainId] || chainId;
}

/**
 * Create a properly formatted transaction object
 */
export interface StacksTransaction {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: Array<{
    type: string;
    value: string;
  }>;
}

/**
 * Validate transaction object
 */
export function isValidStacksTransaction(
  tx: Partial<StacksTransaction>
): boolean {
  return !!(
    tx.contractAddress &&
    isValidStacksAddress(tx.contractAddress) &&
    tx.contractName &&
    tx.functionName &&
    Array.isArray(tx.functionArgs)
  );
}

/**
 * Parse connection URI
 */
export function parseConnectionUri(uri: string): {
  protocol: string;
  version: string;
  topic: string;
  relay: any;
  symKey: string;
} | null {
  try {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);

    return {
      protocol: url.protocol.replace(":", ""),
      version: params.get("v") || "2",
      topic: url.host,
      relay: JSON.parse(params.get("relay") || "{}"),
      symKey: params.get("symKey") || "",
    };
  } catch (error) {
    console.error("Invalid URI format:", error);
    return null;
  }
}

/**
 * Create a delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(
          `Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`
        );
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error("Max retry attempts reached");
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Log transaction details (for debugging)
 */
export function logTransaction(tx: StacksTransaction): void {
  console.log("=== Stacks Transaction ===");
  console.log("Contract:", `${tx.contractAddress}.${tx.contractName}`);
  console.log("Function:", tx.functionName);
  console.log("Arguments:");
  tx.functionArgs.forEach((arg, index) => {
    console.log(`  [${index}] ${arg.type}: ${arg.value}`);
  });
  console.log("==========================");
}
