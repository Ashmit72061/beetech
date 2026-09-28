"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  FlaskConical,
  Heart,
  HelpCircle,
  Hexagon,
  Home,
  Languages,
  ListChecks,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Send,
  Sparkles,
  Sprout,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Brand } from "@/components/brand";
import { signOutAction } from "@/app/login/actions";
import type { AuthenticatedSession } from "@/lib/auth";
import { BeekeeperView, ManufacturerView } from "@/components/dashboard";
import { Marketplace } from "@/components/marketplace";
import { WorkflowPanel } from "@/components/workflow-panel";
import { TelemetryPanel } from "@/components/telemetry-panel";
import { Field, Modal, Status, Toast, useToast } from "@/components/ui";
import { BATCH_ID, listings, money, navByRole, roleMeta, Role, TRACE_ID, traceTimeline, type Listing } from "@/lib/data";
import {
  accountKey,
  ActivityRecord,
  AUDIT_REQUESTS_KEY,
  AuditRequest,
  CUSTOM_LISTINGS_KEY,
  LabRecord,
  MarketplaceOrder,
  readJson,
  Session,
  tr,
  useLocale,
  useStoredData,
  writeJson,
} from "@/lib/storage";

const navIcons: Record<string, React.ElementType> = {
  Overview: Home,
  "Apiaries & Hives": Hexagon,
  "Harvests & Batches": Sprout,
  Marketplace: ShoppingBag,
  "Smart Insights": Sparkles,
  Traceability: Database,
  "Sync Queue": RefreshCw,
  Procure: ShoppingBag,
  Inputs: Boxes,
  Processing: Activity,
  "Lab Tests": FlaskConical,
  Packaging: Package,
  "Work queue": ListChecks,
  Specimens: FlaskConical,
  "Test results": FileText,
  Certificates: FileCheck2,
  "Approved batches": CheckCircle2,
  "My orders": PackageCheck,
  "Saved products": Heart,
  "Verify bottle": QrCode,
  "Command centre": Activity,
  Organisations: Building2,
  "Users & roles": Users,
  "Access requests": ClipboardCheck,
  Anomalies: ShieldAlert,
  "Audit ledger": Database,
  "Blockchain proof": ShieldCheck,
};

const hindiNav: Record<string, string> = {
  Overview: "अवलोकन",
  "Apiaries & Hives": "मधुवाटिका और छत्ते",
  "Harvests & Batches": "कटाई और बैच",
  Marketplace: "बाज़ार",
  "Smart Insights": "स्मार्ट जानकारी",
  Traceability: "खोज-योग्यता",
  "Sync Queue": "सिंक कतार",
  Procure: "खरीद",
  Inputs: "इनपुट बैच",
  Processing: "प्रसंस्करण",
  "Lab Tests": "लैब परीक्षण",
  Packaging: "पैकेजिंग",
  "Work queue": "कार्य कतार",
  Specimens: "परीक्षण सामग्री",
  "Test results": "परीक्षण परिणाम",
  Certificates: "प्रमाणपत्र",
  "Approved batches": "स्वीकृत बैच",
  "My orders": "मेरे ऑर्डर",
  "Saved products": "सहेजे उत्पाद",
  "Verify bottle": "बोतल सत्यापित करें",
  "Command centre": "नियंत्रण केंद्र",
  Organisations: "संगठन",
  "Users & roles": "उपयोगकर्ता और भूमिकाएँ",
  "Access requests": "प्रवेश अनुरोध",
  Anomalies: "विसंगतियाँ",
  "Audit ledger": "ऑडिट बही",
  "Blockchain proof": "ब्लॉकचेन प्रमाण",
};
const hindiRoles: Record<Role, string> = { beekeeper: "मधुमक्खी पालक", manufacturer: "निर्माता", lab: "प्रयोगशाला", consumer: "उपभोक्ता", admin: "प्रशासक" };

const labSeed: LabRecord[] = [
  {
    id: "BQL-REQ-884", batchId: BATCH_ID, client: "Madhur Foods", product: "Wild forest raw honey", priority: "High", due: "Demo priority 1", specimenId: "BQL-SP-884-A", received: "09 Sep · 10:24", seal: "Confirmed", requester: "Rohan Mehta", pollen: "Conforms", moisture: "17.4", adulteration: "Not detected", notes: "Pollen spectrum is consistent with declared wild neem and acacia forage.", certificateName: "", certificateSize: 0, status: "Pending review",
  },
  {
    id: "BQL-REQ-881", batchId: "HC-BK228-B260902-01", client: "Pahadi Ras Foods", product: "Litchi blossom raw honey", priority: "Normal", due: "Demo priority 2", specimenId: "BQL-SP-881-A", received: "08 Sep · 14:12", seal: "Confirmed", requester: "Anil Rawat", pollen: "Conforms", moisture: "18.1", adulteration: "Not detected", notes: "", certificateName: "", certificateSize: 0, status: "Pending review",
  },
  {
    id: "BQL-REQ-878", batchId: "HC-BK311-B260828-02", client: "Sundar Naturals", product: "Eucalyptus raw honey", priority: "Normal", due: "Demo priority 3", specimenId: "BQL-SP-878-A", received: "08 Sep · 09:40", seal: "Confirmed", requester: "Meera Shah", pollen: "Inconclusive", moisture: "19.2", adulteration: "Inconclusive", notes: "Repeat pollen review required.", certificateName: "", certificateSize: 0, status: "Pending review",
  },
];

type RoleApproval = { id: string; organisation: string; detail: string; location: string; status: "Pending" | "Approved" | "Denied"; decidedAt?: string };
const approvalSeed: RoleApproval[] = [
  { id: "HC-APR-2041", organisation: "Giriraj Pahadi Beekeepers Society", detail: "Organisation registration", location: "Alwar, Rajasthan", status: "Pending" },
  { id: "HC-APR-2038", organisation: "Bharat Quality Labs", detail: "Certificate reviewer role · Priya Sharma", location: "Jaipur, Rajasthan", status: "Pending" },
];

type AnomalyCase = { id: string; title: string; organisation: string; priority: string; status: "Open review" | "Investigating" | "Resolved"; object: string; summary: string; response: string; resolution?: string; decidedAt?: string };
const anomalySeed: AnomalyCase[] = [
  { id: "HC-ANM-0472", title: "Packaged quantity variance", organisation: "Madhuban Foods", priority: "High", status: "Open review", object: "HC-MB443-P260910-04", summary: "Recorded packaged output is 330 kg above the plausible input range.", response: "Additional source transfer document submitted 14 Sep." },
  { id: "HC-ANM-0468", title: "Repeated QR scan pattern", organisation: "Nectar Valley Foods", priority: "Medium", status: "Investigating", object: "HC-NV204-P260904-02", summary: "One bottle identity was checked in three distant districts within four hours.", response: "Distributor route and retail inventory requested." },
];

const accessSeed: AuditRequest[] = [
  { id: "HC-REQ-26194", name: "Kavya Nair", email: "consumer@honeychain.in", reason: "Reviewing purchase provenance for a resident welfare association sourcing report.", consent: true, traceId: TRACE_ID, timestamp: "2026-09-15T09:26:00.000Z", status: "Pending" },
];
const noActivities: ActivityRecord[] = [];
const noOrders: MarketplaceOrder[] = [];
const noIds: string[] = [];
const noListings: Listing[] = [];

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 820px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getMobile() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function Table({ headers, rows, label }: { headers: string[]; rows: string[][]; label: string }) {
  return (
    <div className="responsive-table" role="region" aria-label={label} tabIndex={0}>
      <span className="scroll-cue">Scroll horizontally to review all columns</span>
      <table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cellIndex === row.length - 1 ? <Status tone={/Rejected|Denied/.test(cell) ? "red" : /Pending|Waiting|review|Investigating/.test(cell) ? "amber" : "green"}>{cell}</Status> : cell}</td>)}</tr>)}</tbody></table>
    </div>
  );
}

function Intro({ eyebrow, title, copy, actions }: { eyebrow: string; title: string; copy: string; actions?: React.ReactNode }) {
  return <div className="dash-page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

function ActivityLedger({ records }: { records: ActivityRecord[] }) {
  if (!records.length) return null;
  return (
    <section className="panel persisted-activity" data-testid="persisted-activity">
      <div className="panel-heading"><div><span className="eyebrow">Account activity</span><h2>Recently recorded</h2></div><Status>{records.length} saved</Status></div>
      <div className="event-list">{records.slice(0, 5).map((record) => <div key={record.id}><span className="event-dot" /><div><strong>{record.action}</strong><span>{record.detail}</span></div><time>{new Date(record.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></div>)}</div>
    </section>
  );
}

function LaboratoryWorkspace({ tab, session, toast }: { tab: string; session: Session; toast: (message: string) => void }) {
  const key = accountKey(session, "lab-records", "lab");
  const records = useStoredData(key, labSeed);
  const [selectedId, setSelectedId] = useState(records[0].id);
  const selected = records.find((record) => record.id === selectedId) || records[0];

  function update(changes: Partial<LabRecord>) {
    writeJson(key, records.map((record) => record.id === selected.id ? { ...record, ...changes } : record));
  }

  if (tab !== "Work queue") {
    const map: Record<string, [string, string, string[], string[][]]> = {
      Specimens: ["Registered specimens", "Chain-of-custody records assigned to your laboratory.", ["Specimen", "Batch", "Received", "Seal", "State"], records.map((r) => [r.specimenId, r.batchId, r.received, r.seal, r.status])],
      "Test results": ["Test results", "Structured analytical results and accountable decisions.", ["Request", "Batch", "Moisture", "Adulteration", "Decision"], records.map((r) => [r.id, r.batchId, `${r.moisture}%`, r.adulteration, r.status])],
      Certificates: ["Certificates", "Digitally signed quality evidence attached to each reviewed batch.", ["Request", "Batch", "Certificate", "Client", "State"], records.map((r) => [r.id, r.batchId, r.certificateName || "Not attached", r.client, r.certificateName ? "Attached" : "Pending"])],
      "Approved batches": ["Approved batches", "Batches approved after complete analytical review.", ["Batch", "Client", "Approved", "Certificate", "State"], records.filter((r) => r.status === "Approved").map((r) => [r.batchId, r.client, r.decidedAt ? new Date(r.decidedAt).toLocaleDateString("en-IN") : "", r.certificateName, r.status])],
    };
    const content = map[tab];
    return <><Intro eyebrow="Bharat Quality Labs" title={content[0]} copy={content[1]} /><section className="panel table-panel"><Table headers={content[2]} rows={content[3]} label={content[0]} /></section></>;
  }

  function decide(status: "Approved" | "Rejected") {
    if (status === "Approved" && !selected.certificateName) {
      toast("Attach a signed certificate before approval");
      return;
    }
    update({ status, decidedAt: new Date().toISOString() });
    toast(`Batch ${status.toLowerCase()} and decision saved`);
  }

  return (
    <>
      <Intro eyebrow="Bharat Quality Labs · Jaipur" title="Quality review queue" copy="Review assigned material, attach evidence and make an accountable batch decision." />
      <p className="mobile-scroll-cue">Swipe the queue to select another request.</p>
      <div className="lab-layout">
        <aside className="panel queue-panel" aria-label="Assigned laboratory requests">
          <div className="panel-heading"><div><span className="eyebrow">Assigned to you</span><h2>{records.filter((r) => r.status === "Pending review").length} pending requests</h2></div></div>
          {records.map((record) => <button type="button" aria-pressed={selected.id === record.id} className={selected.id === record.id ? "selected" : ""} key={record.id} onClick={() => setSelectedId(record.id)}><div><strong>{record.batchId}</strong><span>{record.client}</span></div><Status tone={record.status === "Approved" ? "green" : record.status === "Rejected" ? "red" : record.priority === "High" ? "amber" : "grey"}>{record.status === "Pending review" ? record.priority : record.status}</Status><small>Due {record.due}</small></button>)}
        </aside>
        <section className="panel lab-detail" key={selected.id}>
          <div className="lab-detail-head"><div><span className="eyebrow">Request {selected.id}</span><h2>{selected.batchId}</h2><p>{selected.product} · Submitted by {selected.client}</p></div><Status tone={selected.status === "Approved" ? "green" : selected.status === "Rejected" ? "red" : "amber"}>{selected.status}</Status></div>
          <div className="sample-facts"><div><span>Specimen</span><strong>{selected.specimenId}</strong></div><div><span>Seal integrity</span><strong>{selected.seal}</strong></div><div><span>Received</span><strong>{selected.received}</strong></div><div><span>Requested by</span><strong>{selected.requester}</strong></div></div>
          <form className="lab-form" onSubmit={(event) => event.preventDefault()}><h3>Analytical results</h3><div className="form-grid three"><Field label="Pollen profile"><select value={selected.pollen} onChange={(event) => update({ pollen: event.target.value })}><option>Conforms</option><option>Does not conform</option><option>Inconclusive</option></select></Field><Field label="Moisture (%)"><input type="number" step="0.1" value={selected.moisture} onChange={(event) => update({ moisture: event.target.value })} /></Field><Field label="Adulteration screen"><select value={selected.adulteration} onChange={(event) => update({ adulteration: event.target.value })}><option>Not detected</option><option>Detected</option><option>Inconclusive</option></select></Field></div><Field label="Reviewer notes"><textarea rows={5} value={selected.notes} onChange={(event) => update({ notes: event.target.value })} /></Field>
            <label className={`upload-area ${selected.certificateName ? "uploaded" : ""}`}><FileCheck2 size={27} /><span><strong>{selected.certificateName || "Attach signed laboratory certificate"}</strong><small>{selected.certificateName ? `${Math.ceil(selected.certificateSize / 1024)} KB · Stored on this device` : "PDF up to 10 MB · Choose a certificate"}</small></span>{selected.certificateName && <CheckCircle2 size={22} />}<input type="file" accept="application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) { update({ certificateName: file.name, certificateSize: file.size }); toast(`${file.name} attached to ${selected.id}`); } }} /></label>
            <div className="decision-bar"><button className="button button-danger" type="button" onClick={() => decide("Rejected")}><X size={17} /> Reject batch</button><button className="button button-primary" type="button" onClick={() => decide("Approved")} disabled={!selected.certificateName}><Check size={17} /> Approve and certify</button></div>
          </form>
        </section>
      </div>
    </>
  );
}

function ConsumerWorkspace({ tab, session }: { tab: string; session: Session }) {
  const orders = useStoredData(accountKey(session, "orders"), noOrders);
  const saved = useStoredData(accountKey(session, "saved-listings"), noIds);
  const custom = useStoredData(CUSTOM_LISTINGS_KEY, noListings);
  const allListings = [...listings, ...custom];
  if (tab === "Marketplace") return <><Intro eyebrow="Verified products" title="Marketplace" copy="Discover honey and registered assets with provenance you can inspect." /><Marketplace compact /></>;
  if (tab === "My orders") return <><Intro eyebrow="Purchase history" title="My orders" copy="Every order retains its category-aware audit event." /><section className="panel table-panel"><Table label="My orders" headers={["Order", "Product", "Category", "Quantity", "Total", "Audit event"]} rows={orders.map((order) => [order.id, order.item, order.category, String(order.quantity), money(order.total), order.auditEvent])} /></section></>;
  if (tab === "Saved products") {
    const products = allListings.filter((listing) => saved.includes(listing.id));
    return <><Intro eyebrow="Your shortlist" title="Saved products" copy="Products saved under your signed-in account." />{products.length ? <div className="saved-grid">{products.map((listing) => <article className="panel saved-item" key={listing.id}><span className="saved-art"><Heart /></span><div><Status>{listing.status}</Status><h2>{listing.name}</h2><p>{listing.seller} · {listing.location}</p><strong>{money(listing.price)} · {listing.unit}</strong></div><Link className="button button-dark" href="/marketplace">View listing</Link></article>)}</div> : <section className="panel empty-state"><Heart size={28} /><h2>No saved products yet</h2><p>Use the heart control on a marketplace listing to build your shortlist.</p><Link className="button button-primary" href="/marketplace">Browse marketplace</Link></section>}</>;
  }
  return <><Intro eyebrow="Public authenticity check" title="Verify a bottle" copy="Enter the identity printed beside a Honey Chain QR code." /><section className="panel inline-verify"><QrCode size={72} /><div><h2>Check bottle provenance</h2><p>View approved origin, laboratory assurance and the protected public journey.</p><div className="id-preview">{TRACE_ID}</div><Link className="button button-primary" href={`/verify?trace=${TRACE_ID}`}>Open verification <ArrowRight size={17} /></Link></div></section></>;
}

function AdministratorWorkspace({ tab, toast }: { tab: string; toast: (message: string) => void }) {
  const approvals = useStoredData("hc:admin:role-approvals", approvalSeed);
  const requests = useStoredData(AUDIT_REQUESTS_KEY, accessSeed);
  const anomalies = useStoredData("hc:admin:anomalies", anomalySeed);
  const [selectedApproval, setSelectedApproval] = useState(approvals[0].id);
  const [selectedRequest, setSelectedRequest] = useState(requests[0]?.id || "");
  const [selectedAnomaly, setSelectedAnomaly] = useState(anomalies[0].id);
  const [resolution, setResolution] = useState("");

  function decideApproval(id: string, status: "Approved" | "Denied") {
    writeJson("hc:admin:role-approvals", approvals.map((item) => item.id === id ? { ...item, status, decidedAt: new Date().toISOString() } : item));
    toast(`Role approval ${status.toLowerCase()} and saved`);
  }
  function decideRequest(id: string, status: "Approved" | "Denied") {
    writeJson(AUDIT_REQUESTS_KEY, requests.map((item) => item.id === id ? { ...item, status, decidedAt: new Date().toISOString(), decidedBy: "Vikram Singh" } : item));
    toast(`Access request ${status.toLowerCase()} and requester status updated`);
  }
  function resolveCase() {
    if (resolution.trim().length < 8) { toast("Add a concise reason or evidence note before resolving"); return; }
    writeJson("hc:admin:anomalies", anomalies.map((item) => item.id === selectedAnomaly ? { ...item, status: "Resolved", resolution: resolution.trim(), decidedAt: new Date().toISOString() } : item));
    toast("Anomaly resolution and evidence note saved");
  }

  if (tab === "Command centre") return <><Intro eyebrow="Honey Chain Governance Cell" title="Command centre" copy="Network health, accountable approvals and evidence-led exception handling." /><div className="metrics-grid four"><article className="metric-card"><Building2 /><span>Active organisations</span><strong>42</strong><small>{approvals.filter((a) => a.status === "Pending").length} awaiting review</small></article><article className="metric-card"><Users /><span>Verified participants</span><strong>186</strong><small>12 role updates this month</small></article><article className="metric-card"><ClipboardCheck /><span>Access requests</span><strong>{requests.length}</strong><small>{requests.filter((r) => r.status === "Pending").length} awaiting decision</small></article><article className="metric-card"><AlertTriangle /><span>Open anomalies</span><strong>{anomalies.filter((a) => a.status !== "Resolved").length}</strong><small>Evidence review required</small></article></div><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Governance queue</span><h2>Role approvals</h2></div></div><div className="approval-list">{approvals.map((item) => <article key={item.id}><span className="org-mark">{item.organisation.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{item.organisation}</strong><p>{item.detail} · {item.location}</p><small>{item.id}</small></div><Status tone={item.status === "Approved" ? "green" : item.status === "Denied" ? "red" : "amber"}>{item.status}</Status><div><button type="button" onClick={() => decideApproval(item.id, "Denied")}>Deny</button><button type="button" onClick={() => decideApproval(item.id, "Approved")}>Approve</button></div></article>)}</div></section></>;

  if (tab === "Access requests") {
    const selected = requests.find((item) => item.id === selectedRequest) || requests[0];
    return <><Intro eyebrow="Consumer transparency" title="Access requests" copy="Grant purpose-limited access only when the stated need justifies protected detail." />{selected ? <div className="admin-case-layout"><section className="panel case-list" aria-label="Audit access requests">{requests.map((item) => <button type="button" aria-pressed={selected.id === item.id} className={selected.id === item.id ? "selected" : ""} onClick={() => setSelectedRequest(item.id)} key={item.id}><div><strong>{item.id}</strong><span>{item.name} · {item.email}</span><small>{new Date(item.timestamp).toLocaleString("en-IN")}</small></div><Status tone={item.status === "Approved" ? "green" : item.status === "Denied" ? "red" : "amber"}>{item.status}</Status></button>)}</section><section className="panel case-detail"><span className="eyebrow">Selected request</span><h2>Full audit trail access</h2><p className="case-id">{selected.traceId}</p><dl className="detail-list"><div><dt>Requester</dt><dd>{selected.name} · {selected.email}</dd></div><div><dt>Submitted</dt><dd>{new Date(selected.timestamp).toLocaleString("en-IN")}</dd></div><div><dt>Purpose</dt><dd>{selected.reason}</dd></div><div><dt>Consent</dt><dd>{selected.consent ? "Confirmed" : "Not confirmed"}</dd></div></dl><div className="decision-bar"><button className="button button-danger" onClick={() => decideRequest(selected.id, "Denied")}>Deny request</button><button className="button button-primary" onClick={() => decideRequest(selected.id, "Approved")}>Approve for 7 days</button></div></section></div> : <section className="panel empty-state"><ClipboardCheck /><h2>No access requests</h2></section>}</>;
  }

  if (tab === "Anomalies") {
    const selected = anomalies.find((item) => item.id === selectedAnomaly) || anomalies[0];
    return <><Intro eyebrow="Evidence-led review" title="Traceability anomalies" copy="Plausibility flags support human review; they do not prove fraud or adulteration." /><div className="admin-case-layout"><section className="panel case-list" aria-label="Anomaly cases">{anomalies.map((item) => <button type="button" aria-pressed={selected.id === item.id} className={selected.id === item.id ? "selected" : ""} onClick={() => { setSelectedAnomaly(item.id); setResolution(item.resolution || ""); }} key={item.id}><div><strong>{item.id}</strong><span>{item.title}</span><small>{item.organisation} · {item.priority}</small></div><Status tone={item.status === "Resolved" ? "green" : item.priority === "High" ? "red" : "amber"}>{item.status}</Status></button>)}</section><section className="panel case-detail"><span className="eyebrow">Selected anomaly</span><h2>{selected.title}</h2><p className="case-id">{selected.object}</p><dl className="detail-list"><div><dt>Finding</dt><dd>{selected.summary}</dd></div><div><dt>Organisation response</dt><dd>{selected.response}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div>{selected.resolution && <div><dt>Resolution evidence</dt><dd>{selected.resolution}</dd></div>}</dl><Field label="Resolution reason / evidence note" hint="Required to resolve this case."><textarea rows={4} value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Summarize the evidence reviewed and decision rationale." /></Field><div className="decision-bar"><button className="button button-outline" onClick={() => toast("Additional evidence request recorded")}>Request evidence</button><button className="button button-primary" onClick={resolveCase}>Resolve case</button></div></section></div></>;
  }

  if (tab === "Users & roles") {
    const selected = approvals.find((item) => item.id === selectedApproval) || approvals[0];
    return <><Intro eyebrow="Identity governance" title="Users & roles" copy="Select each request and make a durable role decision." /><div className="admin-case-layout"><section className="panel case-list">{approvals.map((item) => <button type="button" className={selected.id === item.id ? "selected" : ""} aria-pressed={selected.id === item.id} key={item.id} onClick={() => setSelectedApproval(item.id)}><div><strong>{item.id}</strong><span>{item.organisation}</span><small>{item.detail}</small></div><Status tone={item.status === "Approved" ? "green" : item.status === "Denied" ? "red" : "amber"}>{item.status}</Status></button>)}</section><section className="panel case-detail"><span className="eyebrow">Selected role request</span><h2>{selected.organisation}</h2><p>{selected.detail}</p><dl className="detail-list"><div><dt>Request</dt><dd>{selected.id}</dd></div><div><dt>Location</dt><dd>{selected.location}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl><div className="decision-bar"><button className="button button-danger" onClick={() => decideApproval(selected.id, "Denied")}>Deny</button><button className="button button-primary" onClick={() => decideApproval(selected.id, "Approved")}>Approve</button></div></section></div></>;
  }

  const generic: Record<string, [string, string, string[], string[][]]> = {
    Organisations: ["Organisations", "Verified entities and operating roles across the network.", ["Organisation", "Type", "Location", "Participants", "State"], [["Aravali Madhu Sakhi FPO", "Producer collective", "Dausa, Rajasthan", "24", "Active"], ["Madhur Foods", "Manufacturer", "Jaipur, Rajasthan", "12", "Active"], ["Bharat Quality Labs", "Laboratory", "Jaipur, Rajasthan", "8", "Active"]]],
    "Audit ledger": ["Audit ledger", "Append-only material events with actor, time, source and proof state.", ["Timestamp", "Event", "Object", "Actor", "Proof"], traceTimeline.map((event) => [event.date, event.title, BATCH_ID, event.actor, "Anchored"])],
    "Blockchain proof": ["Local PoA blockchain", "Persisted append-only blocks commit receipt and event hashes while sensitive data remains off-chain.", ["Network", "Consensus", "Validator", "Committed data", "State"], [["Honey Chain Local", "Proof of authority", "HC-POA-VALIDATOR-01", "Event + receipt hash", "Verified"], ["Privacy boundary", "Off-chain records", "Application roles", "No personal data", "Active"]]],
  };
  const content = generic[tab];
  return <><Intro eyebrow="Network governance" title={content[0]} copy={content[1]} /><section className="panel table-panel"><Table label={content[0]} headers={content[2]} rows={content[3]} /></section></>;
}

function ActionDialog({ action, locale, onClose, onRecord }: { action: string; locale: "en" | "hi"; onClose: () => void; onRecord: (action: string, form: FormData) => void }) {
  const isVoice = action === "Voice entry";
  const isSync = action === "Sync now";
  const isPublication = ["List batch", "List hive/colony", "Publish packaged honey"].includes(action);
  const isPackage = action === "Package bottles";
  const isLab = action === "Request lab test";
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); onRecord(action, new FormData(event.currentTarget)); onClose(); }
  const hindiActions: Record<string, string> = { "Record harvest": "कटाई दर्ज करें", "Add hive": "छत्ता जोड़ें", "List batch": "बैच सूचीबद्ध करें", "List hive/colony": "छत्ता सूचीबद्ध करें", "Receive transfer": "हस्तांतरण प्राप्त करें", "Start processing": "प्रसंस्करण शुरू करें", "Request lab test": "लैब परीक्षण माँगें", "Package bottles": "बोतल पैक करें", "Publish packaged honey": "पैक शहद प्रकाशित करें", "Procure batch": "बैच खरीदें", "Voice entry": "आवाज़ प्रविष्टि", "Sync now": "अभी सिंक करें" };
  return <Modal open={Boolean(action)} onClose={onClose} title={locale === "hi" ? hindiActions[action] || action : action} eyebrow={tr(locale, "Accountable operation", "जवाबदेह कार्य")}><form className="form-stack" onSubmit={submit}>{isVoice ? <div className="voice-panel"><button type="button" className="voice-record"><Mic size={30} /></button><h3>{tr(locale, "Record a field note", "मैदानी टिप्पणी रिकॉर्ड करें")}</h3><p>{tr(locale, "Review the transcript before saving it to the account record.", "खाता रिकॉर्ड में सहेजने से पहले प्रतिलेख की समीक्षा करें।")}</p><Field label={tr(locale, "Reviewed note", "समीक्षित टिप्पणी")}><textarea name="notes" rows={4} defaultValue="Hive 12 ventilation checked; colony activity is stable." /></Field></div> : isSync ? <div className="sync-panel"><RefreshCw size={36} /><h3>{tr(locale, "Records ready to sync", "रिकॉर्ड सिंक के लिए तैयार")}</h3><p>{tr(locale, "Securely upload records in creation order.", "रिकॉर्ड को निर्माण क्रम में सुरक्षित रूप से अपलोड करें।")}</p></div> : <>{isPublication && <Field label={tr(locale, "Listing title", "लिस्टिंग शीर्षक")}><input name="title" defaultValue={action === "List batch" ? "September wild forest raw honey" : action === "List hive/colony" ? "Apis cerana colony · Hive 49" : "Wild Forest Honey · 500 g"} required data-autofocus /></Field>}<div className="form-grid"><Field label={tr(locale, isPackage ? "Packaged product" : action.includes("hive") ? "Hive identity" : "Batch / material identity", isPackage ? "पैक उत्पाद" : action.includes("hive") ? "छत्ता पहचान" : "बैच / सामग्री पहचान")}><input name="identity" defaultValue={isPackage ? "Wild Forest Honey · 500 g" : action.includes("hive") ? "HC-HIVE-BK102-49" : BATCH_ID} required={!isPublication} /></Field><Field label={tr(locale, isPackage ? "Bottle count" : isPublication ? "Price (INR)" : "Quantity (kg)", isPackage ? "बोतल संख्या" : isPublication ? "मूल्य (INR)" : "मात्रा (किग्रा)")}><input name="quantity" type="number" defaultValue={isPackage ? "420" : isPublication ? action === "List hive/colony" ? "6800" : action === "List batch" ? "385" : "449" : "286"} min="1" required /></Field></div>{isLab && <Field label={tr(locale, "Laboratory", "प्रयोगशाला")}><select name="laboratory" defaultValue="Bharat Quality Labs"><option>Bharat Quality Labs</option><option>National Quality Analytics</option><option>Rajasthan Food Integrity Centre</option></select></Field>}<Field label={tr(locale, "Responsible location", "जिम्मेदार स्थान")}><input name="location" defaultValue={action.includes("processing") || isPackage || action === "Publish packaged honey" ? "Madhur Foods · Jaipur Unit" : "Rajgarh North · Rajasthan"} required /></Field><Field label={tr(locale, "Notes", "टिप्पणियाँ")}><textarea name="notes" rows={4} placeholder={tr(locale, "Add handling, condition or decision notes", "हैंडलिंग, स्थिति या निर्णय टिप्पणी जोड़ें")} /></Field></>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>{tr(locale, "Cancel", "रद्द करें")}</button><button type="submit" className="button button-primary">{tr(locale, "Confirm and save", "पुष्टि कर सहेजें")}</button></div></form></Modal>;
}

export default function DashboardApp({ session }: { session: AuthenticatedSession }) {
  const { locale, setLocale } = useLocale();
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, () => false);
  const [tab, setTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [action, setAction] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const toast = useToast();
  const activeSession: Session = { ...session, accountRole: session.role, activeRole: session.role };
  const activitiesKey = accountKey(activeSession, "activities");
  const activities = useStoredData(activitiesKey, noActivities);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

  const role = activeSession.activeRole;
  const meta = roleMeta[role];
  const navigation = navByRole[role];
  const activeTab = navigation.includes(tab) ? tab : navigation[0];

  function openSidebar() {
    setSidebarOpen(true);
    window.requestAnimationFrame(() => sidebar.current?.querySelector<HTMLElement>("button")?.focus());
  }
  function closeSidebar() {
    setSidebarOpen(false);
    window.requestAnimationFrame(() => menuButton.current?.focus());
  }
  function logout() {
    void signOutAction();
  }
  function showAction(name: string) {
    if (["Review recommendation", "Review inventory proof", "Nectar flow opportunity", "Humidity watch", "Yield confidence"].includes(name)) toast.show("Evidence review opened");
    else setAction(name);
  }
  function recordAction(name: string, form: FormData) {
    const identity = String(form.get("identity") || BATCH_ID);
    const quantity = String(form.get("quantity") || "");
    const laboratory = String(form.get("laboratory") || "");
    const labels: Record<string, string> = {
      "Record harvest": "Harvest recorded", "Add hive": "Hive registered", "List batch": "Raw batch listing published", "List hive/colony": "Hive ownership listing published", "Receive transfer": "Custody transfer received", "Start processing": "Processing run started", "Request lab test": "Laboratory request submitted", "Package bottles": "Bottle identities generated", "Publish packaged honey": "Packaged honey listing published", "Procure batch": "Procurement request recorded", "Voice entry": "Field voice note saved", "Sync now": "Offline records synchronized",
    };
    const detail = laboratory ? `${identity} · ${laboratory}` : quantity ? `${identity} · ${quantity} ${isPublicationAction(name) ? "INR" : name === "Package bottles" ? "bottles" : "kg"}` : String(form.get("notes") || "Account record updated");
    const record: ActivityRecord = { id: `HC-EVT-${Date.now()}`, action: labels[name] || name, detail, actor: activeSession.person, role, timestamp: new Date().toISOString() };
    writeJson(activitiesKey, [record, ...activities]);

    if (isPublicationAction(name)) {
      const category: Listing["category"] = name === "List hive/colony" ? "Hive/Colony Asset" : name === "List batch" ? "Raw Honey Batch" : "Packaged Honey";
      const code = Date.now().toString().slice(-4);
      const listing: Listing = { id: category === "Hive/Colony Asset" ? `HC-ASSET-RJ-BK102-H${code}` : category === "Raw Honey Batch" ? `HC-BK102-B260915-${code}` : `HC-MF221-P260915-${code}`, category, name: String(form.get("title")), seller: roleMeta[role].org, location: String(form.get("location")), price: Number(quantity), unit: category === "Hive/Colony Asset" ? "per colony" : category === "Raw Honey Batch" ? "per kg" : "500 g jar", available: category === "Hive/Colony Asset" ? "1 registered colony" : category === "Raw Honey Batch" ? "120 kg available" : "240 jars available", floral: "Wild neem & acacia", rating: 4.8, description: String(form.get("notes") || "Published with a complete Honey Chain identity and accountable source record."), traceLabel: category === "Hive/Colony Asset" ? "Asset ownership history" : category === "Raw Honey Batch" ? "Material lineage" : "Bottle-to-source lineage", status: category === "Hive/Colony Asset" ? "Health checked" : category === "Raw Honey Batch" ? "Batch approved" : "Traceability complete", accent: category === "Hive/Colony Asset" ? "#d89a24" : category === "Raw Honey Batch" ? "#b97321" : "#e3ad38" };
      const custom = readJson<Listing[]>(CUSTOM_LISTINGS_KEY, []);
      writeJson(CUSTOM_LISTINGS_KEY, [listing, ...custom]);
    }
    toast.show(`${labels[name] || name} and saved to this account`);
  }

  return (
    <main className="dashboard-shell">
      <aside id="workspace-navigation" ref={sidebar} className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`} inert={isMobile && !sidebarOpen ? true : undefined} aria-hidden={isMobile && !sidebarOpen ? true : undefined}>
        <div className="sidebar-brand"><Brand /><button className="icon-button sidebar-close" onClick={closeSidebar} aria-label="Close navigation"><X size={20} /></button></div>
        <div className="workspace-label"><span>{tr(locale, "Workspace", "कार्यस्थान")}</span><strong>{meta.org}</strong><em>{tr(locale, "Active role", "सक्रिय भूमिका")}: {locale === "hi" ? hindiRoles[role] : meta.label}</em></div>
        <nav className="dashboard-nav" aria-label="Workspace navigation">{navigation.map((item) => { const Icon = navIcons[item] || Home; const active = activeTab === item; return <button type="button" key={item} aria-current={active ? "page" : undefined} className={active ? "active" : ""} onClick={() => { setTab(item); if (isMobile) closeSidebar(); }}><Icon size={19} /><span>{locale === "hi" ? hindiNav[item] || item : item}</span>{item === "Sync Queue" && <em>2</em>}{item === "Work queue" && <em>{labSeed.length}</em>}{item === "Access requests" && <em>{readJson<AuditRequest[]>(AUDIT_REQUESTS_KEY, accessSeed).filter((request) => request.status === "Pending").length}</em>}</button>; })}</nav>
        <button className="sidebar-support" type="button" onClick={() => setSupportOpen(true)} aria-haspopup="dialog" aria-expanded={supportOpen}><HelpCircle size={18} /><div><strong>{tr(locale, "Need support?", "सहायता चाहिए?")}</strong><span>{tr(locale, "Field assistance available", "मैदानी सहायता उपलब्ध")}</span></div></button>
        <div className="sidebar-profile"><span className={`role-avatar role-${role}`}>{meta.initials}</span><div><strong>{session.person}</strong><span>{tr(locale, "Active", "सक्रिय")}: {meta.label}</span></div><button type="button" onClick={logout} aria-label="Sign out"><LogOut size={18} /></button></div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar"><button ref={menuButton} className="icon-button mobile-dash-menu" onClick={openSidebar} aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="workspace-navigation"><Menu size={21} /></button><div className="active-role-chip"><UserRound size={17} /><span>{tr(locale, "Active role", "सक्रिय भूमिका")}</span><strong>{meta.label}</strong></div><div className="top-actions"><button className="language-toggle" onClick={() => setLocale(locale === "en" ? "hi" : "en")}><Languages size={18} /> {locale === "hi" ? "English" : "हिन्दी"}</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => toast.show("Notifications reviewed")}><Bell size={19} /><i /></button></div></header>
        <div className="dashboard-mobile-title"><span>{meta.org}</span><strong>{locale === "hi" ? hindiNav[activeTab] || activeTab : activeTab}</strong></div>
        <div className="dashboard-content">
          {locale === "hi" && <div className="localized-page-title"><span>सक्रिय कार्य</span><h1>{hindiNav[activeTab] || activeTab}</h1><p>{hindiRoles[role]} भूमिका के लिए मुख्य कार्य और रिकॉर्ड</p></div>}
          <aside className="dashboard-demo-guide" aria-label="Demo scenario guide"><span className="eyebrow">Demo scenario</span><p>{role === "beekeeper" ? "Record a harvest, then publish it." : role === "manufacturer" ? "Start a run, request its lab test, then package the approved result." : role === "lab" ? "Attach a certificate before approving a queued batch." : role === "consumer" ? "Verify the seeded bottle or record a marketplace order." : "Review an access request, then reset only when you need the seed restored."} Counts, dates, projections, and telemetry examples on this workspace are scenario data unless marked server-backed.</p></aside>
          {role === "beekeeper" && <BeekeeperView tab={activeTab} act={showAction} />}
          {role === "manufacturer" && <ManufacturerView tab={activeTab} act={showAction} />}
          {role === "lab" && <LaboratoryWorkspace tab={activeTab} session={activeSession} toast={toast.show} />}
          {role === "consumer" && <ConsumerWorkspace tab={activeTab} session={activeSession} />}
            {role === "admin" && <AdministratorWorkspace tab={activeTab} toast={toast.show} />}
            {(role === "beekeeper" || role === "admin") && <TelemetryPanel />}
            <WorkflowPanel session={session} />
           <ActivityLedger records={activities} />
        </div>
      </div>
      {sidebarOpen && isMobile && <button className="sidebar-scrim" aria-label="Close navigation" onClick={closeSidebar} />}
      {supportOpen && (
        <aside className="support-chat" role="dialog" aria-modal="false" aria-labelledby="support-chat-title">
          <header><span><MessageCircle size={18} /><strong id="support-chat-title">{tr(locale, "BeeTech support", "बीटेक सहायता")}</strong></span><button type="button" onClick={() => setSupportOpen(false)} aria-label={tr(locale, "Close support chat", "सहायता चैट बंद करें")}><X size={19} /></button></header>
          <div className="support-chat-body"><span className="support-avatar">BT</span><p>{tr(locale, "Hello! Tell us what you need help with and our field support team will get back to you.", "नमस्ते! बताएं कि आपको किस सहायता की आवश्यकता है। हमारी मैदानी सहायता टीम आपसे संपर्क करेगी।")}</p></div>
          <form className="support-chat-compose" onSubmit={(event) => { event.preventDefault(); if (!supportMessage.trim()) return; setSupportMessage(""); toast.show("Support message recorded for this demo session"); }}><label className="sr-only" htmlFor="support-message">{tr(locale, "Support message", "सहायता संदेश")}</label><input id="support-message" value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} type="text" placeholder={tr(locale, "Type your message...", "अपना संदेश लिखें...")} /><button type="submit" aria-label={tr(locale, "Send message", "संदेश भेजें")} disabled={!supportMessage.trim()}><Send size={18} /></button></form>
        </aside>
      )}
      <ActionDialog action={action} locale={locale} onClose={() => setAction("")} onRecord={recordAction} />
      <Toast message={toast.message} />
    </main>
  );
}

function isPublicationAction(action: string) {
  return ["List batch", "List hive/colony", "Publish packaged honey"].includes(action);
}
