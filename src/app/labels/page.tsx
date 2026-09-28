import Image from "next/image";
import Link from "next/link";
import { PrintLabelButton } from "@/components/print-label-button";
import { PublicHeader } from "@/components/public-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const batchId = (await searchParams).batch?.trim().toUpperCase() ?? "";
  const batch = batchId ? await db.batch.findUnique({
    where: { id: batchId },
    include: { bottles: { orderBy: { traceId: "asc" } }, producer: true },
  }) : null;

  return <main className="labels-page">
    <div className="no-print"><PublicHeader /></div>
    <section className="labels-heading">
      <div><span className="eyebrow">Packaging handoff</span><h1>QR label sheet</h1><p>{batch ? `${batch.bottles.length} bottle identities from ${batch.id}` : "Choose a valid batch from the packaging workflow."}</p></div>
      <div className="label-actions no-print"><Link className="button button-outline" href="/dashboard">Back to workspace</Link>{batch && <PrintLabelButton />}</div>
    </section>
    {batch ? <section className="label-grid">{batch.bottles.map((bottle) => <article className="bottle-label-card" key={bottle.id}>
      <Image src={`/api/qr/${encodeURIComponent(bottle.traceId)}`} width={190} height={190} unoptimized alt={`QR code for ${bottle.traceId}`} />
      <span>HONEY CHAIN VERIFIED ID</span>
      <h2>{bottle.productName}</h2>
      <strong>{bottle.traceId}</strong>
      <p>{bottle.netWeightGrams} g · {batch.floralProfile}</p>
      <small>{batch.producer.name} · Scan for local blockchain proof</small>
    </article>)}</section> : <section className="not-found-panel"><h2>No batch selected</h2><p>Generate bottle identities from the manufacturer workflow to open a printable QR sheet.</p></section>}
  </main>;
}
