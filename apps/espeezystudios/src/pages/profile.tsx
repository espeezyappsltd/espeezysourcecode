import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import type { User } from '@supabase/supabase-js';
type Profile = { id: string; full_name?: string; username?: string; biography?: string; created_at?: string };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
          <div><b>Joined:</b> {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</div>
        </>
      )}
    </main>
  );
}
