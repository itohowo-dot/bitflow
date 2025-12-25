import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { buildApprovedNamespaces, getSupportedChains } from "@walletconnect/utils";

/**
 * WalletConnect integration for BitFlow
 * Supports Stacks chain for sBTC payment transactions
 * 
 * Best practices from Stacks docs:
 * - Filter addresses by symbol: "STX"
 * - Use micro-STX (μSTX) for all amounts
 * - Always include network identifier (mainnet/testnet/devnet)
 * - Store session properties to avoid re-requesting addresses
 * - Handle optional broadcast parameter (default: false)
 */

// Initialize Core
const core = new Core({
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || "",
});

// Initialize Web3Wallet
let web3wallet: Web3Wallet;

export async function initializeWalletConnect() {
  try {
    web3wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: "BitFlow",
        description: "Smart Bitcoin Payment Request Protocol on Stacks",
        url: "https://bitflow.com",
        icons: ["https://bitflow.com/icon.png"],
      },
    });

    setupEventListeners();
    console.log("WalletConnect initialized successfully for Stacks");
    return web3wallet;
  } catch (error) {
    console.error("Failed to initialize WalletConnect:", error);
    throw error;
  }
}

function setupEventListeners() {
  // Listen for session proposals
  web3wallet.on("session_proposal", async (proposal) => {
    try {
      const { id, params } = proposal;
      const { requiredNamespaces, optionalNamespaces, relays } = params;

      console.log("Session proposal received:", proposal);

      // Build approved namespaces with Stacks chain
      // Per Stacks docs: Support stx_getAddresses, stx_signTransaction, stx_signMessage, stx_callContract
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: {
          stacks: {
            chains: ["stacks:1"], // Mainnet (stacks:2147483648 for testnet)
            methods: [
              "stx_getAddresses",        // Get wallet addresses (filter by symbol: "STX")
              "stx_signTransaction",     // Sign smart contract transactions
              "stx_signMessage",         // Sign messages for authentication
              "stx_callContract",        // Direct contract method calls
              "stx_transferStx",         // Transfer STX/sBTC tokens
              "stx_signStructuredMessage", // SIP-018 structured message signing
            ],
            events: ["chainChanged", "accountsChanged"],
          },
        },
      });

      // Approve the session
      await web3wallet.approveSession({
        id,
        relayProtocol: relays[0].protocol,
        namespaces: approvedNamespaces,
      });

      console.log("Session approved - wallet ready for BitFlow operations");
    } catch (error) {
      console.error("Error handling session proposal:", error);
    }
  });

  // Listen for session requests
  web3wallet.on("session_request", async (requestEvent) => {
    const { topic, params, id } = requestEvent;
    const { request, chainId } = params;

    console.log("Session request received:", {
      method: request.method,
      chainId,
    });

    try {
      switch (request.method) {
        case "stx_getAddresses":
          await handleStacksGetAddresses(id, topic);
          break;
        case "stx_signTransaction":
          await handleStacksSignTransaction(id, topic, request);
          break;
        case "stx_signMessage":
          await handleStacksSignMessage(id, topic, request);
          break;
        case "stx_callContract":
          await handleStacksCallContract(id, topic, request);
          break;
        case "stx_transferStx":
          await handleStacksTransferStx(id, topic, request);
          break;
        case "stx_signStructuredMessage":
          await handleStacksSignStructuredMessage(id, topic, request);
          break;
        default:
          await web3wallet.respondSessionRequest({
            topic,
            requestId: id,
            result: { error: `Unsupported method: ${request.method}` },
          });
      }
    } catch (error) {
      console.error("Error handling session request:", error);
      await web3wallet.respondSessionRequest({
        topic,
        requestId: id,
        result: { error: String(error) },
      });
    }
  });

  // Listen for session delete
  web3wallet.on("session_delete", () => {
    console.log("Session deleted by wallet");
  });
}

/**
 * Per Stacks docs: stx_getAddresses
 * Return addresses with symbol: "STX"
 * Dapps should filter by "STX" symbol to get Stacks addresses
 */
async function handleStacksGetAddresses(id: number, topic: string) {
  const addresses = [
    {
      symbol: "STX",
      address: "SP2D5BGGJ956A635JG7CJA5VIK5IEBC653W71C34W",
      publicKey: "...", // Optional: Include for session properties
    },
  ];

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { addresses },
  });
}

/**
 * Per Stacks docs: stx_signTransaction
 * Parameters: transaction (hex), broadcast (optional, default: false), network (optional)
 * Response: signature, transaction, txid (if broadcast=true)
 */
async function handleStacksSignTransaction(
  id: number,
  topic: string,
  request: any
) {
  const { transaction, broadcast = false, network = "mainnet" } = request.params;

  console.log("Signing transaction:", {
    broadcast,
    network,
    txLength: transaction?.length || 0,
  });

  // In production, implement actual transaction signing
  // For now, return a mock response
  const signature = "0x..."; // Replace with actual signature
  const txid = broadcast
    ? "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b"
    : undefined;

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { signature, transaction, txid },
  });
}

/**
 * Per Stacks docs: stx_signMessage
 * Parameters: address, message, messageType (utf8 or structured), network, domain (for structured)
 * Response: signature
 */
async function handleStacksSignMessage(
  id: number,
  topic: string,
  request: any
) {
  const { address, message, messageType = "utf8", network = "mainnet", domain } = request.params;

  console.log("Signing message:", {
    address,
    messageType,
    network,
    messageLength: message?.length || 0,
  });

  const signature = "0x..."; // Replace with actual signature

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { signature },
  });
}

/**
 * Per Stacks docs: stx_callContract
 * Wrapper for stx_signTransaction that calls a contract function
 * Parameters: contract (address.contract-name), functionName, functionArgs
 * Response: txid, transaction
 */
async function handleStacksCallContract(
  id: number,
  topic: string,
  request: any
) {
  const { contract, functionName, functionArgs = [] } = request.params;

  console.log("Calling contract:", {
    contract,
    functionName,
    argsCount: functionArgs.length,
  });

  const txid = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b";
  const transaction = "0x..."; // Replace with actual transaction

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { txid, transaction },
  });
}

/**
 * Per Stacks docs: stx_transferStx
 * Transfer STX or sBTC tokens
 * Parameters: sender, recipient, amount (in micro-STX), memo (optional), network
 * Response: txid, transaction
 */
async function handleStacksTransferStx(
  id: number,
  topic: string,
  request: any
) {
  const { sender, recipient, amount, memo = "", network = "mainnet" } = request.params;

  console.log("Transferring STX:", {
    sender,
    recipient,
    amount, // In micro-STX
    network,
  });

  const txid = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b";
  const transaction = "0x..."; // Replace with actual transaction

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { txid, transaction },
  });
}

/**
 * Per Stacks docs: stx_signStructuredMessage
 * Domain-bound structured signing per SIP-018
 * Parameters: message (string or object), domain (string or object)
 * Response: signature, publicKey (optional)
 */
async function handleStacksSignStructuredMessage(
  id: number,
  topic: string,
  request: any
) {
  const { message, domain } = request.params;

  console.log("Signing structured message per SIP-018");

  const signature = "0x..."; // Replace with actual signature
  const publicKey = "0x04..."; // Optional

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { signature, publicKey },
  });
}

export function getWeb3Wallet() {
  return web3wallet;
}

export async function getActiveSessions() {
  return web3wallet.getActiveSessions();
}

export async function disconnectSession(topic: string) {
  await web3wallet.disconnectSession({
    topic,
    reason: {
      code: 6000,
      message: "User disconnected from BitFlow",
    },
  });
}

