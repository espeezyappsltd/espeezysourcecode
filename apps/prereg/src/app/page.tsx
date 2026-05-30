

import Link from 'next/link';
import Image from 'next/image';
import { motion, MotionConfig } from 'framer-motion';
import type { Session, User } from '@supabase/supabase-js';
import {
  ArrowRight, Users, Globe,
  BookOpen, Cpu, Zap, BarChart2,
  GraduationCap, TrendingUp,
} from 'lucide-react';
import PreRegisterPageClient from './PreRegisterPageClient';

export default function Page() {
  return <PreRegisterPageClient />;
}



