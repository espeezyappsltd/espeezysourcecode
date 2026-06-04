'use client';

import type { User, Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLaunchData } from '@/hooks/useLaunchData';

type LaunchDataRenderProps = {
  config: ReturnType<typeof useLaunchData>['config'];
  authUserCount: number;
  taskCount: number;
  authUser: User | null;
  setAuthUser: (user: User | null) => void;
  session: Session | null;
  setSession: (session: Session | null) => void;
};

export default function LaunchDataProvider({
  children,
}: {
  children: (props: LaunchDataRenderProps) => ReactNode;
}) {
  const { config, authUserCount, taskCount } = useLaunchData();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  return children({ config, authUserCount, taskCount, authUser, setAuthUser, session, setSession });
}
