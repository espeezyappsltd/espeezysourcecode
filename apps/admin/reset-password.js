const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rqazxvcanqiurjlrtkpz.supabase.co';
const supabaseKey = 'sba_4b9887eefcec39d5e039a5a75f3e9875e2377eb3';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'kedogosospeter36@gmail.com';
  console.log(`Looking for user: ${email}...`);
  
  // Try to find the user by listing users (this might require pagination if many users)
  // Or we can just use the admin API to get users
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} not found!`);
    return;
  }
  
  console.log(`Found user: ${user.id}. Resetting password...`);
  
  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: 'Password123!' }
  );
  
  if (updateError) {
    console.error('Error updating password:', updateError);
  } else {
    console.log('Password successfully reset to: Password123!');
    
    // While we are at it, ensure they are an admin
    console.log('Setting role to admin in profiles...');
    const { error: profileError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    if (profileError) {
      console.log('Error updating profile role:', profileError);
    } else {
      console.log('Profile successfully upgraded to admin!');
    }
  }
}

resetPassword();
