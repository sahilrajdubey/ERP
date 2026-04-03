const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^"|"$/g, ''),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/^"|"$/g, '')
  );

  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: process.env.NEXT_PUBLIC_DEMO_EMAIL.replace(/^"|"$/g, ''),
    password: process.env.NEXT_PUBLIC_DEMO_PASSWORD.replace(/^"|"$/g, '')
  });

  const { data: products, error } = await supabase.from('products').select('id').limit(1);
  console.log('Products:', products, error);
}
check();
