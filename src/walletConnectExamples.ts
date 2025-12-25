/**
 * Example Implementation: Using WalletConnect with BitFlow
 * 
 * This file demonstrates a complete flow of connecting a wallet,
 * creating a payment request, and handling the response.
 */

import { initializeWalletConnect, getActiveSessions } from "./walletConnect";
import { signCreatePaymentRequest } from "./bitflowWalletIntegration";
import {
  isValidStacksAddress,
  formatBTCAmount,
  generateRequestId,
  retryWithBackoff,
} from "./walletConnectUtils";

/**
 * Example: Complete BitFlow payment request flow
 */
async function exampleBitFlowPaymentFlow() {
  try {
    console.log("=== BitFlow Payment Request Example ===\n");

    // Step 1: Initialize WalletConnect
    console.log("1. Initializing WalletConnect...");
    await initializeWalletConnect();
    console.log("   ✓ WalletConnect initialized\n");

    // Step 2: Wait for wallet connection
    console.log("2. Waiting for wallet connection...");
    await waitForWalletConnection();
    const sessions = await getActiveSessions();
    const connectedTopic = Object.keys(sessions)[0];

    if (!connectedTopic) {
      throw new Error("No wallet connected");
    }
    console.log(`   ✓ Wallet connected: ${connectedTopic}\n`);

    // Step 3: Get user details
    console.log("3. Getting user details...");
    const recipient = "SP2D5BGGJ956A635JG7CJA5VIK5IEBC653W71C34W";
    if (!isValidStacksAddress(recipient)) {
      throw new Error("Invalid recipient address");
    }
    console.log(`   ✓ Recipient: ${recipient}\n`);

    // Step 4: Create payment request
    console.log("4. Creating payment request...");
    const amountInBTC = 0.5;
    const amountInMicroBTC = Math.round(amountInBTC * 1_000_000);

    const paymentRequest = {
      creator: recipient,
      recipient: recipient,
      amountInMicroBTC,
      memo: `Invoice #${generateRequestId()}`,
      expirationBlock: 200000,
    };

    console.log(`   Amount: ${formatBTCAmount(amountInMicroBTC)}`);
    console.log(`   Memo: ${paymentRequest.memo}`);
    console.log(`   Expires: Block ${paymentRequest.expirationBlock}\n`);

    // Step 5: Sign the transaction
    console.log("5. Signing transaction...");
    const signature = await retryWithBackoff(
      () => signCreatePaymentRequest(connectedTopic, paymentRequest),
      3, // 3 attempts
      1000 // 1 second initial delay
    );

    console.log(`   ✓ Signed: ${signature}\n`);

    // Step 6: Submit to blockchain
    console.log("6. Submitting to blockchain...");
    // In a real app, you'd submit the transaction here
    console.log(
      "   (In production: submit transaction to Stacks network)\n"
    );

    console.log("✅ Payment request created successfully!");
    return {
      success: true,
      signature,
      paymentRequest,
    };
  } catch (error) {
    console.error("❌ Error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Wait for wallet connection with timeout
 */
async function waitForWalletConnection(
  maxWaitMs: number = 30000
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 500; // Check every 500ms

  while (Date.now() - startTime < maxWaitMs) {
    const sessions = await getActiveSessions();
    if (Object.keys(sessions).length > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  throw new Error(
    `Wallet connection timeout after ${maxWaitMs}ms. Please scan the QR code in your wallet.`
  );
}

/**
 * Example: Handle payment request with user input
 */
async function exampleWithUserInput() {
  const userInput = {
    recipientAddress: "SP2D5BGGJ956A635JG7CJA5VIK5IEBC653W71C34W",
    amountInBTC: 1.5,
    memo: "Payment for services",
    expirationDays: 7,
  };

  // Validate input
  if (!isValidStacksAddress(userInput.recipientAddress)) {
    console.error("Invalid Stacks address");
    return;
  }

  if (userInput.amountInBTC <= 0) {
    console.error("Amount must be positive");
    return;
  }

  // Calculate expiration block (roughly 6 blocks per hour)
  const blocksPerDay = 144; // 24 * 6
  const expirationBlock = 200000 + blocksPerDay * userInput.expirationDays;

  console.log("Payment Request Details:");
  console.log(`- Recipient: ${userInput.recipientAddress}`);
  console.log(`- Amount: ${formatBTCAmount(Math.round(userInput.amountInBTC * 1_000_000))}`);
  console.log(`- Memo: ${userInput.memo}`);
  console.log(`- Expires in ${userInput.expirationDays} days (Block ${expirationBlock})`);
}

/**
 * Example: Error handling and recovery
 */
async function exampleErrorHandling() {
  try {
    // Try to initialize WalletConnect with retry logic
    const result = await retryWithBackoff(
      async () => {
        const response = await initializeWalletConnect();
        return response;
      },
      3, // Retry 3 times
      1000 // Initial delay 1000ms, exponentially increases
    );

    console.log("Successfully initialized with retry logic");
  } catch (error) {
    // Final error after all retries
    console.error("Failed after all retries:", error);

    // Handle different error types
    if (error instanceof Error) {
      if (error.message.includes("Project ID")) {
        console.error(
          "Configure your WalletConnect Project ID in .env.local"
        );
      } else if (error.message.includes("Network")) {
        console.error("Check your internet connection");
      }
    }
  }
}

/**
 * Example: Session monitoring
 */
async function exampleSessionMonitoring() {
  const sessions = await getActiveSessions();

  console.log(`Active Sessions: ${Object.keys(sessions).length}`);

  for (const [topic, session] of Object.entries(sessions)) {
    console.log(`\nSession: ${topic.substring(0, 20)}...`);
    console.log(`  App: ${(session as any).peer?.metadata?.name}`);
    console.log(`  Chains: ${(session as any).namespaces?.stacks?.chains}`);
    console.log(
      `  Methods: ${(session as any).namespaces?.stacks?.methods?.join(", ")}`
    );
  }
}

/**
 * Example: Creating different types of transactions
 */
async function exampleVariousTransactions(topic: string) {
  // Example 1: Transfer sBTC
  const transferExample = {
    method: "stacks_signTransaction",
    params: {
      contractAddress: "SP2D5BGGJ956A635JG7CJA5VIK5IEBC653W71C34W",
      contractName: "sbtc",
      functionName: "transfer",
      functionArgs: [
        { type: "principal", value: "SP..." },
        { type: "uint", value: "1000000" }, // 1 sBTC in satoshis
      ],
    },
  };

  // Example 2: Custom contract call
  const customContractExample = {
    method: "stacks_signTransaction",
    params: {
      contractAddress: "SP...",
      contractName: "bitflow",
      functionName: "create-payment-tag",
      functionArgs: [
        { type: "principal", value: "SP..." },
        { type: "uint", value: "500000" },
        { type: "string-ascii", value: "Invoice #123" },
        { type: "uint", value: "200000" },
      ],
    },
  };

  console.log("Transaction Examples:");
  console.log("1. Transfer sBTC:", transferExample);
  console.log("2. Create Payment Tag:", customContractExample);
}

/**
 * Example: React Component Usage
 */
function ExampleReactComponent() {
  return `
import { useState, useEffect } from 'react';
import WalletConnectComponent from './src/WalletConnect';
import { signCreatePaymentRequest } from './src/bitflowWalletIntegration';
import { getActiveSessions } from './src/walletConnect';

export function PaymentForm() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const activeSessions = await getActiveSessions();
    setSessions(Object.entries(activeSessions));
  }

  async function handleCreatePayment() {
    if (sessions.length === 0) {
      alert('Please connect a wallet first');
      return;
    }

    setLoading(true);
    try {
      const [topic] = sessions[0];
      await signCreatePaymentRequest(topic, {
        creator: 'SP...',
        recipient: 'SP...',
        amountInMicroBTC: 1000000,
        memo: 'Payment request',
        expirationBlock: 200000,
      });
      alert('Payment request created!');
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>BitFlow Payment</h1>
      <WalletConnectComponent />
      
      <div>
        <h2>Create Payment Request</h2>
        <button 
          onClick={handleCreatePayment}
          disabled={loading || sessions.length === 0}
        >
          {loading ? 'Creating...' : 'Create Payment'}
        </button>
      </div>
    </div>
  );
}
`;
}

// Export examples for testing
export {
  exampleBitFlowPaymentFlow,
  exampleWithUserInput,
  exampleErrorHandling,
  exampleSessionMonitoring,
  exampleVariousTransactions,
  ExampleReactComponent,
  waitForWalletConnection,
};

// For Node.js testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Run these examples in your browser or in a Node.js environment");
  console.log("Examples available:");
  console.log("- exampleBitFlowPaymentFlow()");
  console.log("- exampleWithUserInput()");
  console.log("- exampleErrorHandling()");
  console.log("- exampleSessionMonitoring()");
  console.log("- exampleVariousTransactions()");
}
