"use client";
import { useEffect, useState } from "react";
import { fetchAnalytics } from "../../../../src/services/admin";
import type { AdminStats } from "../../../../src/components/admin/types";

export function useAdminAnalytics() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchAnalytics()
      .then((data) => {
        if (!mounted) return;
        // Map the API response to AdminStats shape
        setStats({
          users: data.overview.totalUsers,
          pro: data.overview.proUsers,
          premium: data.overview.premiumUsers,
          revenue: data.overview.mrr,
          ltv: undefined,
          cac: undefined,
          nrr: undefined,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load analytics");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading, error };
}
