"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  FlaskConical,
  Leaf,
  LockKeyhole,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useState } from "react";
import { PublicHeader } from "@/components/public-header";
import { Field, Modal, Status, Toast, useToast } from "@/components/ui";
import { BATCH_ID, TRACE_ID } from "@/lib/data";
import { AUDIT_REQUESTS_KEY, AuditRequest, readJson, tr, useLocale, useSession, useStoredData, writeJson } from "@/lib/storage";

const publicJourney = [
  ["Harvest recorded", "Harvest linked to registered hives in Dausa district."],
  ["Batch secured", "Source harvests consolidated under one protected batch identity."],
  ["Custody confirmed", "Receiving checks completed at an approved processing facility."],
  ["Quality approved", "Independent quality review completed against the batch."],
  ["Bottle identity issued", "Packaging and tamper-evident proof linked to this bottle."],
];
const noRequests: AuditRequest[] = [];

function VerifyExperience() {
  const params = useSearchParams();
  const initialTrace = params.get("trace") || "";
  const [trace, setTrace] = useState(initialTrace);
  const [checked, setChecked] = useState(initialTrace);
  const [requestOpen, setRequestOpen] = useState(false);
  const toast = useToast();
  const { locale } = useLocale();
  const session = useSession();
  const verified = checked.toUpperCase() === TRACE_ID;
  const requestContextKey = checked ? `hc:audit-context:${checked.toUpperCase()}` : "hc:audit-context:empty";
  const requestEmail = useStoredData(requestContextKey, session?.email || "consumer@honeychain.in");
  const requests = useStoredData(AUDIT_REQUESTS_KEY, noRequests);
  const currentRequest = requests.find((request) => request.traceId.toUpperCase() === checked.toUpperCase() && request.email.toLowerCase() === requestEmail.toLowerCase());
  const hasActiveRequest = currentRequest?.status === "Pending" || currentRequest?.status === "Approved";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecked(trace.trim().toUpperCase());
  }

  function sendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const existingActive = requests.some((request) => request.traceId.toUpperCase() === checked.toUpperCase() && request.email.toLowerCase() === email && (request.status === "Pending" || request.status === "Approved"));
    if (existingActive) {
      writeJson(requestContextKey, email);
      setRequestOpen(false);
      toast.show("An active request already exists for this bottle and email");
      return;
    }
    const request: AuditRequest = {
      id: `HC-REQ-${Date.now().toString().slice(-6)}`,
      name: String(form.get("name")),
      email,
      reason: String(form.get("reason")),
      consent: form.get("consent") === "on",
      traceId: checked,
      timestamp: new Date().toISOString(),
      status: "Pending",
    };
    writeJson(AUDIT_REQUESTS_KEY, [request, ...readJson<AuditRequest[]>(AUDIT_REQUESTS_KEY, [])]);
    writeJson(requestContextKey, email);
    setRequestOpen(false);
    toast.show("Audit trail request sent for administrator review");
  }

  return (
    <main className="verify-page">
      <PublicHeader />
      <section className="verify-search-band">
        <div>
          <span className="eyebrow eyebrow-light">{tr(locale, "Public verification", "सार्वजनिक सत्यापन")}</span>
          <h1>{tr(locale, "Verify a Honey Chain bottle", "हनी चेन बोतल सत्यापित करें")}</h1>
        </div>
        <form onSubmit={submit} className="verify-page-search">
          <Search size={19} />
          <label className="sr-only" htmlFor="verify-trace">Bottle trace ID</label>
          <input id="verify-trace" value={trace} onChange={(event) => setTrace(event.target.value)} placeholder={tr(locale, "Enter bottle trace ID", "बोतल ट्रेस आईडी दर्ज करें")} required />
          <button type="submit">{tr(locale, "Verify", "सत्यापित करें")}</button>
        </form>
      </section>

      {verified ? (
        <div className="verify-content">
          <section className="verified-banner">
            <div className="verified-check"><Check size={34} strokeWidth={3} /></div>
            <div><span>{tr(locale, "AUTHENTICITY RESULT", "प्रामाणिकता परिणाम")}</span><h2>{tr(locale, "Verified Honey Chain product", "सत्यापित हनी चेन उत्पाद")}</h2><p>{tr(locale, "This bottle identity is valid and its approved journey is complete.", "इस बोतल की पहचान मान्य है और इसकी स्वीकृत यात्रा पूर्ण है।")}</p></div>
            <div className="verified-id"><span>Bottle identity</span><strong>{TRACE_ID}</strong></div>
          </section>

          <section className="product-identity">
            <div className="verified-bottle-wrap">
              <div className="verified-bottle">
                <div className="bottle-cap" />
                <div className="bottle-label"><span>MADHUR FOODS</span><Leaf size={22} /><h3>Wild<br />Forest</h3><p>PURE HONEY</p><QrCode size={38} /></div>
              </div>
              <div className="bottle-glow" />
            </div>
            <div className="identity-copy">
              <span className="eyebrow">Wild neem & acacia · Rajasthan</span>
              <h2>Wild Forest Honey</h2>
              <p className="identity-lead">Slow-filtered honey from the Aravali forest belt, sourced through a registered women-led beekeeper collective.</p>
              <div className="seal-row">
                <div><Fingerprint size={24} /><strong>Blockchain Verified</strong><span>Proof anchored</span></div>
                <div><FlaskConical size={24} /><strong>Lab Tested</strong><span>Quality approved</span></div>
                <div><ShieldCheck size={24} /><strong>Traceability Complete</strong><span>5 stages linked</span></div>
              </div>
              <dl className="approved-details">
                <div><dt>Batch</dt><dd>{BATCH_ID}</dd></div>
                <div><dt>Origin</dt><dd>Dausa district, Rajasthan</dd></div>
                <div><dt>Harvest period</dt><dd>September 2026</dd></div>
                <div><dt>Packaged in</dt><dd>Jaipur district, Rajasthan</dd></div>
                <div><dt>Net quantity</dt><dd>500 g</dd></div>
                <div><dt>Best before</dt><dd>11 March 2028</dd></div>
              </dl>
            </div>
          </section>

          <div className="verification-layout">
            <section className="journey-panel">
               <div className="panel-heading"><div><span className="eyebrow">{tr(locale, "Farm to bottle", "खेत से बोतल तक")}</span><h2>{tr(locale, "A journey with evidence", "प्रमाण सहित यात्रा")}</h2></div><span className="complete-mark"><CheckCircle2 size={18} /> {tr(locale, "Complete", "पूर्ण")}</span></div>
              <div className="vertical-timeline">
                {publicJourney.map((event, index) => (
                  <article key={event[0]}>
                    <div className="timeline-marker"><span>{index + 1}</span></div>
                    <div><h3>{event[0]}</h3><p>{event[1]}</p></div>
                  </article>
                ))}
              </div>
            </section>
            <aside className="certificate-panel">
              <div className="certificate-mark"><FileCheck2 size={30} /></div>
              <span className="eyebrow">Independent laboratory</span>
              <h2>Quality certificate</h2>
              <p>Reviewed and digitally signed by Bharat Quality Labs, Jaipur.</p>
              <dl>
                <div><dt>Moisture</dt><dd>17.4%</dd></div>
                <div><dt>Pollen profile</dt><dd>Conforms</dd></div>
                <div><dt>Adulteration screen</dt><dd>Not detected</dd></div>
                <div><dt>Certificate</dt><dd>BQL-26-0910-884</dd></div>
              </dl>
              <button className="button button-outline button-block" type="button" onClick={() => toast.show("Certificate integrity and digital signature confirmed")}>Validate certificate <ExternalLink size={17} /></button>
              <p className="certificate-date">Approved 10 September 2026</p>
            </aside>
          </div>

          <section className="privacy-panel">
            <div className="privacy-icon"><LockKeyhole size={24} /></div>
            <div><h2>Transparency with protection</h2><p>Approved origin and quality information is public. Exact supplier relationships, commercial quantities, prices and detailed locations stay protected.</p></div>
            <button className="button button-dark" type="button" disabled={hasActiveRequest} onClick={() => setRequestOpen(true)}>{currentRequest?.status === "Pending" ? tr(locale, "Request under review", "अनुरोध समीक्षा में") : currentRequest?.status === "Approved" ? tr(locale, "Audit access approved", "ऑडिट प्रवेश स्वीकृत") : currentRequest?.status === "Denied" ? tr(locale, "Submit a new request", "नया अनुरोध भेजें") : tr(locale, "Request full audit trail", "पूर्ण ऑडिट विवरण माँगें")} <ChevronRight size={17} /></button>
          </section>
          {currentRequest && <section className={`request-decision request-${currentRequest.status.toLowerCase()}`} role="status" data-testid="audit-request-state"><span>{currentRequest.status === "Pending" ? <Search size={20} /> : currentRequest.status === "Approved" ? <CheckCircle2 size={20} /> : <LockKeyhole size={20} />}</span><div><strong>{currentRequest.status === "Pending" ? tr(locale, "Governance review pending", "शासन समीक्षा लंबित") : currentRequest.status === "Approved" ? tr(locale, "Audit access approved", "ऑडिट प्रवेश स्वीकृत") : tr(locale, "Request not approved", "अनुरोध स्वीकृत नहीं हुआ")}</strong><p>{currentRequest.status === "Pending" ? tr(locale, `Submitted for ${requestEmail}. This page will show the decision when review is complete.`, `${requestEmail} के लिए भेजा गया। समीक्षा पूरी होने पर निर्णय यहाँ दिखेगा।`) : currentRequest.status === "Approved" ? tr(locale, `Purpose-limited access was approved for ${requestEmail}. The decision is retained with the request record.`, `${requestEmail} के लिए उद्देश्य-सीमित प्रवेश स्वीकृत है।`) : tr(locale, "You may submit a new request with a clearer or updated reason.", "आप स्पष्ट या नया कारण देकर फिर अनुरोध भेज सकते हैं।")}</p></div><Status tone={currentRequest.status === "Approved" ? "green" : currentRequest.status === "Denied" ? "red" : "amber"}>{currentRequest.status}</Status></section>}

          <section className="verify-actions">
            <div><MapPin size={20} /><span>Verified in Bengaluru, Karnataka</span></div>
            <div><button className="text-button" type="button" onClick={() => { setTrace(""); setChecked(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Verify another bottle</button><Link className="button button-primary" href="/marketplace">Shop verified honey <ArrowRight size={18} /></Link></div>
          </section>
        </div>
      ) : checked ? (
        <section className="not-found-panel">
          <div><Search size={28} /></div><h2>We could not verify this ID</h2><p>Check each letter and number, then try again. A valid bottle ID follows the Honey Chain identifier printed beside the QR code.</p><button className="button button-outline" type="button" onClick={() => { setTrace(TRACE_ID); setChecked(TRACE_ID); }}>Use verified bottle ID</button>
        </section>
      ) : (
        <section className="lookup-empty">
          <span><QrCode size={36} /></span>
          <div><span className="eyebrow">{tr(locale, "Bottle-level provenance", "बोतल-स्तरीय उत्पत्ति")}</span><h2>{tr(locale, "Enter the ID printed beside the QR code", "क्यूआर कोड के पास छपी आईडी दर्ज करें")}</h2><p>{tr(locale, "A valid Honey Chain identity connects the approved origin, quality assurance and summarized journey for one bottle.", "एक मान्य हनी चेन आईडी एक बोतल की स्वीकृत उत्पत्ति, गुणवत्ता आश्वासन और संक्षिप्त यात्रा दिखाती है।")}</p></div>
          <button className="button button-outline" type="button" onClick={() => setTrace(TRACE_ID)}>{tr(locale, "Use verified bottle ID", "सत्यापित बोतल आईडी उपयोग करें")}</button>
        </section>
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title={tr(locale, "Request full audit trail", "पूर्ण ऑडिट विवरण माँगें")} eyebrow={tr(locale, "Restricted product information", "प्रतिबंधित उत्पाद जानकारी")}>
        <form className="form-stack" onSubmit={sendRequest}>
          <p className="modal-intro">Tell the governance team why you need access. Your request and any decision become part of the audit record.</p>
          <Field label={tr(locale, "Your name", "आपका नाम")}><input name="name" type="text" defaultValue="Kavya Nair" required data-autofocus /></Field>
          <Field label={tr(locale, "Email address", "ईमेल पता")}><input name="email" type="email" defaultValue={requestEmail} required /></Field>
          <Field label={tr(locale, "Reason for requesting access", "प्रवेश अनुरोध का कारण")} hint={tr(locale, "Include enough detail for an administrator to assess the request.", "प्रशासक की समीक्षा के लिए पर्याप्त विवरण दें।")}><textarea name="reason" rows={5} minLength={20} placeholder={tr(locale, "Describe your specific review purpose...", "अपनी समीक्षा का स्पष्ट उद्देश्य बताएँ...")} required /></Field>
          <label className="consent-check"><input name="consent" type="checkbox" required /><span>{tr(locale, "I understand that access is purpose-limited and may include usage conditions.", "मैं समझता/समझती हूँ कि प्रवेश उद्देश्य-सीमित है।")}</span></label>
          <button className="button button-primary button-block" type="submit">{tr(locale, "Submit request for review", "समीक्षा के लिए अनुरोध भेजें")}</button>
        </form>
      </Modal>
      <Toast message={toast.message} />
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={<main className="page-loading">Preparing verification…</main>}><VerifyExperience /></Suspense>;
}
