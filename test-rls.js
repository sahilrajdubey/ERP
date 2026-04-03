const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL.replace(/^"|"$/g, '');
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD.replace(/^"|"$/g, '');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^"|"$/g, ''),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/^"|"$/g, '')
  );

  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (authErr) {
    console.error('Login error:', authErr);
    return;
  }
  console.log('Logged in user:', user.id);

  const { data: profile, error } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('auth_id', user.id)
    .single();
    
  console.log('Profile via RLS:', profile);
  console.log('Error via RLS:', error);
}
check();
