/**
 * Supabase Client (Admin + JWT verification helper)
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client can access tables securely on the server.
// IMPORTANT: Never expose SERVICE_ROLE_KEY to the browser.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * verifySupabaseJwt
 * - Reads Authorization header
 * - Verifies the JWT using Supabase by calling getUser
 *
 * This is beginner-friendly: instead of manually decoding and verifying signatures,
 * we let Supabase verify and return the user.
 */
async function verifySupabaseJwt(req) {
  const auth = req.headers.authorization;
  if (!auth) throw new Error("Missing Authorization header");

  // Header format: Bearer <token>
  const token = auth.replace("Bearer ", "").trim();
  if (!token) throw new Error("Missing access token");

  // Use Supabase auth to verify token.
  // We create a temporary client with the access token.
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Supabase JS doesn't provide a direct 'verify token' with service role,
  // but getUser will validate the JWT.
  const { data: userData, error } = await supabaseUser.auth.getUser(token);

  if (error) throw new Error(error.message);
  if (!userData?.user?.id) throw new Error("Invalid token");

  return { userId: userData.user.id };
}

module.exports = {
  supabaseAdmin,
  verifySupabaseJwt,
};

