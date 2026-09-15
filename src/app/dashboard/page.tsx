import type { Metadata } from "next";
import DashboardApp from "@/components/dashboard-app";

export const metadata: Metadata = { title: "Workspace" };

export default function DashboardPage() {
  return <DashboardApp />;
}
