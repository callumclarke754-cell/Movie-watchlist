const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/auth");

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a family
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await pool.query("SELECT family_id FROM users WHERE id = $1", [req.user.id]);
    if (user.rows[0].family_id) {
      return res.status(400).json({ message: "You are already in a family" });
    }

    const inviteCode = generateInviteCode();
    const family = await pool.query(
      "INSERT INTO families (name, invite_code, admin_id) VALUES ($1, $2, $3) RETURNING *",
      [name, inviteCode, req.user.id]
    );

    await pool.query(
      "UPDATE users SET family_id = $1, family_role = 'admin' WHERE id = $2",
      [family.rows[0].id, req.user.id]
    );

    res.json(family.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get family info + members
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT family_id, family_role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (!user.rows[0].family_id) {
      return res.json({ family: null, members: [], role: null });
    }

    const [family, members] = await Promise.all([
      pool.query("SELECT * FROM families WHERE id = $1", [user.rows[0].family_id]),
      pool.query(
        "SELECT id, username, email, family_role, created_at FROM users WHERE family_id = $1 ORDER BY family_role DESC, created_at ASC",
        [user.rows[0].family_id]
      ),
    ]);

    res.json({ family: family.rows[0], members: members.rows, role: user.rows[0].family_role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Join family by invite code
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const user = await pool.query("SELECT family_id FROM users WHERE id = $1", [req.user.id]);
    if (user.rows[0].family_id) {
      return res.status(400).json({ message: "You are already in a family" });
    }

    const family = await pool.query(
      "SELECT * FROM families WHERE invite_code = $1",
      [invite_code.toUpperCase()]
    );
    if (family.rows.length === 0) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    const memberCount = await pool.query(
      "SELECT COUNT(*) FROM users WHERE family_id = $1",
      [family.rows[0].id]
    );
    if (parseInt(memberCount.rows[0].count) >= 6) {
      return res.status(400).json({ message: "Family is full (max 6 members)" });
    }

    await pool.query(
      "UPDATE users SET family_id = $1, family_role = 'member' WHERE id = $2",
      [family.rows[0].id, req.user.id]
    );

    res.json({ message: "Joined family!", family: family.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Leave family
router.delete("/leave", authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT family_id, family_role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!user.rows[0].family_id) {
      return res.status(400).json({ message: "Not in a family" });
    }
    if (user.rows[0].family_role === "admin") {
      return res.status(400).json({ message: "Admins cannot leave. Delete the family instead." });
    }
    await pool.query(
      "UPDATE users SET family_id = NULL, family_role = NULL WHERE id = $1",
      [req.user.id]
    );
    res.json({ message: "Left family" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete family (admin only)
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT family_id, family_role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!user.rows[0].family_id || user.rows[0].family_role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete the family" });
    }

    await pool.query(
      "UPDATE users SET family_id = NULL, family_role = NULL WHERE family_id = $1",
      [user.rows[0].family_id]
    );
    await pool.query("DELETE FROM families WHERE id = $1", [user.rows[0].family_id]);

    res.json({ message: "Family deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a member (admin only)
router.delete("/member/:id", authMiddleware, async (req, res) => {
  try {
    const admin = await pool.query(
      "SELECT family_id, family_role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!admin.rows[0].family_id || admin.rows[0].family_role !== "admin") {
      return res.status(403).json({ message: "Only admin can remove members" });
    }
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "Cannot remove yourself" });
    }

    await pool.query(
      "UPDATE users SET family_id = NULL, family_role = NULL WHERE id = $1 AND family_id = $2",
      [req.params.id, admin.rows[0].family_id]
    );
    res.json({ message: "Member removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// View a member's watchlist (admin only or own)
router.get("/member/:id/movies", authMiddleware, async (req, res) => {
  try {
    const viewer = await pool.query(
      "SELECT family_id, family_role FROM users WHERE id = $1",
      [req.user.id]
    );
    const targetId = parseInt(req.params.id);
    const isOwn = targetId === req.user.id;
    const isAdmin = viewer.rows[0].family_role === "admin";

    if (!isOwn && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!isOwn) {
      const target = await pool.query("SELECT family_id FROM users WHERE id = $1", [targetId]);
      if (target.rows[0]?.family_id !== viewer.rows[0].family_id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const movies = await pool.query(
      "SELECT * FROM movies WHERE user_id = $1 ORDER BY created_at DESC",
      [targetId]
    );
    res.json(movies.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
