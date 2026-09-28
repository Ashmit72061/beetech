import type { Metadata } from "next";
import DashboardApp from "@/components/dashboard-app";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Workspace" };

export default async function DashboardPage() {
  const session = await requireSession();
  return <DashboardApp session={session} />;
}
