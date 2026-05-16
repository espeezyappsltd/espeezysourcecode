// Secure user seeding API for Supabase (Node.js/Express example)
// Place in apps/kanban/src/pages/api/seed-users.ts (or similar for each app)

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_SECRET = process.env.SEED_SECRET;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-seed-secret'] !== SEED_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const users = req.body;
  if (!Array.isArray(users)) return res.status(400).json({ error: 'Invalid payload' });

  const results = [];
  for (const user of users) {
    // Upsert user into Supabase auth and profiles
    const { email, password, roles, ...profile } = user;
    // 1. Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError && !String(authError.message).includes('already registered')) {
      results.push({ email, error: authError.message });
      continue;
    }
    // 2. Upsert profile/roles
    const userId = authUser?.user?.id;
    if (userId) {
      await supabase.from('user_profiles').upsert({
        id: userId,
        email,
        roles,
        ...profile,
      });
    }
    results.push({ email, status: 'seeded' });
  }
  res.json({ results });
}
