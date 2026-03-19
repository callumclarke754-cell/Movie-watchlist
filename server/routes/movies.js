const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/auth");

// Get all movies for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const movies = await pool.query(
      "SELECT * FROM movies WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(movies.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a movie
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, genre, description, poster_url, type } = req.body;

    const newMovie = await pool.query(
      "INSERT INTO movies (user_id, title, genre, description, poster_url, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.user.id, title, genre, description, poster_url, type || "Movie"]
    );

    res.json(newMovie.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle watched status
router.patch("/:id/watched", authMiddleware, async (req, res) => {
  try {
    const movie = await pool.query(
      "SELECT * FROM movies WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (movie.rows.length === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const updated = await pool.query(
      "UPDATE movies SET watched = NOT watched WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Rate a movie
router.patch("/:id/rate", authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;

    const movie = await pool.query(
      "SELECT * FROM movies WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (movie.rows.length === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const updated = await pool.query(
      "UPDATE movies SET rating = $1 WHERE id = $2 RETURNING *",
      [rating, req.params.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a movie
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const movie = await pool.query(
      "SELECT * FROM movies WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (movie.rows.length === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    await pool.query("DELETE FROM movies WHERE id = $1", [req.params.id]);
    res.json({ message: "Movie deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
