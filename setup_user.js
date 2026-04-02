const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^"|"$/g, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY.trim().replace(/^"|"$/g, ''),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setup() {
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL.replace(/^"|"$/g, '');
  console.log(`Searching for user with email: ${email}`);

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching users:', authError);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} not found. Please log in first to create the auth.users row.`);
    return;
  }
  
  console.log(`Auth user found: ${user.id}`);
  
  const { data: existing, error: err } = await supabase.from('users').select('*').eq('auth_id', user.id).single();
  if (existing) {
    console.log('User profile already exists in public.users!');
    return;
  }
  
  console.log('Creating admin profile in public.users...');
  const { error: insertErr } = await supabase.from('users').insert({
    auth_id: user.id,
    role: 'admin',
    is_active: true
  });
  
  if (insertErr) {
    console.error('Failed to create profile:', insertErr);
  } else {
    console.log('Successfully created admin profile!');
  }
}

setup();
