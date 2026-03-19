import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import MovieCard from "./MovieCard";
import TMDBSearch from "./TMDBSearch";

const API = "http://localhost:5000/api";
const GENRES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Animation", "Documentary", "Other"];

export default function WatchlistPage({ type }) {
  const { token, user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("All");
  const [filterWatched, setFilterWatched] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [showTMDB, setShowTMDB] = useState(false);
  const [form, setForm] = useState({ title: "", type, genre: "", description: "", poster_url: "", tmdb_id: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMovies();
    setForm((f) => ({ ...f, type }));
  }, [type]);

  async function fetchMovies() {
    try {
      const res = await axios.get(`${API}/movies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies(res.data.filter((m) => m.type === type));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API}/movies`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies([res.data, ...movies]);
      setForm({ title: "", type, genre: "", description: "", poster_url: "", tmdb_id: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add");
    }
  }

  function handleTMDBSelect(item) {
    setForm({
      title: item.title,
      type: item.type,
      genre: "",
      description: item.description,
      poster_url: item.poster_url || "",
      tmdb_id: item.tmdb_id,
    });
    setShowForm(true);
  }

  function handleUpdate(updated) {
    setMovies(movies.map((m) => (m.id === updated.id ? updated : m)));
  }

  function handleDelete(id) {
    setMovies(movies.filter((m) => m.id !== id));
  }

  function getRecommendations() {
    const unwatched = movies.filter((m) => !m.watched);
    if (unwatched.length === 0) return [];

    const genreScores = {};
    movies
      .filter((m) => m.watched && m.rating)
      .forEach((m) => {
        if (m.genre) {
          if (!genreScores[m.genre]) genreScores[m.genre] = { total: 0, count: 0 };
          genreScores[m.genre].total += m.rating;
          genreScores[m.genre].count += 1;
        }
      });

    const genreAvg = {};
    Object.entries(genreScores).forEach(([g, { total, count }]) => {
      genreAvg[g] = total / count;
    });

    return unwatched
      .map((m) => ({ ...m, score: genreAvg[m.genre] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  const recommendations = getRecommendations();

  const stats = {
    total: movies.length,
    watched: movies.filter((m) => m.watched).length,
    toWatch: movies.filter((m) => !m.watched).length,
  };

  const filtered = movies.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = filterGenre === "All" || m.genre === filterGenre;
    const matchWatched =
      filterWatched === "All" ||
      (filterWatched === "Watched" && m.watched) ||
      (filterWatched === "Unwatched" && !m.watched);
    return matchSearch && matchGenre && matchWatched;
  });

  const icon = type === "Movie" ? "🎬" : "📺";
  const label = type === "Movie" ? "Movies" : "TV Shows";

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>{icon} My {label}</h2>
          <p className="dashboard-sub">Welcome back, {user?.username}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-outline" onClick={() => { setShowTMDB(true); setShowForm(false); }}>
            🔍 Search {label}
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setShowTMDB(false); }}>
            {showForm ? "✕ Cancel" : "+ Add Manually"}
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat"><span className="stat-num">{stats.total}</span><span className="stat-label">Total</span></div>
        <div className="stat"><span className="stat-num">{stats.watched}</span><span className="stat-label">Watched</span></div>
        <div className="stat"><span className="stat-num">{stats.toWatch}</span><span className="stat-label">To Watch</span></div>
      </div>

      {showForm && (
        <form className="add-movie-form" onSubmit={handleAdd}>
          <h3>{form.tmdb_id ? "✓ From TMDB — confirm details" : `Add a ${label.slice(0, -1)}`}</h3>
          {error && <p className="error">{error}</p>}
          <input
            type="text"
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
            <option value="">Select Genre (optional)</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="url"
            placeholder="Poster URL"
            value={form.poster_url}
            onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
          />
          {form.poster_url && (
            <img src={form.poster_url} alt="poster preview" style={{ width: 80, borderRadius: 6 }} />
          )}
          <button type="submit" className="btn btn-primary">Add to Watchlist</button>
        </form>
      )}

      {recommendations.length > 0 && (
        <section className="recommendations">
          <h3 className="section-title">⚡ Up Next For You</h3>
          <p className="section-sub">Based on your highest rated genres</p>
          <div className="rec-row">
            {recommendations.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onUpdate={handleUpdate} onDelete={handleDelete} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-header">
          <h3 className="section-title">All {label}</h3>
          <div className="filters">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
              <option value="All">All Genres</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterWatched} onChange={(e) => setFilterWatched(e.target.value)}>
              <option value="All">All</option>
              <option value="Watched">Watched</option>
              <option value="Unwatched">Unwatched</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="empty">No {label.toLowerCase()} yet. Search or add one!</p>
        ) : (
          <div className="movies-grid">
            {filtered.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {showTMDB && (
        <TMDBSearch
          type={type}
          onSelect={handleTMDBSelect}
          onClose={() => setShowTMDB(false)}
        />
      )}
    </div>
  );
}
