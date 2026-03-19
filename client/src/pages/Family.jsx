import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000/api";

export default function Family() {
  const { token } = useAuth();
  const [data, setData] = useState({ family: null, members: [], role: null });
  const [loading, setLoading] = useState(true);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberMovies, setMemberMovies] = useState([]);

  useEffect(() => { fetchFamily(); }, []);

  async function fetchFamily() {
    try {
      const res = await axios.get(`${API}/family`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createFamily(e) {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API}/family/create`, { name: familyName }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Family created!");
      fetchFamily();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create family");
    }
  }

  async function joinFamily(e) {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${API}/family/join`, { invite_code: inviteCode }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Joined family!");
      fetchFamily();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid invite code");
    }
  }

  async function leaveFamily() {
    if (!confirm("Are you sure you want to leave this family?")) return;
    try {
      await axios.delete(`${API}/family/leave`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Left family");
      setData({ family: null, members: [], role: null });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave");
    }
  }

  async function deleteFamily() {
    if (!confirm("Delete this family? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/family`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Family deleted");
      setData({ family: null, members: [], role: null });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    }
  }

  async function removeMember(id) {
    if (!confirm("Remove this member?")) return;
    try {
      await axios.delete(`${API}/family/member/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchFamily();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  }

  async function viewMemberList(member) {
    try {
      const res = await axios.get(`${API}/family/member/${member.id}/movies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedMember(member);
      setMemberMovies(res.data);
    } catch (err) {
      setError("Could not load member's watchlist");
    }
  }

  if (loading) return <div className="empty">Loading...</div>;

  if (selectedMember) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h2>👤 {selectedMember.username}'s Watchlist</h2>
            <p className="dashboard-sub">{memberMovies.length} titles</p>
          </div>
          <button className="btn btn-outline" onClick={() => setSelectedMember(null)}>← Back to Family</button>
        </div>
        {memberMovies.length === 0 ? (
          <p className="empty">No titles added yet.</p>
        ) : (
          <div className="movies-grid">
            {memberMovies.map((m) => (
              <div key={m.id} className="movie-card">
                <div className="card-poster" style={m.poster_url ? { backgroundImage: `url(${m.poster_url})` } : {}}>
                  {!m.poster_url && <div className="card-no-poster">{m.type === "TV Show" ? "📺" : "🎬"}</div>}
                  <div className="card-overlay">
                    <div className="card-tags">
                      <span className={`type-tag ${m.type === "TV Show" ? "type-tv" : "type-movie"}`}>
                        {m.type === "TV Show" ? "📺 TV" : "🎬 Movie"}
                      </span>
                      {m.genre && <span className="genre-tag">{m.genre}</span>}
                    </div>
                    {m.watched && <span className="watched-badge">✓ Watched</span>}
                  </div>
                </div>
                <div className="movie-info">
                  <h3>{m.title}</h3>
                  {m.rating && (
                    <div className="rating">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`star ${m.rating >= s ? "filled" : ""}`}>★</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!data.family) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>👨‍👩‍👧‍👦 Family</h2>
        </div>

        {message && <p className="success-msg">{message}</p>}
        {error && <p className="error">{error}</p>}

        <div className="family-setup">
          <div className="family-card">
            <h3>Create a Family</h3>
            <p>Start a family account and invite up to 5 members. You'll be the admin.</p>
            <form onSubmit={createFamily}>
              <input
                type="text"
                placeholder="Family name (e.g. The Smiths)"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: "0.75rem" }}>
                Create Family
              </button>
            </form>
          </div>

          <div className="family-divider">or</div>

          <div className="family-card">
            <h3>Join a Family</h3>
            <p>Enter an invite code from your family admin.</p>
            <form onSubmit={joinFamily}>
              <input
                type="text"
                placeholder="Enter invite code (e.g. AB12CD)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                style={{ textTransform: "uppercase" }}
              />
              <button type="submit" className="btn btn-outline btn-full" style={{ marginTop: "0.75rem" }}>
                Join Family
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>👨‍👩‍👧‍👦 {data.family.name}</h2>
          <p className="dashboard-sub">
            {data.members.length}/6 members · You are {data.role === "admin" ? "the admin" : "a member"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {data.role === "admin" ? (
            <button className="btn btn-danger" onClick={deleteFamily}>Delete Family</button>
          ) : (
            <button className="btn btn-danger" onClick={leaveFamily}>Leave Family</button>
          )}
        </div>
      </div>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error">{error}</p>}

      {data.role === "admin" && (
        <div className="invite-box">
          <p className="invite-label">Invite Code</p>
          <div className="invite-code">{data.family.invite_code}</div>
          <p className="invite-hint">Share this code with up to 5 people to join your family</p>
        </div>
      )}

      <section>
        <h3 className="section-title" style={{ marginBottom: "1rem" }}>Members</h3>
        <div className="members-grid">
          {data.members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">{member.username[0].toUpperCase()}</div>
              <div className="member-info">
                <p className="member-name">{member.username}</p>
                <span className={`member-role ${member.family_role === "admin" ? "role-admin" : "role-member"}`}>
                  {member.family_role === "admin" ? "👑 Admin" : "Member"}
                </span>
              </div>
              <div className="member-actions">
                {data.role === "admin" && (
                  <button className="btn btn-outline" onClick={() => viewMemberList(member)}>
                    View List
                  </button>
                )}
                {data.role === "admin" && member.family_role !== "admin" && (
                  <button className="btn btn-danger" onClick={() => removeMember(member.id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
