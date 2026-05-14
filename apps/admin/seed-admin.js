const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = envLocal.split('\n').reduce((acc, line) => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    acc[key.trim()] = values.join('=').trim();
  }
  return acc;
}, {});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
  const email = 'kedogosospeter36@gmail.com';
  const password = 'password123';
  
  console.log(`Trying to sign up user with email ${email}...`);
  // Try to create the user with anon key
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  let userId;

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('User already exists, trying to log in to get ID...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        console.error('Error signing in existing user to get ID:', signInError);
        return;
      }
      userId = signInData.user.id;
      console.log(`Logged in. Found existing user with ID: ${userId}`);
    } else {
      console.error('Error signing up user:', signUpError);
      return;
    }
  } else {
    userId = signUpData.user?.id;
    if (!userId) {
       console.error("Signup succeeded but no user returned. Email confirmation might be required.", signUpData);
       return;
    }
    console.log(`Signed up new user with ID: ${userId} and password: ${password}`);
  }

  // Now we need to update the role to admin. Since we are anon, we can't do this via API.
  // We will print the SQL command to run, or we can use the postgres connection string.
  console.log(`\n\n--- PLEASE RUN THIS SQL TO MAKE USER ADMIN ---`);
  console.log(`UPDATE profiles SET role = 'admin' WHERE id = '${userId}';`);
}

seedAdmin().catch(console.error);
