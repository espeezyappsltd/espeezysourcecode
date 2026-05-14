import React from 'react'
import { Layers, Users, Zap, Shield, Milestone, Award, LayoutGrid, BookOpen, Globe, Fingerprint, HelpCircle, Braces } from 'lucide-react'
import type { FAQ, Feature, NavMenus } from '@/types/landing'

export const features: Feature[] = [
  { 
    icon: <Layers size={21} />, 
    title: "Task Management Made Easy", 
    desc: "Collaborate with your team on tasks with our smart task board. Save time with automatic updates and real-time syncing across all your devices.",
    color: "var(--brand)"
  },
  { 
    icon: <Users size={21} />, 
    title: "Connect with Your Peers", 
    desc: "Build your university network and connect with other students in your classes. Share resources and collaborate on projects.",
    color: "#10b981"
  },
  { 
    icon: <Zap size={21} />, 
    title: "Stay Synced", 
    desc: "Our quick syncing feature keeps your chat and file sharing up-to-date across all your devices. Never miss a beat with our reliable platform.",
    color: "var(--accent)"
  },
  { 
    icon: <Shield size={21} />, 
    title: "Credit Where Credit is Due", 
    desc: "We keep a safe record of your contributions in every project. Ensure you always get the credit you deserve with our platform.",
    color: "#6366f1"
  },
  { 
    icon: <Milestone size={21} />, 
    title: "See Your Progress", 
    desc: "Track your progress with our visible progress feature. Stay motivated and reach your goals with our platform.",
    color: "#f56565"
  },
  { 
    icon: <Award size={21} />, 
    title: "Recognition for Your Work", 
    desc: "We recognize your hard work with our award system. Earn badges and rewards for your contributions to projects.",
    color: "#f6e05e"
  },
  { 
    icon: <LayoutGrid size={21} />, 
    title: "Organize Your Tasks", 
    desc: "Organize your tasks with our layout grid feature. Create a visually appealing and organized task board.",
    color: "#5c6bc0"
  },
  { 
    icon: <BookOpen size={21} />, 
    title: "Access to Resources", 
    desc: "Access a library of resources and tutorials with our book open feature. Learn new skills and stay up-to-date with industry trends.",
    color: "#3b82f6"
  },
  { 
    icon: <Globe size={21} />, 
    title: "Global Community", 
    desc: "Join a global community of students and professionals. Connect with people from all over the world and collaborate on projects.",
    color: "#28a745"
  },
  { 
    icon: <Fingerprint size={21} />, 
    title: "Personalized Experience", 
    desc: "Enjoy a personalized experience with our fingerprint feature. Your preferences and settings are saved for easy access.",
    color: "#795548"
  },
  { 
    icon: <HelpCircle size={21} />, 
    title: "Support When You Need It", 
    desc: "Our help circle feature provides support when you need it. Get help with any issues or questions you may have.",
    color: "#9f3a38"
  },
  { 
    icon: <Braces size={21} />, 
    title: "Safety First", 
    desc: "Your safety is our priority with our braces feature. We keep your data secure and private. Rest assured, your information is in good hands.",
    color: "#d32f2f"
  }
]

export const faqs: FAQ[] = [
  {
    q: 'What is Espeezy built for?',
    a: 'Espeezy is built for student collaboration, contribution visibility, and coordinated project delivery across shared academic workspaces.',
  },
  {
    q: 'Does it support payments and upgrades?',
    a: 'Yes. The platform supports Stripe-powered subscriptions, one-time payments, donations, and billing management.',
  },
  {
    q: 'How is student work protected?',
    a: 'The app uses authenticated Firebase flows, Firestore security rules, controlled admin writes, and guarded API routes to protect user data.',
  },
  {
    q: 'Can teams collaborate in real time?',
    a: 'Yes. Presence, chat, task activity, and shared workflows are designed to keep teams synchronized in real time.',
  },
]

export const navMenus: NavMenus = {
  product: {
    label: 'Product',
    categories: [
      {
        label: 'Workspace',
        items: [
          { id: 'task-board', title: 'Task Board', desc: 'Coordinate team execution with shared planning and status visibility.', icon: <LayoutGrid size={18} />, href: '/#features' },
          { id: 'live-presence', title: 'Live Presence', desc: 'See who is active, collaborating, and moving work forward in real time.', icon: <Zap size={18} />, href: '/#features' },
        ],
      },
      {
        label: 'Trust',
        items: [
          { id: 'contribution-tracking', title: 'Contribution Tracking', desc: 'Keep a durable record of work completed across project teams.', icon: <Award size={18} />, href: '/#mission' },
          { id: 'security-controls', title: 'Security Controls', desc: 'Protect collaboration with guarded workflows and authenticated access.', icon: <Shield size={18} />, href: '/#faq' },
        ],
      },
    ],
  },
  solutions: {
    label: 'Solutions',
    categories: [
      {
        label: 'People',
        items: [
          { id: 'student-teams', title: 'Student Teams', desc: 'Built for project groups, clubs, and shared academic work.', icon: <Users size={18} />, href: '/#features' },
          { id: 'global-network', title: 'Global Network', desc: 'Connect with peers beyond your immediate classroom or campus.', icon: <Globe size={18} />, href: '/#features' },
        ],
      },
      {
        label: 'Growth',
        items: [
          { id: 'resource-library', title: 'Resource Library', desc: 'Give teams a place to exchange tools, guides, and project resources.', icon: <BookOpen size={18} />, href: '/#features' },
          { id: 'progress-view', title: 'Progress Visibility', desc: 'Surface milestones and momentum without losing operational clarity.', icon: <Milestone size={18} />, href: '/#mission' },
        ],
      },
    ],
  },
  platform: {
    label: 'Platform',
    categories: [
      {
        label: 'Core Systems',
        items: [
          { id: 'identity', title: 'Identity Layer', desc: 'Profiles and personalization keep work context tied to real contributors.', icon: <Fingerprint size={18} />, href: '/#mission' },
          { id: 'support', title: 'Support Paths', desc: 'Students can access help, guidance, and platform support when needed.', icon: <HelpCircle size={18} />, href: '/#faq' },
        ],
      },
      {
        label: 'Reliability',
        items: [
          { id: 'structured-workflows', title: 'Structured Workflows', desc: 'Operational rules and automation keep complex actions predictable.', icon: <Layers size={18} />, href: '/#faq' },
          { id: 'safety-first', title: 'Safety First', desc: 'The platform is designed to protect data, access, and financial operations.', icon: <Braces size={18} />, href: '/#faq' },
        ],
      },
    ],
  },
}
