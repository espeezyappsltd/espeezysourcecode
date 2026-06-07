'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function UserManagementPanel() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50)
      setProfiles(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="studio-dashboard-card">
      <h3 style={{ marginBottom: '1rem' }}>User Profiles</h3>
      {loading ? (
        <p className="studio-dashboard-muted">Loading...</p>
      ) : (
        <table className="studio-dashboard-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Group ID</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace' }}>{p.id.slice(0, 8)}...</td>
                <td>{p.full_name || 'N/A'}</td>
                <td style={{ fontFamily: 'monospace' }}>{p.group_id ? p.group_id.slice(0, 8) + '...' : 'None'}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4} className="studio-dashboard-muted">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
