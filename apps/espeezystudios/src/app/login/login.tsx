import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase-client';
import StudiosLogo from '@/components/StudiosLogo';
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();


  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    getSession(); 
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8' }}>
      <LoginContent searchParams={searchParams} />
    </div>
  );
}

function LoginContent({ searchParams }: { searchParams: URLSearchParams }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <StudiosLogo variant="login" />
      </div>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Please sign in to access your dashboard and projects.</p>   
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '1rem' }}>
        <a
          href={`/api/auth/signin?provider=github&${searchParams.toString()}`}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#333',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'background-color 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#555')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#333')}
        >
          Sign in with GitHub
        </a>
        <a

          href={`/api/auth/signin?provider=google&${searchParams.toString()}`}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4285F4',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'background-color 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#357ae8')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4285F4')}
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}


