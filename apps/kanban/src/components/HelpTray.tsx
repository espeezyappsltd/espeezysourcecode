"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookOpen, LifeBuoy, ArrowRight } from "lucide-react";

const FEATURE_GUIDES = [
  {
    title: "Kanban Board",
    desc: "Organize tasks, drag to reorder, assign teammates, and track progress.",
    link: "/docs/features/kanban"
  },
  {
    title: "Roadmap",
    desc: "Plan milestones, set deadlines, and visualize your project timeline.",
    link: "/docs/features/roadmap"
  },
  {
    title: "Team & Chat",
    desc: "Invite teammates, manage roles, and collaborate in real-time chat.",
    link: "/docs/features/team"
  },
  {
    title: "Marketplace",
    desc: "Buy, sell, or swap resources securely with other students.",
    link: "/docs/features/marketplace"
  },
  {
    title: "Profile & Settings",
    desc: "Customize your profile, manage notifications, and set preferences.",
    link: "/docs/features/profile"
  }
];

export default function HelpTray() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-help-tray", handler);
    return () => window.removeEventListener("open-help-tray", handler);
  }, []);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 9999,
      width: "min(95vw, 420px)", background: "var(--surface)",
      borderLeft: "2px solid var(--border)", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
      animation: "slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)",
      display: "flex", flexDirection: "column"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 1.5rem 1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <LifeBuoy size={24} color="#2563eb" />
          <span style={{ fontWeight: 900, fontSize: "1.25rem", color: "#2563eb" }}>Help & Onboarding</span>
        </div>
        <button aria-label="Close Help" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, borderRadius: 8 }} onClick={() => setOpen(false)}>
          <X size={22} />
        </button>
      </div>
      <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>How can we help?</h3>
          <p style={{ color: "#64748b", fontSize: "0.98rem", marginBottom: 0 }}>
            Explore guides for every feature, or jump to the <Link href="/docs/getting-started" style={{ color: "#2563eb", fontWeight: 700 }}>Quick Start Guide <ArrowRight size={14} style={{ verticalAlign: "middle" }} /></Link>.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {FEATURE_GUIDES.map((f) => (
            f.title === "Kanban Board" ? (
              <button 
                key={f.title} 
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent('open-kanban-onboarding'));
                }}
                style={{ textAlign: 'left', cursor: 'pointer', width: '100%', display: "block", padding: "1.1rem 1.2rem", borderRadius: 14, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.13)", color: "#2563eb", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none", marginBottom: 0 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.3rem" }}>
                  <BookOpen size={18} />
                  <span>{f.title}</span>
                </div>
                <div style={{ color: "#64748b", fontWeight: 500, fontSize: "0.97rem" }}>{f.desc}</div>
              </button>
            ) : (
              <Link key={f.title} href={f.link} style={{ display: "block", padding: "1.1rem 1.2rem", borderRadius: 14, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.13)", color: "#2563eb", fontWeight: 800, fontSize: "1.05rem", textDecoration: "none", marginBottom: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.3rem" }}>
                  <BookOpen size={18} />
                  <span>{f.title}</span>
                </div>
                <div style={{ color: "#64748b", fontWeight: 500, fontSize: "0.97rem" }}>{f.desc}</div>
              </Link>
            )
          ))}
        </div>
      </div>
      <div style={{ padding: "1.25rem", borderTop: "1px solid var(--border)", background: "rgba(59,130,246,0.04)", textAlign: "center" }}>
        <Link href="/docs/getting-started" className="btn-primary" style={{ fontWeight: 900, fontSize: "1rem", borderRadius: 12, padding: "0.7rem 2rem", background: "#2563eb", color: "white", textDecoration: "none" }}>
          Quick Start Guide <ArrowRight size={16} style={{ verticalAlign: "middle" }} />
        </Link>
      </div>
    </div>
  );
}
