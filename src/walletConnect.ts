import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { buildApprovedNamespaces, getSupportedChains } from "@walletconnect/utils";

/**
 * WalletConnect integration for BitFlow
 * Supports Stacks chain for sBTC payment transactions
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
        description: "Smart Bitcoin Payment Request Protocol",
        url: "https://bitflow.com",
        icons: ["https://bitflow.com/icon.png"],
      },
    });

    setupEventListeners();
    console.log("WalletConnect initialized successfully");
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
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: {
          stacks: {
            chains: ["stacks:1"], // Mainnet
            methods: [
              "stacks_signTransaction",
              "stacks_signMessage",
              "stacks_getAccounts",
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

      console.log("Session approved");
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
        case "stacks_signTransaction":
          await handleStacksSignTransaction(id, topic, request);
          break;
        case "stacks_signMessage":
          await handleStacksSignMessage(id, topic, request);
          break;
        case "stacks_getAccounts":
          await handleStacksGetAccounts(id, topic);
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
    console.log("Session deleted");
  });
}

async function handleStacksSignTransaction(
  id: number,
  topic: string,
  request: any
) {
  // Implementation for signing Stacks transactions
  // This would typically involve your app's signing logic
  console.log("Signing transaction:", request.params);

  // Example response
  const signature = "0x..."; // Your actual signature

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { signature },
  });
}

async function handleStacksSignMessage(
  id: number,
  topic: string,
  request: any
) {
  // Implementation for signing messages
  console.log("Signing message:", request.params);

  const signature = "0x..."; // Your actual signature

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { signature },
  });
}

async function handleStacksGetAccounts(id: number, topic: string) {
  // Return connected accounts
  const accounts = [
    "stacks:1:SP2D5BGGJ956A635JG7CJA5VIK5IEBC653W71C34W", // Example account
  ];

  await web3wallet.respondSessionRequest({
    topic,
    requestId: id,
    result: { accounts },
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
      message: "User disconnected",
    },
  });
}
