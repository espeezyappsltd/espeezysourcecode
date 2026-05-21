"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookOpen, LifeBuoy, ArrowRight } from "lucide-react";
import "./help-tray.css";

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
    <>
      <button
        type="button"
        className="help-tray-backdrop"
        aria-label="Close help"
        onClick={() => setOpen(false)}
      />
      <aside className="help-tray-panel" aria-label="Help and onboarding">
        <header className="help-tray-header">
          <div className="help-tray-header-title">
            <span className="help-tray-header-icon" aria-hidden>
              <LifeBuoy size={20} />
            </span>
            Help & Onboarding
          </div>
          <button
            type="button"
            className="help-tray-close"
            aria-label="Close help"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </header>
        <div className="help-tray-body">
          <h3 className="help-tray-lead-title">How can we help?</h3>
          <p className="help-tray-lead">
            Explore guides for every feature, or jump to the{" "}
            <Link href="/docs/getting-started">Quick Start Guide <ArrowRight size={14} style={{ verticalAlign: "middle" }} /></Link>.
          </p>
          <div className="help-tray-list">
            {FEATURE_GUIDES.map((f) =>
              f.title === "Kanban Board" ? (
                <button
                  key={f.title}
                  type="button"
                  className="help-tray-card"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new CustomEvent("open-kanban-onboarding"));
                  }}
                >
                  <div className="help-tray-card-title">
                    <BookOpen size={16} />
                    <span>{f.title}</span>
                  </div>
                  <p className="help-tray-card-desc">{f.desc}</p>
                </button>
              ) : (
                <Link key={f.title} href={f.link} className="help-tray-card" onClick={() => setOpen(false)}>
                  <div className="help-tray-card-title">
                    <BookOpen size={16} />
                    <span>{f.title}</span>
                  </div>
                  <p className="help-tray-card-desc">{f.desc}</p>
                </Link>
              )
            )}
          </div>
        </div>
        <footer className="help-tray-footer">
          <Link href="/docs/getting-started" className="help-tray-cta" onClick={() => setOpen(false)}>
            Quick Start Guide <ArrowRight size={16} />
          </Link>
        </footer>
      </aside>
    </>
  );
}
