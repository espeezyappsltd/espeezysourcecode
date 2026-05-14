const { Client } = require('pg');

const connStr = 'postgresql://postgres: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@db.rqazxvcanqiurjlrtkpz.supabase.co:5432/postgres';

async function main() {
  const client = new Client({
    connectionString: connStr,
  });

  try {
    await client.connect();
    const email = 'kedogosospeter36@gmail.com';
    console.log(`Looking for user with email: ${email}`);

    // Check if the user exists in auth.users
    const authRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [email]);
    if (authRes.rows.length === 0) {
       console.log('User not found in auth.users.');
       return;
    }
    
    const userId = authRes.rows[0].id;
    console.log(`Found auth user ID: ${userId}`);

    // Update the profile to admin
    console.log('Setting role to admin in profiles table...');
    const updateRes = await client.query(
      `UPDATE public.profiles SET role = 'admin' WHERE id = $1 RETURNING *`, 
      [userId]
    );

    if (updateRes.rows.length > 0) {
      console.log('Profile updated successfully:', updateRes.rows[0]);
    } else {
      console.log('No profile found. Trying to insert profile...');
      const insertRes = await client.query(
        `INSERT INTO public.profiles (id, email, role) VALUES ($1, $2, 'admin') RETURNING *`,
        [userId, email]
      );
      console.log('Profile inserted successfully:', insertRes.rows[0]);
    }

  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await client.end();
  }
}

main();
