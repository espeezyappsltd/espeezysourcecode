"use client";

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
  Filler,
} from 'chart.js';
import {
  StudioAnalyticsGrid,
  StudioAnalyticsPanel,
  studioBarLineChartOptions,
  studioPieChartOptions,
} from './analytics/StudioAnalyticsPanel';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardAnalyticsAdvanced() {
  const [jobHistory, setJobHistory] = useState<number[]>([]);
  const [projectStats, setProjectStats] = useState({ active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: jobs } = await supabase.from('jobs').select('created_at, status');
      const { data: projects } = await supabase.from('projects').select('status');
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
      });
      const jobsPerDay = days.map(day => jobs?.filter(j => j.created_at?.slice(0, 10) === day).length || 0);
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
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
    <StudioAnalyticsGrid label="Jobs and projects trends">
      <StudioAnalyticsPanel title="Jobs Created (Last 14 Days)" loading={loading}>
        <Line data={lineData} options={studioBarLineChartOptions} />
      </StudioAnalyticsPanel>
      <StudioAnalyticsPanel title="Projects Status" loading={loading}>
        <Doughnut data={doughnutData} options={studioPieChartOptions} />
      </StudioAnalyticsPanel>
    </StudioAnalyticsGrid>
  );
}
