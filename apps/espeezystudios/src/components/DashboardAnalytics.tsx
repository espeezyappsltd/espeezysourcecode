import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardAnalytics() {
  const [jobStats, setJobStats] = useState({ pending: 0, in_progress: 0, done: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.from('jobs').select('status');
      if (!error && data) {
        const pending = data.filter((j: any) => j.status === 'pending').length;
        const in_progress = data.filter((j: any) => j.status === 'in_progress').length;
        const done = data.filter((j: any) => j.status === 'done').length;
        setJobStats({ pending, in_progress, done });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const barData = {
    labels: ['Pending', 'In Progress', 'Done'],
    datasets: [
      {
        label: 'Jobs',
        data: [jobStats.pending, jobStats.in_progress, jobStats.done],
        backgroundColor: ['#f59e42', '#38bdf8', '#22c55e'],
        borderRadius: 8,
      },
    ],
  };

  const pieData = {
    labels: ['Pending', 'In Progress', 'Done'],
    datasets: [
      {
        data: [jobStats.pending, jobStats.in_progress, jobStats.done],
        backgroundColor: ['#f59e42', '#38bdf8', '#22c55e'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ margin: '2.5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 900, width: '100%' }}>
      <div style={{ background: 'var(--studios-surface-2)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
        <h3 style={{ marginBottom: 16 }}>Jobs Status (Bar)</h3>
        {loading ? <p>Loading…</p> : <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
      </div>
      <div style={{ background: 'var(--studios-surface-2)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
        <h3 style={{ marginBottom: 16 }}>Jobs Status (Pie)</h3>
        {loading ? <p>Loading…</p> : <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />}
      </div>
    </div>
  );
}
