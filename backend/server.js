import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env vars from backend/.env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

app.post('/create-user', async (req, res) => {
  const { email, password, ...user_metadata } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata,
      email_confirm: true
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/test', (req, res) => {
  res.send('Server is working!');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 