"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardCustomAnalytics() {
  const [userJobCounts, setUserJobCounts] = useState<{ name: string; count: number }[]>([]);
  const [jobCompletionTime, setJobCompletionTime] = useState<{ day: string; avg: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomAnalytics() {
      // 1. Jobs per user (bar)
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('assigned_to, status, created_at, completed_at');
      // 2. Average job completion time per day (line)
      const userCounts: Record<string, number> = {};
      const completionTimes: Record<string, number[]> = {};
      type Job = { assigned_to?: string; status: string; created_at?: string; completed_at?: string };
      (jobs as Job[] | undefined)?.forEach((job) => {
        // Jobs per user
        const user = job.assigned_to || 'Unassigned';
        userCounts[user] = (userCounts[user] || 0) + 1;
        // Completion time
        if (job.status === 'done' && job.created_at && job.completed_at) {
          const day = job.completed_at.slice(0, 10);
          const created = new Date(job.created_at).getTime();
          const completed = new Date(job.completed_at).getTime();
          const diffHours = (completed - created) / (1000 * 60 * 60);
          if (!completionTimes[day]) completionTimes[day] = [];
          completionTimes[day].push(diffHours);
        }
      });
      setUserJobCounts(Object.entries(userCounts).map(([name, count]) => ({ name, count })));
      setJobCompletionTime(
        Object.entries(completionTimes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, arr]) => ({ day, avg: arr.reduce((a, b) => a + b, 0) / arr.length }))
      );
      setLoading(false);
    }
    fetchCustomAnalytics();
  }, []);

  const barData = {
    labels: userJobCounts.map(u => u.name),
    datasets: [
      {
        label: 'Jobs per User',
        data: userJobCounts.map(u => u.count),
        backgroundColor: '#38bdf8',
        borderRadius: 8,
      },
    ],
  };

  const lineData = {
    labels: jobCompletionTime.map(j => j.day),
    datasets: [
      {
        label: 'Avg Completion Time (hrs)',
        data: jobCompletionTime.map(j => j.avg),
        borderColor: '#f59e42',
        backgroundColor: 'rgba(245,158,66,0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div style={{ margin: '2.5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 900, width: '100%' }}>
      <div style={{ background: 'var(--studios-surface-2)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
        <h3 style={{ marginBottom: 16 }}>Jobs per User</h3>
        {loading ? <p>Loading…</p> : <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
      </div>
      <div style={{ background: 'var(--studios-surface-2)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
        <h3 style={{ marginBottom: 16 }}>Avg Job Completion Time (hrs)</h3>
        {loading ? <p>Loading…</p> : <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />}
      </div>
    </div>
  );
}
