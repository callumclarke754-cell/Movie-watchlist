import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function MovieCard({ movie, onUpdate, onDelete, featured = false }) {
  const { token } = useAuth();
  const API = "http://localhost:5000/api";

  async function toggleWatched() {
    try {
      const res = await axios.patch(
        `${API}/movies/${movie.id}/watched`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function rateMovie(rating) {
    try {
      const res = await axios.patch(
        `${API}/movies/${movie.id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteMovie() {
    try {
      await axios.delete(`${API}/movies/${movie.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(movie.id);
    } catch (err) {
      console.error(err);
    }
  }

  const hasPoster = !!movie.poster_url;

  return (
    <div className={`movie-card ${movie.watched ? "watched" : ""} ${featured ? "featured-card" : ""}`}>
      <div
        className="card-poster"
        style={hasPoster ? { backgroundImage: `url(${movie.poster_url})` } : {}}
      >
        {!hasPoster && (
          <div className="card-no-poster">
            {movie.type === "TV Show" ? "📺" : "🎬"}
          </div>
        )}
        <div className="card-overlay">
          <div className="card-tags">
            <span className={`type-tag ${movie.type === "TV Show" ? "type-tv" : "type-movie"}`}>
              {movie.type === "TV Show" ? "📺 TV" : "🎬 Movie"}
            </span>
            {movie.genre && <span className="genre-tag">{movie.genre}</span>}
          </div>
          {movie.watched && <span className="watched-badge">✓ Watched</span>}
        </div>
      </div>

      <div className="movie-info">
        <h3>{movie.title}</h3>
        {movie.description && <p className="movie-desc">{movie.description}</p>}

        <div className="movie-actions">
          <button
            onClick={toggleWatched}
            className={`btn ${movie.watched ? "btn-watched" : "btn-primary"}`}
          >
            {movie.watched ? "✓ Watched" : "Mark Watched"}
          </button>

          {movie.watched && (
            <div className="rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => rateMovie(star)}
                  className={`star ${movie.rating >= star ? "filled" : ""}`}
                >
                  ★
                </span>
              ))}
            </div>
          )}

          <button onClick={deleteMovie} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}
