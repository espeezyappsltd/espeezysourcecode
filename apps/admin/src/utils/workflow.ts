type WorkflowFunction<TArgs extends unknown[], TResult> = (...args: TArgs) => TResult | Promise<TResult>

type WorkflowRun<TResult> = {
  runId: string
  status: Promise<'completed'>
  result: TResult
}

function createRunId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `wf-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function start<TArgs extends unknown[], TResult>(
  workflow: WorkflowFunction<TArgs, TResult>,
  args: TArgs
): Promise<WorkflowRun<TResult>> {
  const result = await workflow(...args)

  return {
    runId: createRunId(),
    status: Promise.resolve('completed'),
    result,
  }
}