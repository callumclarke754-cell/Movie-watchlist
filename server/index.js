const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/tmdb", require("./routes/tmdb"));
app.use("/api/trakt", require("./routes/trakt"));
app.use("/api/family", require("./routes/family"));

// Health check
app.get("/", (req, res) => {
  res.send("Movie Watchlist API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
