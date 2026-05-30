import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  if (loading) return <div style={{ margin: 40 }}>Loading...</div>;
  if (!user) return <div style={{ margin: 40 }}>Not signed in.</div>;

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 12 }}>
      <h2>Profile</h2>
      <div><b>Email:</b> {user.email}</div>
      <div><b>ID:</b> {user.id}</div>
      {profile && (
        <>
          <div><b>Full Name:</b> {profile.full_name}</div>
          <div><b>Username:</b> {profile.username}</div>
          <div><b>Bio:</b> {profile.biography}</div>
          <div><b>Joined:</b> {new Date(profile.created_at).toLocaleDateString()}</div>
        </>
      )}
    </main>
  );
}
