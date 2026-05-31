/*
  CampusConnect Frontend Logic
  - Uses fetch() to call our backend
  - Uses Supabase Auth (via @supabase/supabase-js) on the frontend

  IMPORTANT:
  - We store the Supabase access token in localStorage.
  - Then we send it to backend for JWT verification.

  Note: To keep this beginner-friendly, we use plain JS and simple UI updates.
*/

// =====================
// 1) Configuration
// =====================

// Backend URL (you will update this in deployment too)
// Local example: http://localhost:3000
const BACKEND_URL = "https://campusconnect-backend-psi.vercel.app";

// Supabase (frontend)
// Replace these with your own values from Supabase dashboard.
// Project settings -> API -> Project URL and anon public key
const SUPABASE_URL = "https://rhrlwizycmcuvdpdspvf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_30feXX4wY2YYCvTTqiu-gQ_nkjK6gCG";

// We load Supabase client dynamically (so we don't require bundlers)
// by using ESM import from CDN. Modern browsers support this.
const supabaseModulePromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");

async function getSupabaseClient() {
  const mod = await supabaseModulePromise;
  return mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function getToken() {
  return localStorage.getItem("access_token");
}

function clearToken() {
  localStorage.removeItem("access_token");
}

async function requireAuthOrRedirect() {
  // If not logged in, redirect to login page
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return null;
  }
  return token;
}

// =====================
// 2) Auth flows
// =====================

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const errorEl = document.getElementById("loginError");
    errorEl.textContent = "";

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store access token for backend JWT verification
      // data.session.access_token is what backend will verify.
      const accessToken = data.session.access_token;
      setToken(accessToken);

      window.location.href = "dashboard.html";
    } catch (err) {
      errorEl.textContent = err?.message || "Login failed";
    }
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const errorEl = document.getElementById("signupError");
    errorEl.textContent = "";

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Some Supabase setups require email confirmation.
      // To keep this beginner-friendly, we try to sign in immediately too.
      // If you need email confirmation, adjust your Supabase auth settings.
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setToken(signInData.session.access_token);
      window.location.href = "dashboard.html";
    } catch (err) {
      errorEl.textContent = err?.message || "Signup failed";
    }
  });
}

// =====================
// 3) Dashboard flows
// =====================

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    clearToken();
    window.location.href = "login.html";
  });
}

const uploadForm = document.getElementById("uploadForm");
const notesList = document.getElementById("notesList");
const notesEmpty = document.getElementById("notesEmpty");
const refreshNotesBtn = document.getElementById("refreshNotesBtn");
const contactForm = document.getElementById("contactForm");

async function apiFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No access token found. Please login again.");

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }

  return data;
}

async function loadNotes() {
  notesList.innerHTML = "";

  try {
    const data = await apiFetch("/api/notes");
    const notes = data.notes || [];

    if (!notes.length) {
      notesEmpty.style.display = "block";
      return;
    }

    notesEmpty.style.display = "none";

    // Render notes
    for (const note of notes) {
      const div = document.createElement("div");
      div.className = "note-item";
      div.innerHTML = `
        <h3 class="note-title"></h3>
        <div class="note-meta"></div>
        <div class="note-actions">
          <button class="btn" type="button" data-action="download" data-id="${note.id}">Download</button>
          <button class="btn" type="button" data-action="view" data-id="${note.id}">View</button>
        </div>
        <pre class="note-content" style="display:none; white-space: pre-wrap; margin-top:10px; background:rgba(255,255,255,0.03); padding:10px; border-radius:12px; border:1px solid var(--border);"></pre>
      `;
      div.querySelector(".note-title").textContent = note.title;
      div.querySelector(".note-meta").textContent = `Created: ${new Date(note.created_at).toLocaleString()}`;

      notesList.appendChild(div);
    }

    // Attach click handlers
    notesList.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const item = btn.closest(".note-item");
        const pre = item.querySelector(".note-content");

        if (action === "view") {
          const note = await apiFetch(`/api/notes/${id}`);
          pre.textContent = note.content;
          pre.style.display = "block";
          return;
        }

        if (action === "download") {
          // Download is handled by backend returning file content.
          const note = await apiFetch(`/api/notes/${id}/download`, { method: "POST" });

          // Create a file for download
          const blob = new Blob([note.content], { type: "text/plain;charset=utf-8" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = `${note.title}.txt`;
          document.body.appendChild(a);
          a.click();
          a.remove();

          URL.revokeObjectURL(url);
        }
      });
    });
  } catch (err) {
    notesList.innerHTML = "";
    notesEmpty.style.display = "none";
    notesList.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("noteTitle").value;
    const content = document.getElementById("noteContent").value;

    const msg = document.getElementById("uploadMsg");
    msg.textContent = "Uploading...";

    try {
      await apiFetch("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });

      msg.textContent = "Uploaded! Refreshing notes...";
      document.getElementById("noteTitle").value = "";
      document.getElementById("noteContent").value = "";

      await loadNotes();
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "var(--danger)";
    }
  });
}

if (refreshNotesBtn) {
  refreshNotesBtn.addEventListener("click", loadNotes);
}

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value;
    const email = document.getElementById("contactEmail").value;
    const message = document.getElementById("contactMessage").value;

    const msg = document.getElementById("contactMsg");
    msg.textContent = "Sending...";
    msg.style.color = "var(--success)";

    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({ name: name || null, email, message }),
      });
      msg.textContent = "Message sent ✅";
      document.getElementById("contactMessage").value = "";
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "var(--danger)";
    }
  });
}

// Run auth check on dashboard pages
if (window.location.pathname.includes("dashboard.html")) {
  (async () => {
    await requireAuthOrRedirect();
    await loadNotes();
  })();
}

