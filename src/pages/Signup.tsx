import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function SignupPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopGSTIN, setShopGSTIN] = useState('');
  const [shopType, setShopType] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'create') {
        // 1. Create the shop (no duplicate name check)
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .insert({
            name: shopName,
            address: shopAddress,
            phone: shopPhone,
            gstin: shopGSTIN,
            type: shopType
          })
          .select()
          .single();
        if (shopError) throw shopError;

        // 2. Sign up the user as admin
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        // 3. Insert profile with admin role and shop_id
        const userId = signUpData.user.id;
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          email,
          role: 'admin',
          shop_id: shop.id,
          status: 'approved'
        });
        if (profileError) throw profileError;

        setSuccess('Shop and admin account created! Please check your email to verify your account.');
      } else {
        // Join existing shop as employee
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .select('*')
          .eq('id', shopCode)
          .single();
        if (shopError || !shop) throw new Error('Invalid shop code');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        const userId = signUpData.user.id;
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          email,
          role: 'employee',
          shop_id: shop.id,
          status: 'pending'
        });
        if (profileError) throw profileError;

        setSuccess('Employee account created! Please wait for admin approval.');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${mode === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('create')}
        >
          Create New Shop
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === 'join' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('join')}
        >
          Join Existing Shop
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'create' && (
          <>
            <input
              type="text"
              placeholder="Shop Name"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Shop Address"
              value={shopAddress}
              onChange={e => setShopAddress(e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Shop Phone"
              value={shopPhone}
              onChange={e => setShopPhone(e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="GSTIN (optional)"
              value={shopGSTIN}
              onChange={e => setShopGSTIN(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Business Type (e.g. Retail, Wholesale)"
              value={shopType}
              onChange={e => setShopType(e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
          </>
        )}
        {mode === 'join' && (
          <input
            type="text"
            placeholder="Shop Code"
            value={shopCode}
            onChange={e => setShopCode(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </form>
    </div>
  );
} 