import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /i, '');
    if (!token) return reply(401, { error: 'Sign in again before deleting your account.' });
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token);
    if (error || !user?.email)
      return reply(401, { error: 'Sign in again before deleting your account.' });
    const body = await request.text();
    if (body.length > 2000) return reply(400, { error: 'Invalid deletion request.' });
    const { password, confirmation } = JSON.parse(body);
    if (
      confirmation !== 'DELETE' ||
      typeof password !== 'string' ||
      !password ||
      password.length > 1024
    )
      return reply(400, { error: 'Enter your current password and type DELETE.' });
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile)
      return reply(409, { error: 'Could not verify your profile. Please retry.' });
    if (profile.role === 'admin')
      return reply(409, {
        error: 'Ask another administrator to change your role before deleting this account.',
      });
    // Verify against Auth; never accept a user ID or email supplied by the caller.
    const verifier = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const verified = await verifier.auth.signInWithPassword({ email: user.email, password });
    if (verified.error || verified.data.user?.id !== user.id)
      return reply(403, { error: 'Your current password could not be verified.' });
    const deleted = await admin.auth.admin.deleteUser(user.id, false);
    if (deleted.error)
      return reply(409, {
        error: 'Your account could not be deleted. Your local data has been kept. Please retry.',
      });
    return reply(200, { deleted: true });
  } catch {
    return reply(503, {
      error: 'Deletion could not finish. Please check your connection and retry.',
    });
  }
});
