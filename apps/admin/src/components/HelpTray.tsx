"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookOpen, LifeBuoy, ArrowRight } from "lucide-react";
import {
  ADMIN_HELP_GUIDES,
  HELP_TRAY_CTA_LABEL,
  HELP_TRAY_TITLE,
} from "@shared/app-ui-copy";
import AppCopyrightStrip from "@shared/AppCopyrightStrip";

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
        aria-label="Close help panel"
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(15, 23, 42, 0.45)",
          border: "none",
          cursor: "pointer",
        }}
      />
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 9999,
          width: "min(95vw, 420px)",
          background: "var(--surface)",
          borderLeft: "2px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={HELP_TRAY_TITLE}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <LifeBuoy size={24} color="#2563eb" aria-hidden />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#2563eb" }}>{HELP_TRAY_TITLE}</span>
          </div>
          <button aria-label="Close help" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, borderRadius: 8 }} onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.5rem" }}>How can we help?</h3>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: 0, lineHeight: 1.6 }}>
              Browse documentation for each feature, or open the{" "}
              <Link href="/docs/getting-started" style={{ color: "#2563eb", fontWeight: 700 }}>
                {HELP_TRAY_CTA_LABEL} <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
              </Link>
              .
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {ADMIN_HELP_GUIDES.map((f) => (
              <Link
                key={f.title}
                href={f.link}
                style={{
                  display: "block",
                  padding: "1.1rem 1.2rem",
                  borderRadius: 14,
                  background: "rgba(59,130,246,0.07)",
                  border: "1px solid rgba(59,130,246,0.13)",
                  color: "#2563eb",
                  fontWeight: 800,
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
                onClick={() => setOpen(false)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.3rem" }}>
                  <BookOpen size={18} aria-hidden />
                  <span>{f.title}</span>
                </div>
                <div style={{ color: "#64748b", fontWeight: 500, fontSize: "0.9rem", lineHeight: 1.55 }}>{f.desc}</div>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ padding: "1.25rem", borderTop: "1px solid var(--border)", background: "rgba(59,130,246,0.04)" }}>
          <Link
            href="/docs/getting-started"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 800,
              fontSize: "0.95rem",
              borderRadius: 12,
              padding: "0.7rem 1.25rem",
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
            }}
            onClick={() => setOpen(false)}
          >
            {HELP_TRAY_CTA_LABEL} <ArrowRight size={16} aria-hidden />
          </Link>
          <AppCopyrightStrip style={{ marginTop: "1rem", color: "#64748b" }} showTagline />
        </div>
      </div>
    </>
  );
}
