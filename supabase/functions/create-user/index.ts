// @allow_unauthenticated
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Debug: log environment variables
  console.log('SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));

  const { email, password, role, shop_id } = await req.json();
  if (!email || !password || !role || !shop_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), {
    status: 400,
    headers: { "Access-Control-Allow-Origin": "*" }
  });

  const userId = data.user?.id;
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email,
    role,
    shop_id,
    status: role === 'employee' ? 'pending' : 'approved',
  });
  if (profileError) return new Response(JSON.stringify({ error: profileError.message }), {
    status: 400,
    headers: { "Access-Control-Allow-Origin": "*" }
  });

  return new Response(JSON.stringify({ success: true, user: data.user }), {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" }
  });
});
