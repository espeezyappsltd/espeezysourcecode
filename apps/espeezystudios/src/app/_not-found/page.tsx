"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-client';
import type { User } from '@supabase/supabase-js';
export default function NotFoundPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 12 }}>
      <h2>Page Not Found</h2>
      <div style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem', lineHeight: '1.6', padding: '0 1rem', background: '#fef3c7'}}>

        <p>It seems you have ventured into uncharted territory. <br/>Let us get you back on track!</p>
        <button onClick={() => window.history.back()} style={{ marginTop: 16, minHeight: 44 }}>Go Back</button>


      </div>
    </div>
  );
}
