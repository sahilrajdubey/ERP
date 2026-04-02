const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^"|"$/g, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY.trim().replace(/^"|"$/g, ''),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  const { data: products, error } = await supabase.from('products').select('*').limit(1);
  console.log('Admin Products:', products, error);
}
check();
