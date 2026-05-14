'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import KanbanBoard from '@/features/kanban/KanbanBoard'
import type { Profile } from '@/features/kanban/types'

// Utility to fetch group UUID by slug
async function getGroupIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('id')
    .eq('name', slug)
    .single();
  if (error || !data) return null;
  return data.id;
}

export default function KanbanMvpPage() {
  const router = useRouter()
  const user = useSupabaseUser({
    requireUser: true,
    onUnauthenticated: () => router.replace('/login')
  })
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    if (!user) return;

    const fetchOrCreateProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      let group_id = data?.group_id;

      // If no group_id, look up the default group by slug
      if (!group_id) {
        group_id = await getGroupIdBySlug('default-mvp-group');
      }

      // If no profile exists, create one with group_id
      if (error && error.code === 'PGRST116') {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              total_score: 0,
              created_at: new Date().toISOString(),
              group_id: group_id,
            },
          ])
          .select()
          .single();
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          setProfile(created as Profile);
          setGroupId(created.group_id);
        }
      } else if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data as Profile);
        setGroupId(group_id);
      }
      setLoading(false);
    };

    fetchOrCreateProfile();
  }, [user]);

  if (loading || !user || !profile || !groupId) {
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
        Loading Kanban Board...
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', padding: '1rem' }}>
      <KanbanBoard 
        groupId={groupId} 
        profile={profile} 
      />
    </main>
  )
}
