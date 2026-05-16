import { NextResponse } from 'next/server';
import { Q } from '@/lib/query-columns';
import { createClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  let isAdmin = profile?.role === 'admin';

  if (user.email === 'kedogosospeter36@gmail.com') {
    isAdmin = true;
    if (profile?.role !== 'admin') {
      // Auto promote to admin using the service role client
      const adminSupabase = createAdminSupabaseClient();
      await adminSupabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    }
  }


  // If not admin, they get minimal dummy/safe data or 403.
  if (!isAdmin) {
    return NextResponse.json({
      access: 'minimal',
      metrics: {
        total_users: 'hidden',
        active_groups: 'hidden',
        active_tasks: 'hidden',
        total_messages: 'hidden',
        pending_requests: 'hidden',
      },
      recentActivity: []
    }, { status: 403 }); // Returning 403 to explicitly block them from dashboard
  }

  // Super user flow (Admin)
  const adminSupabase = createAdminSupabaseClient();
  
  const { data: metrics, error: metricsError } = await adminSupabase
    .from('admin_platform_metrics')
    .select(Q.adminMetrics)
    .single();

  const { data: recentActivity, error: activityError } = await adminSupabase
    .from('admin_recent_activity')
    .select('id, event_type, description, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (metricsError) {
    console.error('Admin metrics error:', metricsError);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }

  return NextResponse.json({
    access: 'full',
    metrics: metrics || {
        total_users: 0,
        active_groups: 0,
        active_tasks: 0,
        total_messages: 0,
        pending_requests: 0,
    },
    recentActivity: recentActivity || []
  });
}
