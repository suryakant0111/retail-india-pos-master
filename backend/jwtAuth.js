import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET);
    // Check the user's role in the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', payload.sub)
      .single();
    if (error || !data || data.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
} 