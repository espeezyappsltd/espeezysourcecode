"use client";

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
import {
  StudioAnalyticsGrid,
  StudioAnalyticsPanel,
  studioBarLineChartOptions,
  studioPieChartOptions,
} from './analytics/StudioAnalyticsPanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardAnalytics() {
  const [jobStats, setJobStats] = useState({ pending: 0, in_progress: 0, done: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.from('jobs').select('status');
      if (!error && data) {
        type Job = { status: string };
        const pending = data.filter((j: Job) => j.status === 'pending').length;
        const in_progress = data.filter((j: Job) => j.status === 'in_progress').length;
        const done = data.filter((j: Job) => j.status === 'done').length;
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
    <StudioAnalyticsGrid label="Job status overview">
      <StudioAnalyticsPanel title="Jobs Status (Bar)" loading={loading}>
        <Bar data={barData} options={studioBarLineChartOptions} />
      </StudioAnalyticsPanel>
      <StudioAnalyticsPanel title="Jobs Status (Pie)" loading={loading}>
        <Pie data={pieData} options={studioPieChartOptions} />
      </StudioAnalyticsPanel>
    </StudioAnalyticsGrid>
  );
}
