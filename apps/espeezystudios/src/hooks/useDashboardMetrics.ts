import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState({
    projects: 0,
    jobs: 0,
    team: 0,
    completed: 0,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    async function fetchMetrics() {
      // Fetch jobs
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*');
      // Fetch projects (assuming a 'projects' table)
      const { data: projects, error: projectsError } = await supabase.from('projects').select('*');
      // Fetch team (assuming a 'team_members' table)
      const { data: team, error: teamError } = await supabase.from('team_members').select('*');
      // Completed jobs
      const completed = jobs ? jobs.filter((j: any) => j.status === 'done').length : 0;
      if (mounted) {
        setMetrics({
          projects: projects?.length || 0,
          jobs: jobs?.filter((j: any) => j.status !== 'done').length || 0,
          team: team?.length || 0,
          completed,
          loading: false,
        });
      }
    }
    fetchMetrics();
    return () => { mounted = false; };
  }, []);

  return metrics;
}
