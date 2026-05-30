"use client";
import { useLaunchData } from '@/hooks/useLaunchData';
import type { User, Session } from '@supabase/supabase-js';
import { useState } from 'react';

export default function LaunchDataProvider({ children }: { children: (props: any) => JSX.Element }) {
  const { config, authUserCount } = useLaunchData();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  return children({ config, authUserCount, authUser, setAuthUser, session, setSession });
}
