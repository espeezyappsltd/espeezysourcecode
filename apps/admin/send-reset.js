const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = envLocal.split('\n').reduce((acc, line) => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    acc[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
  }
  return acc;
}, {});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sendReset() {
  const email = 'kedogosospeter36@gmail.com';
  console.log(`Sending password reset email to ${email}...`);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3004/auth/callback?next=/auth/reset-password',
  });

  if (error) {
    console.error('Error sending reset email:', error);
  } else {
    console.log('Reset email sent successfully! Please check your inbox.');
  }
}

sendReset();
