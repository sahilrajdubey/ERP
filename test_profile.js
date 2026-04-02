const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^"|"$/g, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY.trim().replace(/^"|"$/g, ''),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL.replace(/^"|"$/g, '');
  const user = users.find(u => u.email === email);
  
  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      *,
      employee:employees(*)
    `)
    .eq('auth_id', user.id)
    .single();
    
  console.log('Profile:', profile);
  console.log('Error:', error);
}
check();
