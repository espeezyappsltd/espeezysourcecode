import { NextRequest, NextResponse } from 'next/server';
import { db, createAdminClient, createServerSupabaseClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TaskSpec {
  title: string;
  description: string;
  agentName: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependsOnIndexes?: number[]; // indexes into the tasks array this task depends on
}

/**
 * Rule-based command decomposer.
 * Returns a list of task specs based on keywords in the command.
 */
function decomposeCommand(command: string): TaskSpec[] {
  const cmd = command.toLowerCase();
  const tasks: TaskSpec[] = [];

  const isUI = /component|page|ui|design|layout|form|button|modal|style|css|frontend/i.test(cmd);
  const isAPI = /api|route|endpoint|backend|database|db|migration|sql|stripe|webhook|auth/i.test(cmd);
  const isInfra = /deploy|ci\/cd|github action|vercel|build|environment|env|devops/i.test(cmd);

  // Backend builder (Gamma)
  if (isAPI) {
    tasks.push({
      title: 'Build API layer',
      description: `Implement the backend changes required for: "${command}". Follow existing patterns — createAdminClient() for writes, createReadClient() for reads. Add Zod validation on all inputs.`,
      agentName: 'Gamma',
      priority: 'high',
    });
  }

  // Frontend builder (Alpha) — depends on API if both needed
  if (isUI) {
    tasks.push({
      title: 'Build UI components',
      description: `Implement the frontend changes required for: "${command}". Follow the design system, ensure WCAG 2.1 AA compliance, mobile-first.`,
      agentName: 'Alpha',
      priority: 'high',
      dependsOnIndexes: isAPI ? [0] : [],
    });
  }

  // Frontend validator (Beta) — depends on UI
  if (isUI) {
    const uiIdx = tasks.findIndex(t => t.agentName === 'Alpha');
    tasks.push({
      title: 'Validate UI — E2E tests & Lighthouse',
      description: `Write Playwright E2E tests for the UI delivered for: "${command}". Run Lighthouse (performance ≥ 90, accessibility ≥ 95). Report pass/fail counts and scores.`,
      agentName: 'Beta',
      priority: 'high',
      dependsOnIndexes: uiIdx >= 0 ? [uiIdx] : [],
    });
  }

  // Backend validator (Delta) — depends on API
  if (isAPI) {
    const apiIdx = tasks.findIndex(t => t.agentName === 'Gamma');
    tasks.push({
      title: 'Security audit — OWASP & RLS validation',
      description: `Audit the API routes built for: "${command}". Check OWASP Top 10, verify RLS policies, run security-adversarial test suite. Report clean or list vulnerabilities.`,
      agentName: 'Delta',
      priority: 'critical',
      dependsOnIndexes: apiIdx >= 0 ? [apiIdx] : [],
    });
  }

  // DevOps builder (Epsilon) — always runs last to verify build
  const builderIndexes = tasks
    .map((t, i) => (t.agentName === 'Alpha' || t.agentName === 'Gamma' ? i : -1))
    .filter(i => i >= 0);

  tasks.push({
    title: 'Build verification & deployment',
    description: `Run \`npx next build\` after all feature tasks complete for: "${command}". Ensure zero TypeScript errors, zero build errors. Coordinate Vercel deployment.`,
    agentName: 'Epsilon',
    priority: 'high',
    dependsOnIndexes: builderIndexes,
  });

  // DevOps validator (Zeta) — depends on Epsilon
  const epsilonIdx = tasks.findIndex(t => t.agentName === 'Epsilon');
  tasks.push({
    title: 'Final validation — secrets, bundle size, uptime',
    description: `After build passes for: "${command}", scan for hardcoded secrets, check bundle size regression, verify /api/health responds < 500ms. Confirm all clear or flag issues.`,
    agentName: 'Zeta',
    priority: 'high',
    dependsOnIndexes: [epsilonIdx],
  });

  // Handle infra-only commands
  if (isInfra && !isUI && !isAPI) {
    tasks.unshift({
      title: 'Infrastructure changes',
      description: `Implement the infrastructure/DevOps changes required for: "${command}". Update vercel.json, GitHub Actions workflows, or environment configuration as needed.`,
      agentName: 'Epsilon',
      priority: 'high',
    });
  }

  return tasks;
}

export async function POST(req: NextRequest) {
  // Require admin auth
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const command: string = body?.command?.trim();
  if (!command || command.length < 10) {
    return NextResponse.json({ error: 'command must be at least 10 characters' }, { status: 400 });
  }
  if (command.length > 2000) {
    return NextResponse.json({ error: 'command must be under 2000 characters' }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Fetch all agents
  const { data: agents, error: agentsError } = await admin
    .from('agents')
    .select('id, name')
    .eq('status', 'active');

  if (agentsError || !agents?.length) {
    return NextResponse.json({ error: 'No active agents found. Run the v34 migration first.' }, { status: 503 });
  }

  const agentMap = new Map<string, string>(agents.map((a: { name: string; id: string }) => [a.name, a.id]));

  // Decompose the command into tasks
  const taskSpecs = decomposeCommand(command);

  // Insert tasks in order, resolving depends_on by real UUIDs
  const insertedIds: string[] = [];

  for (const spec of taskSpecs) {
    const agentId = agentMap.get(spec.agentName);

    const dependsOn: string[] = (spec.dependsOnIndexes ?? [])
      .map(i => insertedIds[i])
      .filter(Boolean);

    const { data: inserted, error: insertError } = await admin
      .from('agent_tasks')
      .insert({
        title: spec.title,
        description: spec.description,
        priority: spec.priority,
        status: 'not_started',
        assigned_agent_id: agentId ?? null,
        depends_on: dependsOn,
        output_artifacts: [],
        logs: `Orchestrated from command: "${command.substring(0, 100)}"`,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Failed to insert task: ${insertError.message}` }, { status: 500 });
    }

    insertedIds.push(inserted.id);
  }

  // Return the plan
  const plan = taskSpecs.map((spec, i) => ({
    task_id: insertedIds[i],
    title: spec.title,
    agent: spec.agentName,
    priority: spec.priority,
    depends_on: (spec.dependsOnIndexes ?? []).map(idx => insertedIds[idx]).filter(Boolean),
  }));

  return NextResponse.json({
    ok: true,
    command,
    tasks_created: plan.length,
    plan,
  });
}
