import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000/api";

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${time}, ${name}`;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/movies`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setMovies(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:   movies.length,
    watched: movies.filter((m) => m.watched).length,
    toWatch: movies.filter((m) => !m.watched).length,
    movies:  movies.filter((m) => m.type === "Movie").length,
    shows:   movies.filter((m) => m.type === "TV Show").length,
    avgRating: (() => {
      const rated = movies.filter((m) => m.rating);
      return rated.length ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1) : null;
    })(),
  };

  // Up Next — unwatched, ranked by genre score from ratings
  const upNext = (() => {
    const unwatched = movies.filter((m) => !m.watched);
    const genreAvg = {};
    movies.filter((m) => m.watched && m.rating).forEach((m) => {
      if (m.genre) {
        if (!genreAvg[m.genre]) genreAvg[m.genre] = { t: 0, c: 0 };
        genreAvg[m.genre].t += m.rating;
        genreAvg[m.genre].c += 1;
      }
    });
    return unwatched
      .map((m) => ({ ...m, score: genreAvg[m.genre] ? genreAvg[m.genre].t / genreAvg[m.genre].c : 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  })();

  // Recently watched
  const recentlyWatched = movies.filter((m) => m.watched).slice(0, 5);

  const NAV_CARDS = [
    { to: "/movies",  icon: "🎬", label: "Movies",   count: stats.movies, color: "card-indigo" },
    { to: "/tv",      icon: "📺", label: "TV Shows", count: stats.shows,  color: "card-cyan"   },
    { to: "/family",  icon: "👨‍👩‍👧‍👦", label: "Family",  count: null,         color: "card-violet" },
    { to: "/profile", icon: "👤", label: "Profile",  count: null,         color: "card-slate"  },
  ];

  return (
    <div className="db-page">
      {/* Hero greeting */}
      <section className="db-hero">
        <div className="db-hero-glow" />
        <div className="db-hero-content">
          <h1 className="db-greeting">{greeting(user?.username || "there")} 👋</h1>
          <p className="db-greeting-sub">
            {stats.total === 0
              ? "Your watchlist is empty — start adding titles!"
              : `You have ${stats.toWatch} title${stats.toWatch !== 1 ? "s" : ""} left to watch.`}
          </p>
        </div>
      </section>

      {/* Stats */}
      {stats.total > 0 && (
        <section className="db-stats">
          {[
            { num: stats.total,   label: "Total Titles" },
            { num: stats.watched, label: "Watched" },
            { num: stats.toWatch, label: "To Watch" },
            { num: stats.movies,  label: "Movies" },
            { num: stats.shows,   label: "TV Shows" },
            { num: stats.avgRating ? `${stats.avgRating}★` : "—", label: "Avg Rating" },
          ].map((s) => (
            <div key={s.label} className="db-stat">
              <span className="db-stat-num">{s.num}</span>
              <span className="db-stat-label">{s.label}</span>
            </div>
          ))}
        </section>
      )}

      {/* Navigation cards */}
      <section className="db-section">
        <h2 className="db-section-title">Browse</h2>
        <div className="db-nav-grid">
          {NAV_CARDS.map((c) => (
            <Link key={c.to} to={c.to} className={`db-nav-card ${c.color}`}>
              <span className="db-nav-icon">{c.icon}</span>
              <span className="db-nav-label">{c.label}</span>
              {c.count != null && (
                <span className="db-nav-count">{c.count} titles</span>
              )}
              <span className="db-nav-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Up Next */}
      {upNext.length > 0 && (
        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">⚡ Up Next For You</h2>
            <p className="db-section-sub">Based on your highest rated genres</p>
          </div>
          <div className="db-row">
            {upNext.map((m) => <MiniCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}

      {/* Recently watched */}
      {recentlyWatched.length > 0 && (
        <section className="db-section">
          <div className="db-section-header">
            <h2 className="db-section-title">✓ Recently Watched</h2>
            <p className="db-section-sub">Your latest completions</p>
          </div>
          <div className="db-row">
            {recentlyWatched.map((m) => <MiniCard key={m.id} movie={m} watched />)}
          </div>
        </section>
      )}

      {/* Empty state CTA */}
      {!loading && stats.total === 0 && (
        <section className="db-empty-cta">
          <div className="db-empty-glow" />
          <p className="db-empty-icon">🎬</p>
          <h2>Start building your watchlist</h2>
          <p>Search millions of titles from the TMDB database or add anything manually.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/movies" className="btn btn-primary btn-lg">Browse Movies</Link>
            <Link to="/tv" className="btn btn-outline btn-lg">Browse TV Shows</Link>
          </div>
        </section>
      )}
    </div>
  );
}

function MiniCard({ movie, watched }) {
  const hasPoster = !!movie.poster_url;
  return (
    <div className="mini-card">
      <div
        className="mini-card-poster"
        style={hasPoster ? { backgroundImage: `url(${movie.poster_url})` } : {}}
      >
        {!hasPoster && <span className="mini-card-emoji">{movie.type === "TV Show" ? "📺" : "🎬"}</span>}
        <div className="mini-card-overlay">
          {watched && <span className="watched-badge">✓</span>}
          <span className={`type-tag ${movie.type === "TV Show" ? "type-tv" : "type-movie"}`}>
            {movie.type === "TV Show" ? "TV" : "Film"}
          </span>
        </div>
      </div>
      <div className="mini-card-info">
        <p className="mini-card-title">{movie.title}</p>
        {movie.genre && <span className="genre-tag">{movie.genre}</span>}
        {movie.rating && (
          <div className="rating" style={{ marginTop: "0.25rem" }}>
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`star ${movie.rating >= s ? "filled" : ""}`}>★</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
