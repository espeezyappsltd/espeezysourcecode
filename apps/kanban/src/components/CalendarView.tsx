'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Task, TaskStatus } from '@/types/database'
import TaskModal from './TaskModal'

type CalendarTask = Pick<Task, 'id' | 'title' | 'due_date' | 'status' | 'is_coding_task'>

export default function CalendarView({ groupId, onTaskSaved }: { groupId: string; onTaskSaved?: () => Promise<void> | void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const db = useMemo(() => createBrowserSupabaseClient(), [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('tasks')
      .select('id, title, due_date, status, is_coding_task')
      .eq('group_id', groupId)
      .not('due_date', 'is', null)

    setTasks((data ?? []) as CalendarTask[])
    setLoading(false)
  }, [groupId, db])

  useEffect(() => {
    void (async () => {
      await fetchTasks()
    })()

    const channel = db.channel(`calendar_${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `group_id=eq.${groupId}` },
        () => {
          void fetchTasks()
        }
      )
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [fetchTasks, groupId, db])

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = []
  const totalDays = daysInMonth(year, month)
  const startOffset = firstDayOfMonth(year, month)

  // Empty cells for alignment
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let i = 1; i <= totalDays; i++) days.push(i)

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1))

  const getTasksForDay = (day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.due_date && t.due_date.startsWith(formatted))
  }

  return (
    <div className="calendar-container" style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1rem', boxShadow: 'var(--shadow-md)', animation: 'fadeIn 0.5s ease-out' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          {loading ? (
            <div className="skeleton skeleton-title" style={{ width: '180px', height: '1.5rem' }} />
          ) : (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} color="var(--brand)" />
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="mobile-hide" style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 600 }}>Central Scheduling Hub</p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrevMonth} className="btn-icon" disabled={loading} style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
          <button onClick={handleNextMonth} className="btn-icon" disabled={loading} style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={18} /></button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} style={{ background: 'var(--bg-sub)', padding: '0.75rem 0.25rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase' }}>
            {day}
          </div>
        ))}

        {loading ? (
          Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} style={{ background: 'var(--bg-sub)', minHeight: '80px', padding: '0.5rem' }}>
              <div className="skeleton skeleton-avatar" style={{ width: '16px', height: '16px' }} />
            </div>
          ))
        ) : (
        days.map((day, idx) => {
          const dayTasks = day ? getTasksForDay(day) : []
          const isToday = day && new Date().toDateString() === new Date(year, month, day).toDateString()
          
          return (
            <div 
              key={idx} 
              onClick={() => {
                if (day) {
                   const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                   setSelectedTask(null)
                   setPreselectedDate(formatted)
                   setIsModalOpen(true)
                }
              }}
              style={{ 
                background: day ? 'var(--bg-sub)' : 'rgba(var(--bg-main-rgb), 0.2)', 
                minHeight: 'clamp(60px, 10vh, 100px)', 
                padding: '0.3rem', 
                position: 'relative',
                transition: 'background 0.2s',
                cursor: day ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem'
              }}
              className={day ? 'calendar-day-cell' : ''}
            >
              {day && (
                <>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 800, 
                    color: isToday ? 'white' : 'var(--text-main)',
                    background: isToday ? 'var(--brand)' : 'transparent',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isToday ? '0 2px 6px rgba(var(--brand-rgb), 0.3)' : 'none',
                    margin: '0 auto'
                  }}>
                    {day}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                    {dayTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id}
                        onClick={async (e) => {
                           e.stopPropagation()
                           const { data } = await db.from('tasks').select('*').eq('id', task.id).single()
                           setSelectedTask(data as Task | null)
                           setPreselectedDate(undefined)
                           setIsModalOpen(true)
                        }}
                        style={{ 
                          fontSize: '0.55rem', 
                          fontWeight: 800, 
                          padding: '0.2rem 0.4rem', 
                          borderRadius: '6px', 
                          background: task.status === 'Done' ? 'rgba(30, 142, 62, 0.15)' : 'rgba(var(--brand-rgb), 0.15)',
                          color: task.status === 'Done' ? 'var(--success)' : 'var(--brand)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}
                      >
                         {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && <div style={{ fontSize: '0.5rem', textAlign: 'center', color: 'var(--text-sub)', fontWeight: 800 }}>+{dayTasks.length - 3} more</div>}
                  </div>
                </>
              )}
            </div>
          )
        })
        )}
      </div>

      {isModalOpen && (
        <TaskModal 
          task={selectedTask} 
          groupId={groupId} 
          onRefresh={fetchTasks}
          onTaskSaved={onTaskSaved}
          initialDueDate={preselectedDate}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTask(null)
            setPreselectedDate(undefined)
          }}
        />
      )}

      <style jsx>{`
        .calendar-day-cell:hover { background: var(--surface) !important; }
        @media (max-width: 768px) {
           .calendar-container { padding: 1.25rem !important; }
           .mobile-hide { display: none !important; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
