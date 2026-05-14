'use client'
import KanbanBoard from '../components/KanbanBoard';

import { useState, useEffect } from 'react'
import { Profile } from '../types/auth';
import { createClient } from '../lib/supabase/client';
const supabase = createClient();
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, CheckCircle, Users, Globe,
  Cpu, Zap, BarChart2, Mail,
  GraduationCap, TrendingUp, Heart, Award
} from 'lucide-react'

import { useLaunchData } from '@/hooks/useLaunchData'
import SharedCountdown from '@/components/SharedCountdown'
import UserRegistrationCounter from '@/components/UserRegistrationCounter'
import { submitPreregistration } from '@/services/preregister'



// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: 'https://espeezy.com/features', label: 'Features' },
  { href: 'https://espeezy.com/docs', label: 'Docs' }, { href: '/', label: 'Dashboard' },
  { href: 'https://espeezy.com', label: 'Register' },
]

// ─── Coming Features ─────────────────────────────────────────────────────────
const COMING_FEATURES = [
  { icon: <Cpu size={20} />, title: 'AI Study Coach', desc: 'Personalised learning paths powered by GPT-4o, adapts to your pace, course content, and group role.', tag: 'AI / ML' },
  { icon: <BarChart2 size={20} />, title: 'Live Analytics Dashboard', desc: 'Real-time contribution heatmaps, velocity tracking, and automated progress reports for educators.', tag: 'Analytics' },
  { icon: <Globe size={20} />, title: 'Global Knowledge Network', desc: 'Connect with students across universities worldwide. Share resources, form study groups, and collaborate internationally.', tag: 'Network' },

  { icon: <Award size={20} />, title: 'Verified Digital Credentials', desc: 'Blockchain-anchored certificates and portfolio exports recognised by hiring partners and graduate schools.', tag: 'Credentials' },
  { icon: <Zap size={20} />, title: 'Mobile-First Native Apps', desc: 'Full iOS and Android applications, real-time sync, push notifications, and offline mode for field students.', tag: 'Mobile' },
  { icon: <Heart size={20} />, title: 'Wellbeing & Balance Insights', desc: 'Burnout detection, workload fairness alerts, and peer support channels baked directly into the workflow.', tag: 'Wellbeing' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { config, registeredCount, configLoaded, timeLeft, setRegisteredCount } = useLaunchData()

  // Use Supabase user profile and groupId
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      // Get user from supabase auth
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!user) {
        setProfile(null);
        setGroupId(null);
        setLoadingProfile(false);
        return;
      }
      // Fetch profile from DB
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData || null);
      // Optionally fetch groupId from profile or another table
      setGroupId(profileData?.group_id || null);
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  // Form state
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [institution, setInstitution] = useState('')
  const [role, setRole] = useState('student')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loginReady, setLoginReady] = useState(false)

  const goal = parseInt(config.preregister_goal ?? '5000000', 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const { ok, data } = await submitPreregistration({
        email,
        password,
        fullName,
        institution,
        role,
        source: 'home_preregister',
      })
      if (!ok) {
        setSubmitError(data.error ?? 'Registration failed. Please try again.')
      } else {
        setSubmitted(true)
        setLoginReady(Boolean(data.login_ready))
        setPassword('')
        if (data.count) setRegisteredCount(data.count)
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  return (
    <>
      {!loadingProfile && groupId && profile && (
        <KanbanBoard groupId={groupId} profile={profile} />
      )}
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', overflowX: 'hidden', fontFamily: 'inherit' }}>
        {/* ── Grid overlay ─────────────────────────────────────────────────── */}
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 1000, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 4vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', backgroundColor: 'rgba(10,10,10,0.85)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
              <Image src="/brand_logo2.svg" width={22} height={22} style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="Logo" priority />
            </div>
            <span style={{ fontWeight: 950, fontSize: '1rem', color: 'white', letterSpacing: '-0.03em' }}>{config.brand_name}</span>
          </Link>
          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hide-mobile">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/preregister" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'var(--brand)', fontSize: '0.8rem', fontWeight: 800, color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Join Early Access
            </Link>
          </div>
        </nav>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section id="hero" style={{ padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '7px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', marginBottom: '2rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 0 8px var(--brand)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Early Access  -  Now Open</span>
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, margin: '0 auto 1.5rem', maxWidth: '960px' }}>
          Coming Soon to a campus near you:{' '}
          <span style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Espeezy.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.25 }}
          style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '680px', margin: '0 auto 3rem', fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', lineHeight: 1.6, fontWeight: 500 }}>
          {config.launch_message}
        </motion.p>

        {/* Countdown */}
        {configLoaded && <SharedCountdown timeLeft={timeLeft} />}

        {/* User Counter */}
        <UserRegistrationCounter registeredCount={registeredCount} goal={goal} />
      </section>

      {/* ── REGISTRATION FORM ─────────────────────────────────────────────── */}
      <section id="register" style={{ padding: '0 clamp(1rem, 4vw, 2.5rem) clamp(4rem, 8vw, 7rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: 'clamp(2rem, 5vw, 3rem)', backdropFilter: 'blur(20px)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={28} color="var(--brand)" />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>You are on the list.</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
                    {loginReady
                      ? `Your Espeezy login is ready. Use the same email and password on Espeezy, Games, and Kanban.`
                      : `We will email you the moment ${config.brand_name} opens its doors. We will be in touch soon.`}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setSubmitted(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                      Register Another
                    </button>
                    <Link href="/landing-v1" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'var(--brand)', color: 'white', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                      Explore Features →
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '0.5rem', display: 'inline-flex', padding: '4px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Free Forever Plan · Early Access</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: '1rem 0 0.5rem', lineHeight: 1.1 }}>
                    Secure your spot.<br />
                    <span style={{ color: 'var(--brand)' }}>No credit card required.</span>
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    Register your interest today, set your shared Espeezy password once, and use that same login on Espeezy, Games, and Kanban.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="email" placeholder="Email Address *" value={email} onChange={e => setEmail(e.target.value)} required
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="password" placeholder="Create a shared password *" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="text" placeholder="Institution / University (optional)" value={institution} onChange={e => setInstitution(e.target.value)}
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    <select value={role} onChange={e => setRole(e.target.value)}
                      style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: '#111', color: role ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                      <option value="student">I am a Student</option>
                      <option value="educator">I am an Educator / Lecturer</option>
                      <option value="institution">I represent an Institution</option>
                      <option value="investor">I am an Investor / Partner</option>
                      <option value="other">Other</option>
                    </select>

                    {submitError && (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.85rem' }}>
                        {submitError}
                      </div>
                    )}

                    <button type="submit" disabled={submitting}
                      style={{ width: '100%', padding: '0.95rem', borderRadius: '10px', background: submitting ? 'rgba(16,185,129,0.5)' : 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}>
                      {submitting ? 'Registering…' : <><Mail size={16} /> Join the Waitlist  -  It&apos;s Free</>}
                    </button>

                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                      By registering you agree to our Privacy Policy. Your password will be used to prepare your login across Espeezy, Games, and Kanban.
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── PRODUCT GALLERY ──────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', padding: '5px 14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Experience the Future</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem' }}>
              A powerful interface for<br />high-performance students.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {[
              { src: '/screenshots/dashboard.png', title: 'Smart Dashboard', desc: 'Real-time velocity tracking and team heatmaps.' },
              { src: '/screenshots/admin.png', title: 'Institutional Control', desc: 'Powerful tools for educators to monitor engagement.' },
              { src: '/screenshots/terminal.png', title: 'The Gateway', desc: 'Institutional-grade data orchestration and security.' },
              { src: '/screenshots/mobile.png', title: 'Go Mobile', desc: 'Sync your tasks and collaborate from anywhere.' }
            ].map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
                  <Image src={img.src} alt={img.title} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} />
                </div>
                <div style={{ padding: '1.5rem', background: 'linear-gradient(to top, #0a0a0a 0%, transparent 100%)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{img.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{img.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY THIS MATTERS ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '5px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>The Problem We Solve</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.25rem', maxWidth: '820px', margin: '0 auto 1.25rem' }}>
            Group work is broken.<br />
            <span style={{ color: 'var(--brand)' }}>We are fixing it.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '640px', margin: '0 auto 4rem', fontSize: '1.05rem', lineHeight: 1.65 }}>
            Every year millions of students receive the same grade despite wildly different contributions. Educators lack visibility. High performers burn out. Free riders pass. {config.brand_name} ends this cycle  -  with data, transparency, and fairness at its core.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: <GraduationCap size={22} />, stat: '73%', label: 'of students feel their individual effort is not fairly recognised in group assessments.' },
              { icon: <Users size={22} />, stat: '2.4B+', label: 'students worldwide will benefit from transparent, equitable collaboration tools.' },
              { icon: <TrendingUp size={22} />, stat: '3x', label: 'more likely to complete a course when accountability and recognition systems are in place.' },
              { icon: <Globe size={22} />, stat: '195', label: 'countries where fair access to quality educational tools remains a critical gap.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: '1.75rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textAlign: 'left' }}>
                <div style={{ color: 'var(--brand)', marginBottom: '1rem', opacity: 0.7 }}>{item.icon}</div>
                <div style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 950, letterSpacing: '-0.05em', marginBottom: '0.5rem', color: 'white' }}>{item.stat}</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.55, margin: 0 }}>{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMING FEATURES ──────────────────────────────────────────────── */}
      <section id="features" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '5px 14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '100px', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>What&apos;s Coming in V2</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1rem' }}>
              Built for the next era of education.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
              These features are in active development. Your pre-registration and support directly accelerates their delivery.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {COMING_FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', transition: 'border-color 0.2s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)')}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', color: 'var(--brand)' }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px' }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section removed as it contained legacy dev links */}

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 4vw, 2.5rem)', textAlign: 'center', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: '1.5rem' }}>
            Be part of the<br />
            <span style={{ color: 'var(--brand)' }}>founding generation.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            5 million pre-registrations. One mission. Free, fair, and powerful education infrastructure  -  for every student on the planet.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/preregister" style={{ padding: '1rem 2.25rem', borderRadius: '12px', background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Register Now <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2.5rem)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '28px', height: '28px', background: '#10b981', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/brand_logo2.svg" width={20} height={20} style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="Logo" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.02em' }}>{config.brand_name}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[['/', 'Home'], ['#features', 'Features'], ['/preregister', 'Register']].map(([href, label]) => (
              <Link key={href} href={href} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            © {new Date().getFullYear()} {config.brand_name}. All rights reserved.
          </p>
        </div>
      </footer>
      <style jsx>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 640px) { .hide-mobile { display: none !important; } }
      `}</style>
      </div>
    </>
  );
}
