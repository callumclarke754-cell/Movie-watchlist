const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
require("dotenv").config();

const TMDB_BASE = "https://api.themoviedb.org/3";

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { query, type } = req.query;
    if (!query) return res.status(400).json({ message: "Query required" });

    const endpoint =
      type === "movie"
        ? `${TMDB_BASE}/search/movie`
        : type === "tv"
        ? `${TMDB_BASE}/search/tv`
        : `${TMDB_BASE}/search/multi`;

    const response = await fetch(
      `${endpoint}?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    const results = (data.results || [])
      .filter((item) => item.media_type !== "person" && (item.title || item.name))
      .slice(0, 12)
      .map((item) => ({
        tmdb_id: item.id,
        title: item.title || item.name,
        type: item.media_type === "tv" || item.first_air_date ? "TV Show" : "Movie",
        description: item.overview || "",
        poster_url: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        year: item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || "",
      }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search TMDB" });
  }
});

module.exports = router;
