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
      <div>Sorry, the page you are looking for does not exist.</div>
    </div>
  );
}
