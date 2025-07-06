import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from './jwtAuth.js';

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

app.post('/create-user', requireAdmin, async (req, res) => {
  console.log('Received POST /create-user', req.body);
  const { email, password, role, ...user_metadata } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role required' });
  }
  try {
    // Infer shop_id from the admin's profile
    const adminId = req.user.sub;
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', adminId)
      .single();
    if (adminProfileError || !adminProfile?.shop_id) {
      return res.status(400).json({ error: 'Could not determine shop_id from admin profile' });
    }
    const shop_id = adminProfile.shop_id;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata,
      email_confirm: true
    });
    if (error) return res.status(400).json({ error: error.message });

    // Add logging here
    const userId = data.user.id;
    console.log('Attempting to insert into profiles:', {
      id: userId,
      email,
      role,
      shop_id,
      status: role === 'employee' ? 'pending' : 'approved',
      ...user_metadata
    });

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        role,
        shop_id,
        status: role === 'employee' ? 'pending' : 'approved'
      });

    if (profileError) {
      console.error('Insert error:', profileError);
      return res.status(400).json({ error: profileError.message });
    }

    res.json({ user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/remove-employee', requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Employee id required' });
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Retail India POS Backend is running!');
});

app.get('/test', (req, res) => {
  res.type('text').send('Server is working!');
});

app.get('/test-json', (req, res) => {
  res.json({ status: 'ok', message: 'This is a test JSON response from the backend.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 