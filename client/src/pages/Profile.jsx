import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API from "../api";

export default function Profile() {
  const { token, user } = useAuth();
  const [traktConnected, setTraktConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchTraktStatus();
    const trakt = searchParams.get("trakt");
    if (trakt === "connected") setMessage("✓ Trakt connected successfully!");
    if (trakt === "error") setError("Trakt connection failed. Please try again.");
  }, []);

  async function fetchTraktStatus() {
    try {
      const res = await axios.get(`${API}/trakt/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTraktConnected(res.data.connected);
    } catch (err) {
      console.error(err);
    }
  }

  async function connectTrakt() {
    try {
      const res = await axios.get(`${API}/trakt/auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.url;
    } catch (err) {
      setError("Failed to start Trakt connection");
    }
  }

  async function syncTrakt() {
    setSyncing(true);
    setMessage("");
    setError("");
    try {
      const res = await axios.post(`${API}/trakt/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnectTrakt() {
    if (!confirm("Disconnect Trakt? Your existing watchlist won't be affected.")) return;
    try {
      await axios.delete(`${API}/trakt/disconnect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTraktConnected(false);
      setMessage("Trakt disconnected");
    } catch (err) {
      setError("Failed to disconnect");
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>👤 Profile</h2>
          <p className="dashboard-sub">{user?.email}</p>
        </div>
      </div>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error">{error}</p>}

      {/* Account info */}
      <div className="profile-card">
        <h3>Account</h3>
        <div className="profile-row">
          <span className="profile-label">Username</span>
          <span className="profile-value">{user?.username}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user?.email}</span>
        </div>
      </div>

      {/* Trakt integration */}
      <div className="profile-card">
        <div className="trakt-header">
          <div>
            <h3>Trakt.tv Integration</h3>
            <p className="profile-hint">
              Connect your Trakt account to automatically sync your watch history from Netflix, Disney+, and more.
            </p>
          </div>
          <span className={`status-badge ${traktConnected ? "status-on" : "status-off"}`}>
            {traktConnected ? "● Connected" : "● Disconnected"}
          </span>
        </div>

        {traktConnected ? (
          <div className="trakt-actions">
            <button className="btn btn-primary" onClick={syncTrakt} disabled={syncing}>
              {syncing ? "Syncing..." : "⟳ Sync Watch History"}
            </button>
            <button className="btn btn-danger" onClick={disconnectTrakt}>Disconnect</button>
          </div>
        ) : (
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={connectTrakt}>
            Connect Trakt Account
          </button>
        )}

        <div className="data-protection">
          <h4>🔒 Data Protection</h4>
          <ul>
            <li>Your Trakt credentials are never stored — only a secure access token</li>
            <li>Tokens are stored encrypted and never exposed in API responses</li>
            <li>You can disconnect and delete your data at any time</li>
            <li>We only read your watch history — we never post or modify your Trakt data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
