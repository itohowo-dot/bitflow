import React, { useState, useEffect } from "react";
import { initializeWalletConnect, getActiveSessions, disconnectSession } from "./walletConnect";

/**
 * WalletConnect Component for BitFlow
 * Provides UI for connecting and managing Stacks wallet connections
 */

export const WalletConnectComponent: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [uri, setUri] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize WalletConnect on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeWalletConnect();
        setIsInitialized(true);
        await loadActiveSessions();
      } catch (err) {
        setError(String(err));
      }
    };

    init();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const sessions = await getActiveSessions();
      setActiveSessions(Object.values(sessions));
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const handleConnectWallet = async () => {
    if (!uri.trim()) {
      setError("Please enter a valid pairing URI");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The wallet app will scan the QR code or paste the URI
      // WalletConnect will handle the pairing automatically
      console.log("Attempting to pair with URI:", uri);
      // In a real app, you'd pass the URI to your wallet pairing method
      setUri("");
      await loadActiveSessions();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (topic: string) => {
    try {
      await disconnectSession(topic);
      await loadActiveSessions();
    } catch (err) {
      setError(String(err));
    }
  };

  if (!isInitialized) {
    return <div className="wallet-connect-container">Initializing WalletConnect...</div>;
  }

  return (
    <div className="wallet-connect-container">
      <h2>Connect Stacks Wallet</h2>

      <div className="connect-section">
        <h3>New Connection</h3>
        <div className="uri-input-group">
          <input
            type="text"
            placeholder="Paste wallet connection URI or scan QR code"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleConnectWallet}
            disabled={loading || !uri.trim()}
            className="connect-button"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="sessions-section">
        <h3>Active Sessions ({activeSessions.length})</h3>
        {activeSessions.length === 0 ? (
          <p className="no-sessions">No active sessions</p>
        ) : (
          <ul className="sessions-list">
            {activeSessions.map((session: any) => (
              <li key={session.topic} className="session-item">
                <div className="session-info">
                  <p className="session-name">{session.peer?.metadata?.name || "Unknown"}</p>
                  <p className="session-topic">
                    {session.topic.substring(0, 20)}...
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(session.topic)}
                  className="disconnect-button"
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .wallet-connect-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        h2 {
          margin-top: 0;
          color: #333;
        }

        .connect-section,
        .sessions-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        h3 {
          margin-top: 0;
          color: #555;
          font-size: 16px;
        }

        .uri-input-group {
          display: flex;
          gap: 10px;
        }

        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: monospace;
        }

        button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        button:hover:not(:disabled) {
          background: #0056b3;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #d32f2f;
          padding: 10px;
          background: #ffebee;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .no-sessions {
          color: #999;
          font-style: italic;
          margin: 10px 0;
        }

        .sessions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .session-info {
          flex: 1;
        }

        .session-name {
          margin: 0;
          font-weight: 500;
          color: #333;
        }

        .session-topic {
          margin: 5px 0 0 0;
          color: #999;
          font-size: 12px;
          font-family: monospace;
        }

        .disconnect-button {
          background: #f44336;
          padding: 8px 16px;
          font-size: 13px;
        }

        .disconnect-button:hover {
          background: #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default WalletConnectComponent;
