const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
  const { data: users, error } = await supabase.from('users').select('*');
  console.log('Users in public.users:', users, error);
}
check();
