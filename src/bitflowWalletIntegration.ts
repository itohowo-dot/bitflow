/**
 * BitFlow WalletConnect Integration Example
 * Demonstrates how to use WalletConnect with BitFlow payment requests
 */

import { getWeb3Wallet } from "./walletConnect";

/**
 * Represents a BitFlow payment request
 */
interface BitFlowPaymentRequest {
  creator: string;
  recipient: string;
  amountInMicroBTC: number;
  memo: string;
  expirationBlock: number;
}

/**
 * Sign a payment request creation transaction
 */
export async function signCreatePaymentRequest(
  topic: string,
  request: BitFlowPaymentRequest
): Promise<string | null> {
  const wallet = getWeb3Wallet();

  if (!wallet) {
    throw new Error("WalletConnect not initialized");
  }

  try {
    // Construct the transaction data for bitflow::create-payment-tag
    const txData = {
      method: "stacks_signTransaction",
      params: {
        contractAddress: "SP...", // Your BitFlow contract address
        contractName: "bitflow",
        functionName: "create-payment-tag",
        functionArgs: [
          {
            type: "principal",
            value: request.recipient,
          },
          {
            type: "uint",
            value: request.amountInMicroBTC.toString(),
          },
          {
            type: "string-ascii",
            value: request.memo,
          },
          {
            type: "uint",
            value: request.expirationBlock.toString(),
          },
        ],
      },
    };

    console.log("Requesting signature for payment request:", txData);

    // The actual signing happens through the session request handler
    // which calls handleStacksSignTransaction in walletConnect.ts

    return "transaction_id";
  } catch (error) {
    console.error("Failed to sign payment request:", error);
    throw error;
  }
}

/**
 * Sign a payment fulfillment transaction
 */
export async function signFulfillPaymentRequest(
  topic: string,
  tagId: number,
  amountInMicroBTC: number
): Promise<string | null> {
  const wallet = getWeb3Wallet();

  if (!wallet) {
    throw new Error("WalletConnect not initialized");
  }

  try {
    const txData = {
      method: "stacks_signTransaction",
      params: {
        contractAddress: "SP...", // Your BitFlow contract address
        contractName: "bitflow",
        functionName: "fulfill-payment-tag",
        functionArgs: [
          {
            type: "uint",
            value: tagId.toString(),
          },
          {
            type: "uint",
            value: amountInMicroBTC.toString(),
          },
        ],
      },
    };

    console.log("Requesting signature for payment fulfillment:", txData);

    return "transaction_id";
  } catch (error) {
    console.error("Failed to sign payment fulfillment:", error);
    throw error;
  }
}

/**
 * Get user's Stacks accounts
 */
export async function getConnectedAccounts(
  topic: string
): Promise<string[]> {
  const wallet = getWeb3Wallet();

  if (!wallet) {
    throw new Error("WalletConnect not initialized");
  }

  try {
    const txData = {
      method: "stacks_getAccounts",
      params: {},
    };

    // In a real implementation, you would await the response
    // from the wallet through the session request handler

    return [];
  } catch (error) {
    console.error("Failed to get accounts:", error);
    throw error;
  }
}

/**
 * Sign a verification message for authentication
 */
export async function signAuthenticationMessage(
  topic: string,
  message: string
): Promise<string | null> {
  const wallet = getWeb3Wallet();

  if (!wallet) {
    throw new Error("WalletConnect not initialized");
  }

  try {
    const txData = {
      method: "stacks_signMessage",
      params: {
        message,
        domain: "bitflow.com",
      },
    };

    console.log("Requesting signature for authentication:", txData);

    return "signature";
  } catch (error) {
    console.error("Failed to sign message:", error);
    throw error;
  }
}

/**
 * Example: Complete flow for creating a BitFlow payment request
 */
export async function createBitFlowPaymentRequestFlow(
  connectedTopic: string,
  recipient: string,
  amountInMicroBTC: number,
  memo: string,
  expirationBlock: number
) {
  try {
    // Step 1: Prepare the payment request
    const paymentRequest: BitFlowPaymentRequest = {
      creator: "SP...", // This will come from the connected account
      recipient,
      amountInMicroBTC,
      memo,
      expirationBlock,
    };

    console.log("Creating BitFlow payment request:", paymentRequest);

    // Step 2: Sign the transaction
    const txId = await signCreatePaymentRequest(connectedTopic, paymentRequest);

    console.log("Payment request signed. Transaction ID:", txId);

    // Step 3: In a real app, you would submit the transaction to the Stacks network
    // and wait for confirmation

    return {
      success: true,
      transactionId: txId,
      paymentRequest,
    };
  } catch (error) {
    console.error("Flow failed:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
