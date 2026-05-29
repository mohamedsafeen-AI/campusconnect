# CampusConnect (Beginner-Friendly Full Stack)

Student notes sharing website.

**Tech stack**
- Frontend: HTML + CSS + JavaScript (plain JS)
- Backend: Node.js + Express
- Database/Auth: Supabase (Auth + Postgres)

---

## 1) What you will build
- Students can **Signup** and **Login** using Supabase Auth
- Logged-in students can
  - **Upload** notes (title + content)
  - **View** your notes on dashboard
  - **Download** notes as a `.txt` file
- **Contact form** stores messages in Supabase

JWT verification is implemented:
- Frontend logs in with Supabase and gets an **access token**
- Frontend sends token to backend using `Authorization: Bearer <token>`
- Backend verifies token using Supabase

---

## 2) Project structure
```
CampusConnect/
  frontend/
    index.html
    login.html
    dashboard.html
    style.css
    script.js

  backend/
    server.js
    package.json
    .env
    vercel.json
    routes/authRoutes.js
    config/supabaseClient.js

  supabase_setup.sql
  README.md
  TODO.md
```

---

## 3) Create Supabase tables (VERY IMPORTANT)
1. Go to Supabase Dashboard
2. Open **SQL Editor**
3. Copy/paste the contents of:
   - `supabase_setup.sql`
4. Click **Run**

This creates:
- `notes` table (user can only access their own rows)
- `contacts` table
- RLS policies

---

## 4) Configure Supabase keys
From Supabase Dashboard:
1. Go to **Project Settings**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Project API keys** -> **anon public** key

3. Create a **Service Role key** (secret!)
   - Supabase: **Settings -> API -> Service role key**
   - Use this only on the backend

---

## 5) Setup backend locally (Node + Express)
### Step A: Install dependencies
In `campusconnect/backend/` run:
```bash
npm install
```

### Step B: Configure `.env`
Edit `backend/.env` and set:
```env
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
PORT=3000
```

### Step C: Start the backend
```bash
npm run dev
```
(If you don’t have nodemon, use `npm start`.)

Backend should be running at:
- `http://localhost:3000`

---

## 6) Setup frontend locally
### Step A: Configure Supabase keys in frontend
Open `frontend/script.js` and replace:
```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### Step B: Configure backend URL
In `frontend/script.js` set:
```js
const BACKEND_URL = "http://localhost:3000";
```

### Step C: Run frontend
Because this frontend is plain HTML/CSS/JS, you can run it in 2 beginner-friendly ways:

**Option 1 (fastest):**
- Just double click `frontend/index.html`

**Option 2 (better for fetch):**
- Use a simple static server. Example using Node (if you have Node):
```bash
npx serve -s frontend
```
Then open the printed URL.

---

## 7) Connect frontend + backend + Supabase (how it works)
1. User opens `login.html`
2. Frontend uses Supabase JS to login
3. Frontend stores access token in `localStorage`
4. Frontend calls backend like:
   - `fetch("http://localhost:3000/api/notes", { headers: Authorization: Bearer ... })`
5. Backend verifies the token using Supabase
6. Backend reads/writes only rows where `notes.user_id = auth.uid()`

---

## 8) Deploy frontend to Netlify
### Step A: Update URLs before deploying
When deployed, you will change:
- `BACKEND_URL` in `frontend/script.js` to your deployed backend URL

### Step B: Deploy
From the project root folder (`campusconnect`):
```bash
cd frontend
```

Then in another terminal (or same terminal), run:
```bash
npx netlify-cli deploy --prod
```

Netlify CLI will ask you to login.

---

## 9) Deploy backend to Vercel
### Step A: Prepare backend config
From `campusconnect/backend/` ensure:
- `vercel.json` exists (it is included)
- `server.js` is the entry

### Step B: Configure Vercel env vars
In Vercel Dashboard -> your project -> **Settings -> Environment Variables**:
Set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (optional)

### Step C: Deploy from terminal
From the project root folder (`campusconnect`):
```bash
cd backend
```

Then run:
```bash
vercel --prod
```

---

## 10) Provide working URLs (after deploy)
Because you haven’t deployed yet here, these are placeholders (example format only):
- Frontend (Netlify): `https://campusconnect-example.netlify.app`
- Backend (Vercel): `https://campusconnect-example.vercel.app`

**After you get the backend URL**, update:
- `frontend/script.js` -> `const BACKEND_URL = "https://YOUR-BACKEND-URL"`


---

## Notes / Beginner warnings
- **Never** put `SUPABASE_SERVICE_ROLE_KEY` in the frontend.
- The access token is stored in `localStorage` for simplicity (learning-friendly).

---

## Quick checklist
- [ ] Run `supabase_setup.sql`
- [ ] Fill `backend/.env`
- [ ] Fill `frontend/script.js` supabase keys
- [ ] Start backend
- [ ] Open frontend

