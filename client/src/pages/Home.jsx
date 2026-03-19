import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: "🎬",
    title: "Movies & TV Shows",
    desc: "Track everything you want to watch or have already seen, split into dedicated movie and TV show libraries.",
  },
  {
    icon: "⚡",
    title: "Smart Recommendations",
    desc: "Our algorithm learns from your ratings and surfaces the titles you're most likely to love next.",
  },
  {
    icon: "🔗",
    title: "Trakt.tv Sync",
    desc: "Connect your Trakt account to automatically import your watch history from Netflix, Disney+, and more.",
  },
  {
    icon: "🔍",
    title: "TMDB Database",
    desc: "Search millions of titles with posters and descriptions already filled in — powered by The Movie Database.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family Accounts",
    desc: "Create a family group with up to 6 members. Admins can browse every member's watchlist.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    desc: "Your data stays yours. Streaming credentials are never stored — only secure OAuth tokens.",
  },
];

const STEPS = [
  { num: "01", title: "Create an account", desc: "Sign up for free in seconds." },
  { num: "02", title: "Search or add titles", desc: "Browse the TMDB database or add anything manually." },
  { num: "03", title: "Track & rate", desc: "Mark titles watched and rate them with stars." },
  { num: "04", title: "Get recommendations", desc: "Let the app tell you what to watch next." },
];

export default function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to="/movies" />;

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <span className="hero-badge">Your personal streaming companion</span>
          <h1 className="hero-title">
            Track Every Movie<br />& TV Show You Love
          </h1>
          <p className="hero-sub">
            One place for your entire watchlist. Connect streaming services,
            discover what to watch next, and share with family.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
          </div>
        </div>

        <div className="hero-cards">
          {[
            { title: "Inception", genre: "Sci-Fi", rating: 5, watched: true, emoji: "🎬" },
            { title: "Breaking Bad", genre: "Drama", rating: 5, watched: true, emoji: "📺" },
            { title: "Dune: Part Two", genre: "Sci-Fi", watched: false, emoji: "🎬" },
            { title: "The Bear", genre: "Drama", watched: false, emoji: "📺" },
          ].map((card, i) => (
            <div key={i} className={`preview-card preview-card-${i}`}>
              <div className="preview-card-top">
                <span className="preview-emoji">{card.emoji}</span>
                {card.watched && <span className="watched-badge">✓ Watched</span>}
              </div>
              <p className="preview-title">{card.title}</p>
              <span className="genre-tag">{card.genre}</span>
              {card.rating && (
                <div className="rating" style={{ marginTop: "0.4rem" }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`star ${card.rating >= s ? "filled" : ""}`}>★</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-section">
        <p className="section-label">Everything you need</p>
        <h2 className="section-heading">Built for serious watchers</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="home-section">
        <p className="section-label">Simple by design</p>
        <h2 className="section-heading">Up and running in minutes</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="step-card">
              <span className="step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="cta-banner">
        <div className="cta-glow" />
        <h2>Ready to build your watchlist?</h2>
        <p>Free forever. No credit card needed.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Create Your Account</Link>
      </section>
    </div>
  );
}
