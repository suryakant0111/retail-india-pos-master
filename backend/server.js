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
  origin: ['https://retailpos.vercel.app', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
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

app.delete('/scanner-session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Deleting session: ${sessionId}`);
    scannerSessions.delete(sessionId);
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Scanner session delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mobile Scanner Session Management
const mobileSessions = new Map();

// Mobile Scanner API Routes
app.post('/api/mobile-scanner/connect/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { connected } = req.body;
  
  if (!mobileSessions.has(sessionId)) {
    mobileSessions.set(sessionId, {
      connected: false,
      scannedData: null,
      lastActivity: Date.now()
    });
  }
  
  const session = mobileSessions.get(sessionId);
  session.connected = connected;
  session.lastActivity = Date.now();
  
  res.json({ success: true, connected });
});

app.post('/api/mobile-scanner/scan/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { barcode, timestamp } = req.body;
  
  if (!mobileSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = mobileSessions.get(sessionId);
  session.scannedData = { barcode, timestamp };
  session.lastActivity = Date.now();
  
  res.json({ success: true });
});

app.get('/api/mobile-scanner/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (!mobileSessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  const session = mobileSessions.get(sessionId);
  const response = {
    connected: session.connected,
    scannedData: session.scannedData
  };
  
  // Clear scanned data after sending
  if (session.scannedData) {
    session.scannedData = null;
  }
  
  res.json(response);
});

app.post('/api/mobile-scanner/clear/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (mobileSessions.has(sessionId)) {
    const session = mobileSessions.get(sessionId);
    session.scannedData = null;
  }
  
  res.json({ success: true });
});

// Barcode Product Lookup
app.get('/api/products/barcode/:barcode', async (req, res) => {
  const { barcode } = req.params;
  
  try {
    // First check if product exists in database
    const { data: existingProduct, error: dbError } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existingProduct) {
      return res.json({
        found: true,
        name: existingProduct.name,
        price: existingProduct.price,
        barcode: existingProduct.barcode,
        category: existingProduct.category,
        stock: existingProduct.stock,
        gst: existingProduct.gst
      });
    }
    
    // If not in database, try to fetch from online API
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        return res.json({
          found: true,
          name: product.product_name || product.product_name_en || 'Unknown Product',
          price: 0, // Will be set manually
          barcode: barcode,
          category: product.categories_tags?.[0]?.replace('en:', '') || 'General',
          stock: 1,
          gst: 18,
          description: product.generic_name || product.brands || '',
          image: product.image_front_url || product.image_url || ''
        });
      }
    } catch (apiError) {
      console.log('API fetch failed:', apiError);
    }
    
    // If no product found anywhere
    return res.json({
      found: false,
      barcode: barcode
    });
    
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup old sessions (run every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [sessionId, session] of mobileSessions.entries()) {
    if (now - session.lastActivity > fiveMinutes) {
      mobileSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

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