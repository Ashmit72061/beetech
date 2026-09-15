import type { Metadata } from "next";
import { Marketplace } from "@/components/marketplace";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <main className="public-page">
      <PublicHeader />
      <section className="public-market-wrap">
        <Marketplace />
      </section>
    </main>
  );
}
