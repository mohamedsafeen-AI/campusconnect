/**
 * CampusConnect Backend
 * - Express server
 * - JWT verification using Supabase
 * - Notes CRUD for the logged-in user
 * - Contact form storage
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { verifySupabaseJwt, supabaseAdmin } = require("./config/supabaseClient");

const app = express();

// Enable JSON parsing for request body
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Allow frontend calls (local development + deployed)

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "campusconnect-backend" });
});
app.get("/", (req, res) => {
  res.send("CampusConnect Backend Running");
});
/**
 * ===== Notes Endpoints =====
 */

// Get all notes for the logged-in user
app.get("/api/notes", async (req, res) => {
  console.log("HEADERS:", req.headers);
  try {
    const { userId } = await verifySupabaseJwt(req);

    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ notes: data });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Get one note content (for View)
app.get("/api/notes/:id", async (req, res) => {
  try {
    const { userId } = await verifySupabaseJwt(req);
    const id = req.params.id;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("id, title, content, created_at")
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ id: data.id, title: data.title, content: data.content, created_at: data.created_at });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Create note
app.post("/api/notes", async (req, res) => {
  try {
    const { userId } = await verifySupabaseJwt(req);

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert([{ user_id: userId, title, content }])
      .select("id, title, created_at")
      .single();

    if (error) throw error;

    res.json({ ok: true, note: data });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Download note (backend returns title + content; frontend creates the file)
app.post("/api/notes/:id/download", async (req, res) => {
  try {
    const { userId } = await verifySupabaseJwt(req);
    const id = req.params.id;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("id, title, content")
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ id: data.id, title: data.title, content: data.content });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * ===== Contact Endpoint =====
 */

app.post("/api/contact", async (req, res) => {
  try {
    // Optional: contact can be submitted while logged in.
    // We will still verify JWT (recommended for beginner consistency).
    const { userId } = await verifySupabaseJwt(req);

    const { name, email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "email and message are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("contacts")
      .insert([
        {
          user_id: userId,
          name: name || null,
          email,
          message,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;

    res.json({ ok: true, id: data.id });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CampusConnect backend running on http://localhost:${PORT}`);
});

