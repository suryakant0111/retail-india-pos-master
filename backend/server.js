import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from './jwtAuth.js';


// Load env vars from backend/.env
dotenv.config();

const app = express();

// Enhanced CORS configuration for production
app.use(cors({
  origin: ['https://retailpos.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// In-memory storage for scanner sessions (in production, use Redis or database)
const scannerSessions = new Map();

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

// Scanner API endpoints
app.post('/scanner-scan', async (req, res) => {
  try {
    const { session, barcode, timestamp } = req.body;

    if (!session || !barcode) {
      return res.status(400).json({ error: 'Session and barcode are required' });
    }

    // Store the scanned barcode
    if (!scannerSessions.has(session)) {
      scannerSessions.set(session, []);
    }

    const sessionData = scannerSessions.get(session);
    sessionData.push({
      barcode,
      timestamp,
      receivedAt: new Date().toISOString()
    });

    // Keep only last 10 scans per session
    if (sessionData.length > 10) {
      sessionData.splice(0, sessionData.length - 10);
    }

    console.log(`Barcode scanned: ${barcode} for session: ${session}`);

    res.status(200).json({ 
      success: true, 
      message: 'Barcode received',
      session,
      barcode 
    });

  } catch (error) {
    console.error('Scanner API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/scanner-session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Fetching session data for: ${sessionId}`);
    const sessionData = scannerSessions.get(sessionId) || [];
    console.log(`Found ${sessionData.length} scans for session ${sessionId}`);
    res.json({ scans: sessionData });
  } catch (error) {
    console.error('Scanner session API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeSessions: scannerSessions.size
  });
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