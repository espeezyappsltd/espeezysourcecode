"use client";
import AdminAnalyticsGrid from "../../../../src/components/admin/AdminAnalyticsGrid";
import { useAdminAnalytics } from "./useAdminAnalytics";

export default function AdminAnalyticsGridPage() {
  const { stats, loading, error } = useAdminAnalytics();

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats) return <div>No analytics data available.</div>;

  return <AdminAnalyticsGrid stats={stats} />;
}
