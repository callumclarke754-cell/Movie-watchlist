import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="logo-mark">▶</span>
        <span className="logo-text">Watchlist</span>
      </Link>

      {user && (
        <div className="navbar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Home
          </NavLink>
          <NavLink to="/movies" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Movies
          </NavLink>
          <NavLink to="/tv" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            TV Shows
          </NavLink>
          <NavLink to="/family" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Family
          </NavLink>
        </div>
      )}

      <div className="navbar-links">
        {user ? (
          <>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              👤 {user.username}
            </NavLink>
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
