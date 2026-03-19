import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API from "../api";

export default function TMDBSearch({ type, onSelect, onClose }) {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(
        `${API}/tmdb/search?query=${encodeURIComponent(query)}&type=${type === "Movie" ? "movie" : "tv"}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Search {type === "Movie" ? "Movies" : "TV Shows"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSearch} className="modal-search">
          <input
            type="text"
            placeholder={`Search ${type === "Movie" ? "movies" : "TV shows"}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </form>

        <div className="modal-results">
          {searched && results.length === 0 && !loading && (
            <p className="modal-empty">No results found. Try a different title.</p>
          )}
          {results.map((item) => (
            <div key={item.tmdb_id} className="tmdb-result" onClick={() => { onSelect(item); onClose(); }}>
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.title} className="tmdb-poster" />
              ) : (
                <div className="tmdb-poster tmdb-no-poster">
                  {item.type === "TV Show" ? "📺" : "🎬"}
                </div>
              )}
              <div className="tmdb-info">
                <p className="tmdb-title">{item.title}</p>
                {item.year && <span className="tmdb-year">{item.year}</span>}
                {item.description && (
                  <p className="tmdb-desc">{item.description.slice(0, 120)}{item.description.length > 120 ? "..." : ""}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <p>Can't find it? <button className="link-btn" onClick={onClose}>Add manually instead</button></p>
        </div>
      </div>
    </div>
  );
}
