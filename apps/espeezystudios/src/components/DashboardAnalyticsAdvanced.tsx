import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardAnalyticsAdvanced() {
  const [jobHistory, setJobHistory] = useState<number[]>([]);
  const [projectStats, setProjectStats] = useState({ active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Time series: jobs created per day (last 14 days)
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('created_at, status');
      // Cross-table: projects (active/completed)
      const { data: projects, error: projectsError } = await supabase.from('projects').select('status');
      // Prepare time series
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
      });
      const jobsPerDay = days.map(day => jobs?.filter(j => j.created_at?.slice(0, 10) === day).length || 0);
      // Project stats
      type Project = { status: string };
      const active = projects?.filter((p: Project) => p.status !== 'done').length || 0;
      const completed = projects?.filter((p: Project) => p.status === 'done').length || 0;
      setJobHistory(jobsPerDay);
      setProjectStats({ active, completed });
      setLoading(false);
    }
    fetchData();
  }, []);

  const lineData = {
    labels: Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toLocaleDateString();
    }),
    datasets: [
      {
        label: 'Jobs Created',
        data: jobHistory,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const doughnutData = {
    labels: ['Active Projects', 'Completed Projects'],
    datasets: [
      {
        data: [projectStats.active, projectStats.completed],
        backgroundColor: ['#6366f1', '#22c55e'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ margin: '2.5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 900, width: '100%' }}>
      <div style={{ background: 'var(--studios-surface-2)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
        <h3 style={{ marginBottom: 16 }}>Jobs Created (Last 14 Days)</h3>
        {loading ? <p>Loading…</p> : <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
      </div>
      <div style={{ background: 'var(--studios-surface-2)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
        <h3 style={{ marginBottom: 16 }}>Projects Status</h3>
        {loading ? <p>Loading…</p> : <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />}
      </div>
    </div>
  );
}
