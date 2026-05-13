
'use client'


import { useEffect, useState } from "react";
import { supabase } from "./kanban/supabase/supabase-client";
import type { Profile } from "../../../../src/features/kanban/types";


export default function AdminPage() {
  // For demonstration, use a default group and profile for admin
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with real admin logic as needed
    const fetchAdminProfile = async () => {
      // Try to get the first admin profile and group
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (data) {
        setProfile(data as Profile);
        setGroupId(data.group_id);
      }
      setLoading(false);
    };
    fetchAdminProfile();
  }, []);

  if (loading || !profile || !groupId) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading Espeezy Admin Board...
      </div>
    );
  }

  return (
    <main>     
    	<>Espeezy Admin Page</>
    </main>
  );
}
