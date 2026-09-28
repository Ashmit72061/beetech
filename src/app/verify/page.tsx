"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, FileCheck2, Fingerprint, FlaskConical, Leaf, QrCode, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { PublicHeader } from "@/components/public-header";
import { TRACE_ID } from "@/lib/data";
import type { PublicTrace } from "@/lib/trace-types";

type TraceResponse = { status: "valid" | "tampered"; trace: PublicTrace } | { status: "unknown"; traceId: string };

const date = (value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) => new Intl.DateTimeFormat("en-IN", options).format(new Date(value));

function VerifyExperience() {
  const params = useSearchParams();
  const router = useRouter();
  const requestedTrace = params.get("trace")?.trim().toUpperCase() ?? "";
  const [trace, setTrace] = useState(requestedTrace);
  const [result, setResult] = useState<TraceResponse | null>(null);
  const [fetchedTrace, setFetchedTrace] = useState("");
  const [auditNotice, setAuditNotice] = useState("");
  const [protectedEvents, setProtectedEvents] = useState<Array<{ type: string; occurredAt: string; protectedData: unknown }> | null>(null);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    if (!requestedTrace) return;
    const controller = new AbortController();
    fetch(`/api/trace/${encodeURIComponent(requestedTrace)}`, { signal: controller.signal })
      .then(async (response) => ({ response, body: await response.json() as TraceResponse }))
      .then(({ response, body }) => { if (response.ok || response.status === 404) { setLookupError(""); setResult(body); setFetchedTrace(requestedTrace); } else throw new Error("Trace lookup failed"); })
      .catch((error: unknown) => { if ((error as Error).name !== "AbortError") { setResult(null); setLookupError("We could not reach the verification service. Your trace ID was not evaluated."); setFetchedTrace(requestedTrace); } });
    return () => controller.abort();
  }, [requestedTrace]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/verify?trace=${encodeURIComponent(trace.trim().toUpperCase())}`);
  }
  async function requestAudit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/audit-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ traceId: requestedTrace, name: form.get("name"), email: form.get("email"), reason: form.get("reason"), consent: form.get("consent") === "on" }) });
    const data = await response.json() as { message?: string; error?: string }; setAuditNotice(data.error || data.message || "Request submitted.");
  }
  async function checkAccess() {
    const response = await fetch(`/api/audit-requests?trace=${encodeURIComponent(requestedTrace)}`);
    const data = await response.json() as { protected: boolean; events?: Array<{ type: string; occurredAt: string; protectedData: unknown }> };
    setProtectedEvents(data.protected ? data.events || [] : null); setAuditNotice(data.protected ? "Protected audit access is active for this trace and email." : "No active protected audit access matches this trace and email.");
  }

  const loading = Boolean(requestedTrace) && requestedTrace !== fetchedTrace;
  const traceData = requestedTrace && !loading && result?.status !== "unknown" ? result?.trace : null;
  const tampered = result?.status === "tampered";

  return <main className="verify-page">
    <PublicHeader />
    <section className="verify-search-band"><div><span className="eyebrow eyebrow-light">Public verification</span><h1>Verify a Honey Chain bottle</h1></div><form onSubmit={submit} className="verify-page-search"><Search size={19} /><label className="sr-only" htmlFor="verify-trace">Bottle trace ID</label><input id="verify-trace" value={trace} onChange={(event) => setTrace(event.target.value)} placeholder="Enter bottle trace ID" required /><button type="submit">Verify</button></form></section>
    {loading ? <section className="lookup-empty" aria-live="polite"><span><Search size={36} /></span><div><span className="eyebrow">Checking the record</span><h2>Looking up this bottle</h2><p>We are retrieving its public provenance and independently recomputing the simulated hash chain.</p></div></section> : traceData ? <div className="verify-content">
      <section className={`verified-banner ${tampered ? "verified-banner-alert" : ""}`} role="status"><div className="verified-check">{tampered ? <ShieldAlert size={34} strokeWidth={3} /> : <Check size={34} strokeWidth={3} />}</div><div><span>AUTHENTICITY RESULT</span><h2>{tampered ? "Record needs review" : "Verified Honey Chain product"}</h2><p>{tampered ? "The bottle exists, but the simulated tamper-evident hash chain did not validate. Do not rely on this record until reviewed." : "This bottle identity is valid and its public journey is complete."}</p></div><div className="verified-id"><span>Bottle identity</span><strong>{traceData.traceId}</strong></div></section>
      <section className="product-identity"><div className="verified-bottle-wrap"><div className="verified-bottle"><div className="bottle-cap" /><div className="bottle-label"><span>HONEY CHAIN</span><Leaf size={22} /><h3>{traceData.bottle.productName}</h3><p>SCAN TO VERIFY</p><Image className="bottle-real-qr" src={`/api/qr/${encodeURIComponent(traceData.traceId)}`} width={62} height={62} unoptimized alt={`QR code for ${traceData.traceId}`} /></div></div><div className="bottle-glow" /></div><div className="identity-copy"><span className="eyebrow">{traceData.batch.floralProfile} · {traceData.batch.origin}</span><h2>{traceData.bottle.productName}</h2><p className="identity-lead">Publicly shareable origin, quality, and block evidence for this exact bottle, with sensitive producer and commercial data kept off-chain.</p><div className="seal-row"><div><Fingerprint size={24} /><strong>Local PoA blockchain</strong><span>{tampered ? "Needs review" : `${traceData.integrity.checkedBlocks} blocks verified`}</span></div><div><FlaskConical size={24} /><strong>Lab tested</strong><span>{traceData.certificate?.status ?? "No public certificate"}</span></div><div><ShieldCheck size={24} /><strong>Bottle journey</strong><span>{traceData.events.length} linked events</span></div></div><dl className="approved-details"><div><dt>Batch</dt><dd>{traceData.batch.id}</dd></div><div><dt>Origin</dt><dd>{traceData.batch.origin}</dd></div><div><dt>Harvested</dt><dd>{date(traceData.batch.harvestedAt)}</dd></div><div><dt>Packaged</dt><dd>{date(traceData.bottle.packagedAt)}</dd></div><div><dt>Net quantity</dt><dd>{traceData.bottle.netWeightGrams} g</dd></div><div><dt>Best before</dt><dd>{date(traceData.bottle.bestBefore)}</dd></div></dl></div></section>
      <div className="verification-layout"><section className="journey-panel"><div className="panel-heading"><div><span className="eyebrow">Farm to bottle</span><h2>Provenance and block proof</h2></div><span className="complete-mark">{tampered ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />} {tampered ? "Review required" : "Chain valid"}</span></div><div className="vertical-timeline">{traceData.events.map((event, index) => <article key={event.id}><div className="timeline-marker"><span>{index + 1}</span></div><div><span>{date(event.occurredAt, { dateStyle: "medium", timeStyle: "short" })}</span><h3>{event.type.replaceAll("_", " ")}</h3><p>{event.publicSummary}</p><small>{event.organization}</small>{event.block && <details className="block-proof"><summary>Block #{event.block.height} · {event.block.hash.slice(0, 14)}...</summary><dl><div><dt>Block hash</dt><dd>{event.block.hash}</dd></div><div><dt>Previous block</dt><dd>{event.block.previousHash ?? "GENESIS"}</dd></div><div><dt>Event commitment</dt><dd>{event.block.eventHash}</dd></div><div><dt>Validator</dt><dd>{event.block.validatorId}</dd></div><div><dt>Attestation</dt><dd>{event.block.signature}</dd></div></dl>{event.receiptHash && <a href={`/api/receipts/${event.receiptHash}`} target="_blank" rel="noreferrer">Open receipt JSON</a>}</details>}</div></article>)}</div></section>
      <aside className="certificate-panel"><div className="certificate-mark"><FileCheck2 size={30} /></div>{traceData.certificate ? <><span className="eyebrow">Independent laboratory</span><h2>Quality certificate</h2><p>Issued by {traceData.certificate.laboratory} and signed by {traceData.certificate.signer}.</p><dl><div><dt>Moisture</dt><dd>{traceData.certificate.moisturePct}%</dd></div><div><dt>Pollen profile</dt><dd>{traceData.certificate.pollenProfile}</dd></div><div><dt>Adulteration</dt><dd>{traceData.certificate.adulteration}</dd></div><div><dt>Certificate</dt><dd>{traceData.certificate.number}</dd></div></dl><a className="button button-outline button-block" href={`/api/certificates/${encodeURIComponent(traceData.certificate.number)}`} target="_blank" rel="noreferrer">View certificate data</a><p className="certificate-date">SHA-256: {traceData.certificate.sha256.slice(0, 18)}...<br />Issued {date(traceData.certificate.issuedAt)}</p></> : <><h2>No public certificate</h2><p>This bottle has no certificate attached to its batch.</p></>}</aside></div>
       <section className="privacy-panel blockchain-summary"><div className="privacy-icon"><Fingerprint size={24} /></div><div><span className="eyebrow">{traceData.integrity.network}</span><h2>Proof-of-authority block #{traceData.integrity.chainHeight}</h2><p>Every public event is committed to an append-only SHA-256 block and attested by {traceData.integrity.validatorId}. Chain head: <code>{traceData.integrity.chainHead?.slice(0, 24)}...</code>. This is a self-contained local demo network, not a public cryptocurrency chain.</p></div></section>
       <section className="panel"><span className="eyebrow">Protected audit details</span><h2>Request purpose-limited access</h2><p>Protected data is shown only to the signed-in requester after an administrator approves their request for this bottle. Approved access expires after seven days.</p><form className="form-stack" onSubmit={requestAudit}><input name="name" placeholder="Your name" required /><input name="email" type="email" placeholder="Email address" required /><textarea name="reason" rows={3} placeholder="Why do you need protected audit detail?" required /><label><input name="consent" type="checkbox" required /> I consent to this purpose-limited access request.</label><button className="button button-outline" type="submit">Submit audit request</button></form><div className="form-grid"><button className="button button-primary" type="button" onClick={checkAccess}>Check protected access</button></div>{auditNotice && <p aria-live="polite">{auditNotice}</p>}{protectedEvents && <div className="privacy-panel"><div><h3>Protected audit section</h3><p>Access granted for this requester and trace. Do not redistribute this detail.</p>{protectedEvents.map((event) => <p key={`${event.type}-${event.occurredAt}`}><strong>{event.type.replaceAll("_", " ")}</strong> · {date(event.occurredAt, { dateStyle: "medium", timeStyle: "short" })}</p>)}</div></div>}</section>
      <section className="verify-actions"><div>QR image: <a href={`/api/qr/${encodeURIComponent(traceData.traceId)}`} target="_blank" rel="noreferrer">Open PNG</a></div><div><button className="text-button" type="button" onClick={() => router.push("/verify")}>Verify another bottle</button><Link className="button button-primary" href="/marketplace">Shop verified honey</Link></div></section>
    </div> : lookupError ? <section className="not-found-panel" role="alert"><div><ShieldAlert size={28} /></div><h2>Verification is temporarily unavailable</h2><p>{lookupError}</p><button className="button button-outline" type="button" onClick={() => router.push(`/verify?trace=${TRACE_ID}`)}>Try the seeded bottle again</button></section> : requestedTrace ? <section className="not-found-panel" role="status"><div><Search size={28} /></div><h2>We could not verify this ID</h2><p>No Honey Chain bottle matches <strong>{requestedTrace}</strong>. Check the printed ID or scan the QR code again.</p><button className="button button-outline" type="button" onClick={() => router.push(`/verify?trace=${TRACE_ID}`)}>Use verified bottle ID</button></section> : <section className="lookup-empty"><span><QrCode size={36} /></span><div><span className="eyebrow">Bottle-level provenance</span><h2>Enter the ID printed beside the QR code</h2><p>Each check queries a public database record and validates its simulated tamper-evident hash chain.</p></div><button className="button button-outline" type="button" onClick={() => router.push(`/verify?trace=${TRACE_ID}`)}>Use verified bottle ID</button></section>}
  </main>;
}

export default function VerifyPage() { return <Suspense fallback={<main className="page-loading">Preparing verification...</main>}><VerifyExperience /></Suspense>; }
