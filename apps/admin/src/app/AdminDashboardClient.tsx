"use client";
import dynamic from "next/dynamic";

const AdminAnalyticsGrid = dynamic(() => import("./AdminAnalyticsGrid"), { ssr: false });

export default function AdminDashboardClient() {
  return <AdminAnalyticsGrid />;
}
