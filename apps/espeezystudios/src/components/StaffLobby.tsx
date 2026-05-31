'use client'

import { StudioCrudPanel } from '@/components/studio/StudioCrudPanel'

export type TeamMember = {
  id: string
  name: string
  role: string
  sort_order: number
}

export default function StaffLobby() {
  return (
    <section id="staff" className="section staff-lobby" aria-labelledby="staff-heading">
      <h2 id="staff-heading">Active Team</h2>
    <StudioCrudPanel<TeamMember>
      table="studio_team_members"
      title="team member"
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'sort_order', label: 'Sort order', type: 'number', min: 0 },
      ]}
      emptyLabel="No team members yet."
      buildEmpty={() => ({ name: '', role: '', sort_order: 0 })}
      renderRow={(m) => (
        <>
          <span className="staff__name">{m.name}</span>
          <span className="staff__role"> · {m.role}</span>
        </>
      )}
    />
    </section>
  )
}
