import { useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push('/');
  }

  return (
    <div style={{ maxWidth: 400, margin: '48px auto', padding: 32, background: '#fff', borderRadius: 12 }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="login-email" style={{ display: 'block', marginBottom: 4 }}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="login-password" style={{ display: 'block', marginBottom: 4 }}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            style={{ width: '100%', minHeight: 44, padding: '8px 10px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', minHeight: 44 }}>
          Sign In
        </button>
        {error && (
          <div id="login-error" role="alert" style={{ color: '#b00020', marginTop: 8 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
