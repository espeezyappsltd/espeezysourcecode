export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Config Test</h1>
      <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Found'}</p>
      <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Not Found'}</p>
    </div>
  );
}
