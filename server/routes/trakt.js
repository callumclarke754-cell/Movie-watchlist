const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/auth");
require("dotenv").config();

const TRAKT_BASE = "https://api.trakt.tv";

// Get Trakt OAuth URL
router.get("/auth", authMiddleware, (req, res) => {
  const authUrl =
    `https://trakt.tv/oauth/authorize?response_type=code` +
    `&client_id=${process.env.TRAKT_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.TRAKT_REDIRECT_URI)}` +
    `&state=${req.user.id}`;
  res.json({ url: authUrl });
});

// OAuth callback — exchange code for token
router.get("/callback", async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect("http://localhost:5173/profile?trakt=error");
    }

    const tokenRes = await fetch(`${TRAKT_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.TRAKT_CLIENT_ID,
        client_secret: process.env.TRAKT_CLIENT_SECRET,
        redirect_uri: process.env.TRAKT_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect("http://localhost:5173/profile?trakt=error");
    }

    await pool.query(
      "UPDATE users SET trakt_access_token = $1, trakt_refresh_token = $2, trakt_connected = TRUE WHERE id = $3",
      [tokenData.access_token, tokenData.refresh_token, userId]
    );

    res.redirect("http://localhost:5173/profile?trakt=connected");
  } catch (err) {
    console.error(err);
    res.redirect("http://localhost:5173/profile?trakt=error");
  }
});

// Sync watch history from Trakt
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT trakt_access_token, trakt_connected FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = userResult.rows[0];

    if (!user.trakt_connected || !user.trakt_access_token) {
      return res.status(400).json({ message: "Trakt not connected" });
    }

    const headers = {
      Authorization: `Bearer ${user.trakt_access_token}`,
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": process.env.TRAKT_CLIENT_ID,
    };

    const [moviesRes, showsRes] = await Promise.all([
      fetch(`${TRAKT_BASE}/users/me/watched/movies`, { headers }),
      fetch(`${TRAKT_BASE}/users/me/watched/shows`, { headers }),
    ]);

    const [watchedMovies, watchedShows] = await Promise.all([
      moviesRes.json(),
      showsRes.json(),
    ]);

    let added = 0;
    let updated = 0;

    for (const item of Array.isArray(watchedMovies) ? watchedMovies : []) {
      const { movie } = item;
      if (!movie?.title) continue;
      const exists = await pool.query(
        "SELECT id FROM movies WHERE user_id = $1 AND (tmdb_id = $2 OR (title = $3 AND type = 'Movie'))",
        [req.user.id, movie.ids?.tmdb || null, movie.title]
      );
      if (exists.rows.length > 0) {
        await pool.query("UPDATE movies SET watched = TRUE WHERE id = $1", [exists.rows[0].id]);
        updated++;
      } else {
        await pool.query(
          "INSERT INTO movies (user_id, title, type, watched, tmdb_id) VALUES ($1, $2, 'Movie', TRUE, $3)",
          [req.user.id, movie.title, movie.ids?.tmdb || null]
        );
        added++;
      }
    }

    for (const item of Array.isArray(watchedShows) ? watchedShows : []) {
      const { show } = item;
      if (!show?.title) continue;
      const exists = await pool.query(
        "SELECT id FROM movies WHERE user_id = $1 AND (tmdb_id = $2 OR (title = $3 AND type = 'TV Show'))",
        [req.user.id, show.ids?.tmdb || null, show.title]
      );
      if (exists.rows.length > 0) {
        await pool.query("UPDATE movies SET watched = TRUE WHERE id = $1", [exists.rows[0].id]);
        updated++;
      } else {
        await pool.query(
          "INSERT INTO movies (user_id, title, type, watched, tmdb_id) VALUES ($1, $2, 'TV Show', TRUE, $3)",
          [req.user.id, show.title, show.ids?.tmdb || null]
        );
        added++;
      }
    }

    res.json({ message: `Sync complete! ${added} new titles added, ${updated} marked watched.`, added, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sync failed" });
  }
});

// Get connection status
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT trakt_connected FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json({ connected: result.rows[0]?.trakt_connected || false });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Disconnect Trakt
router.delete("/disconnect", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "UPDATE users SET trakt_access_token = NULL, trakt_refresh_token = NULL, trakt_connected = FALSE WHERE id = $1",
      [req.user.id]
    );
    res.json({ message: "Trakt disconnected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
