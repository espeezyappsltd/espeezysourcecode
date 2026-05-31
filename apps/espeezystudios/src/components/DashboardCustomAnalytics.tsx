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
  Filler,
} from 'chart.js';
import {
  StudioAnalyticsGrid,
  StudioAnalyticsPanel,
  studioBarLineChartOptions,
} from './analytics/StudioAnalyticsPanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DashboardCustomAnalytics() {
  const [userJobCounts, setUserJobCounts] = useState<{ name: string; count: number }[]>([]);
  const [jobCompletionTime, setJobCompletionTime] = useState<{ day: string; avg: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomAnalytics() {
      const { data: jobs } = await supabase.from('jobs').select('assigned_to, status, created_at, completed_at');
      const userCounts: Record<string, number> = {};
      const completionTimes: Record<string, number[]> = {};
      type Job = { assigned_to?: string; status: string; created_at?: string; completed_at?: string };
      (jobs as Job[] | undefined)?.forEach((job) => {
        const user = job.assigned_to || 'Unassigned';
        userCounts[user] = (userCounts[user] || 0) + 1;
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

  const userBarOptions = {
    ...studioBarLineChartOptions,
    scales: {
      ...studioBarLineChartOptions.scales,
      x: {
        ...studioBarLineChartOptions.scales?.x,
        ticks: {
          ...studioBarLineChartOptions.scales?.x?.ticks,
          maxTicksLimit: 6,
        },
      },
    },
  };

  const completionLineOptions = {
    ...studioBarLineChartOptions,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 10 } },
    },
  };

  return (
    <StudioAnalyticsGrid label="Team and completion metrics">
      <StudioAnalyticsPanel title="Jobs per User" loading={loading}>
        <Bar data={barData} options={userBarOptions} />
      </StudioAnalyticsPanel>
      <StudioAnalyticsPanel title="Avg Job Completion Time (hrs)" loading={loading}>
        <Line data={lineData} options={completionLineOptions} />
      </StudioAnalyticsPanel>
    </StudioAnalyticsGrid>
  );
}
