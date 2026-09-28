"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CloudOff,
  Database,
  Droplets,
  FileCheck2,
  FileText,
  FlaskConical,
  Heart,
  HelpCircle,
  Hexagon,
  Home,
  Languages,
  Leaf,
  ListChecks,
  LogOut,
  Menu,
  Mic,
  Package,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Thermometer,
  Truck,
  UserRound,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Brand } from "@/components/brand";
import { Marketplace } from "@/components/marketplace";
import { Field, Modal, Status, Toast, useToast } from "@/components/ui";
import { BATCH_ID, navByRole, roleMeta, Role, TRACE_ID, traceTimeline } from "@/lib/data";

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

function subscribeRole(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("hc-role-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("hc-role-change", callback);
  };
}

function getRole(): Role {
  const value = localStorage.getItem("hc_role") as Role | null;
  return value && value in roleMeta ? value : "beekeeper";
}

function MetricCard({ label, value, note, trend, icon: Icon, tone = "honey" }: { label: string; value: string; note: string; trend?: "up" | "down"; icon: React.ElementType; tone?: string }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={trend ? `trend trend-${trend}` : ""}>{trend === "up" && <ArrowUpRight size={14} />}{trend === "down" && <ArrowDownRight size={14} />}{note}</small>
    </article>
  );
}

function MiniLineChart({ data, color = "#d8941c", labels }: { data: number[]; color?: string; labels?: string[] }) {
  const points = data.map((value, index) => `${(index / (data.length - 1)) * 100},${52 - value}`).join(" ");
  return (
    <div className="mini-chart">
      <svg viewBox="0 0 100 56" preserveAspectRatio="none" aria-label="Trend visualization" role="img">
        <defs><linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".24" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={`M0,52 L${points} L100,52 Z`} fill={`url(#fill-${color.replace("#", "")})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {data.map((value, index) => <circle key={index} cx={(index / (data.length - 1)) * 100} cy={52 - value} r="1.3" fill={color} />)}
      </svg>
      {labels && <div className="chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>}
    </div>
  );
}

function PageIntro({ eyebrow, title, copy, actions }: { eyebrow?: string; title: string; copy: string; actions?: React.ReactNode }) {
  return <div className="dash-page-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{copy}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function BeekeeperView({ tab, act }: { tab: string; act: (name: string) => void }) {
  if (tab === "Marketplace") return <><PageIntro eyebrow="Sell and source" title="Marketplace" copy="Offer eligible hive assets or raw batches, and source from verified organisations." actions={<><button className="button button-outline" onClick={() => act("List hive/colony")}><Plus size={17} /> List hive</button><button className="button button-primary" onClick={() => act("List batch")}><Plus size={17} /> List batch</button></>} /><Marketplace compact /></>;
  if (tab === "Overview") return (
    <>
      <PageIntro eyebrow="Demo scenario · Beekeeper workspace" title="Namaste, Asha." copy="Scenario records illustrate field operations. Use the golden path below to create server-backed entries." actions={<><button className="button button-outline" onClick={() => act("Voice entry")}><Mic size={17} /> Voice entry</button><button className="button button-primary" onClick={() => act("Record harvest")}><Plus size={17} /> Record harvest</button></>} />
      <div className="connectivity-bar"><span><CloudOff size={18} /> <strong>Field mode active</strong> · Last synced 18 minutes ago</span><button type="button" onClick={() => act("Sync now")}><RefreshCw size={16} /> Sync 2 records</button></div>
      <div className="metrics-grid four"><MetricCard icon={Hexagon} label="Active hives" value="48" note="3 apiary clusters" /><MetricCard icon={Leaf} label="Healthy colonies" value="44" note="91.7% health rate" trend="up" tone="green" /><MetricCard icon={Droplets} label="September harvest" value="286 kg" note="+32 kg vs forecast" trend="up" tone="blue" /><MetricCard icon={ShoppingBag} label="Listed value" value="₹71,610" note="2 active listings" tone="brown" /></div>
      <div className="dash-grid main-side">
        <section className="panel forecast-panel">
          <div className="panel-heading"><div><span className="eyebrow">Illustrative scenario estimate</span><h2>October yield outlook</h2></div><Status tone="green">Demo range</Status></div>
          <div className="forecast-value"><strong>312</strong><span>kg predicted yield</span><small>Expected range 288–334 kg</small></div>
          <MiniLineChart data={[16, 18, 21, 19, 24, 27, 30, 34, 32, 38, 41, 44]} labels={["W1", "W2", "W3", "W4"]} />
          <div className="insight-note"><Sparkles size={19} /><p><strong>Strong nectar window ahead.</strong> Acacia bloom and stable night temperatures support above-baseline collection. Inspect Hive 12 before adding a super.</p></div>
        </section>
        <section className="panel hive-health-panel">
          <div className="panel-heading"><div><span className="eyebrow">Live conditions</span><h2>Hive health</h2></div><button className="icon-button"><ArrowRight size={18} /></button></div>
          <div className="condition-pair"><div><Thermometer size={21} /><span>Brood temp</span><strong>34.6°C</strong><small>Optimal</small></div><div><Droplets size={21} /><span>Humidity</span><strong>61%</strong><small>Stable</small></div></div>
          <MiniLineChart data={[22, 24, 23, 28, 27, 31, 29, 34, 33, 36]} color="#2e6b4f" labels={["06:00", "12:00", "18:00"]} />
          <div className="health-list"><span><i className="dot green" />44 healthy</span><span><i className="dot honey" />3 need attention</span><span><i className="dot red" />1 sensor offline</span></div>
        </section>
      </div>
      <div className="dash-grid main-side lower-grid">
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Your operation</span><h2>Apiary snapshot</h2></div><button className="text-button" onClick={() => act("Add hive")}>Add hive <Plus size={16} /></button></div><div className="apiary-rows">{[["Rajgarh North", "20 hives", "94%", "Excellent"], ["Bassi Forest Edge", "16 hives", "88%", "Stable"], ["Dausa Mustard Field", "12 hives", "92%", "Excellent"]].map((row) => <div key={row[0]}><span className="apiary-symbol"><Hexagon size={18} /></span><div><strong>{row[0]}</strong><small>{row[1]}</small></div><div className="progress"><i style={{ width: row[2] }} /></div><Status>{row[3]}</Status></div>)}</div></section>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Latest activity</span><h2>Recent events</h2></div></div><div className="event-list">{[["Harvest recorded", "Hive 08 · 42 kg", "Today, 07:42"], ["Batch custody accepted", BATCH_ID, "08 Sep, 15:36"], ["Hive inspection", "Hive 12 · Follow-up noted", "07 Sep, 16:10"]].map((event) => <div key={event[0]}><span className="event-dot" /><div><strong>{event[0]}</strong><span>{event[1]}</span></div><time>{event[2]}</time></div>)}</div></section>
      </div>
    </>
  );
  if (tab === "Apiaries & Hives") return <><PageIntro eyebrow="Field operations" title="Apiaries & hives" copy="Monitor colony health, sensor coverage and inspection history." actions={<button className="button button-primary" onClick={() => act("Add hive")}><Plus size={17} /> Add hive</button>} /><div className="metrics-grid three"><MetricCard icon={Hexagon} label="Registered hives" value="48" note="Across 3 apiaries" /><MetricCard icon={Wifi} label="Sensors online" value="45" note="93.8% coverage" tone="green" /><MetricCard icon={ClipboardCheck} label="Inspections due" value="4" note="Within 7 days" tone="brown" /></div><section className="panel table-panel"><Table rows={[["HC-HIVE-BK102-08", "Rajgarh North", "Apis cerana", "Healthy", "Today, 06:58"], ["HC-HIVE-BK102-12", "Rajgarh North", "Apis cerana", "Attention", "Today, 06:54"], ["HC-HIVE-BK102-15", "Bassi Forest Edge", "Apis mellifera", "Healthy", "14 Sep, 18:20"], ["HC-HIVE-BK102-21", "Dausa Mustard Field", "Apis mellifera", "Healthy", "14 Sep, 18:16"]]} headers={["Hive ID", "Apiary", "Species", "Health", "Last signal"]} /></section></>;
  if (tab === "Harvests & Batches") return <><PageIntro eyebrow="Material records" title="Harvests & batches" copy="Create auditable harvest records and prepare eligible batches for transfer." actions={<><button className="button button-outline" onClick={() => act("List hive/colony")}>List hive</button><button className="button button-outline" onClick={() => act("List batch")}>List batch</button><button className="button button-primary" onClick={() => act("Record harvest")}><Plus size={17} /> Record harvest</button></>} /><section className="panel table-panel"><Table headers={["Batch identity", "Floral source", "Harvest", "Quantity", "Status"]} rows={[[BATCH_ID, "Wild neem & acacia", "06 Sep 2026", "286 kg", "Transferred"], ["HC-BK102-B260829-02", "Mustard", "29 Aug 2026", "214 kg", "Sold"], ["HC-BK102-B260817-01", "Eucalyptus", "17 Aug 2026", "192 kg", "Approved"]]} /></section></>;
  if (tab === "Smart Insights") return <><PageIntro eyebrow="Decision support" title="Smart insights" copy="Sensor patterns and recorded field work translated into practical next actions." /><div className="insight-grid">{[["Nectar flow opportunity", "High", "Add supers to Hives 08, 15 and 21 within 48 hours. Acacia bloom conditions are strengthening."], ["Humidity watch", "Medium", "Hive 12 remained above 70% humidity for 3 hours overnight. Check ventilation during the next visit."], ["Yield confidence", "87%", "October yield remains within the 288–334 kg expected range based on forage and colony strength."]].map((i) => <article className="panel insight-card" key={i[0]}><Sparkles size={22} /><Status tone={i[1] === "Medium" ? "amber" : "green"}>{i[1]}</Status><h2>{i[0]}</h2><p>{i[2]}</p><button className="text-button" onClick={() => act(i[0])}>Review recommendation <ArrowRight size={16} /></button></article>)}</div></>;
  if (tab === "Traceability") return <TraceabilityPanel title="Your latest batch journey" />;
  return <><PageIntro eyebrow="Offline-first field records" title="Sync queue" copy="Records are stored safely on this device until a secure connection is available." actions={<button className="button button-primary" onClick={() => act("Sync now")}><RefreshCw size={17} /> Sync all</button>} /><div className="connectivity-bar"><span><CloudOff size={18} /><strong>Weak connection</strong> · Records remain available offline</span><Status tone="amber">2 waiting</Status></div><section className="panel table-panel"><Table headers={["Record", "Created", "Size", "Sync state"]} rows={[["Hive 12 inspection", "Today, 08:14", "24 KB", "Waiting"], ["Voice note · Rajgarh North", "Today, 08:09", "1.8 MB", "Waiting"], ["Harvest HC-HV-260915-01", "Today, 07:42", "42 KB", "Synced"]]} /></section></>;
}

export function ManufacturerView({ tab, act }: { tab: string; act: (name: string) => void }) {
  if (tab === "Marketplace") return <><PageIntro eyebrow="Responsible sourcing" title="Marketplace" copy="Procure traceable raw inputs and manage your published packaged products." actions={<button className="button button-primary" onClick={() => act("Publish packaged honey")}><Plus size={17} /> Publish product</button>} /><Marketplace compact /></>;
  if (tab === "Overview") return <><PageIntro eyebrow="Madhur Foods · Jaipur unit" title="Good morning, Rohan." copy="One incoming transfer needs receipt and the Wild Forest run is ready for laboratory review." actions={<button className="button button-primary" onClick={() => act("Procure batch")}><ShoppingBag size={17} /> Procure batch</button>} /><div className="metrics-grid four"><MetricCard icon={Truck} label="Incoming custody" value="2" note="286 kg arriving today" /><MetricCard icon={Boxes} label="Approved inputs" value="1,248 kg" note="Across 7 source batches" tone="green" /><MetricCard icon={Activity} label="Processing runs" value="3" note="1 ready for lab" tone="blue" /><MetricCard icon={Package} label="Finished inventory" value="2,840 jars" note="91% lineage linked" tone="brown" /></div><div className="dash-grid main-side"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Custody transfer</span><h2>Incoming from Aravali FPO</h2></div><Status tone="amber">Action needed</Status></div><div className="transfer-card"><div className="transfer-route"><span>Rajgarh<small>Producer</small></span><i><Truck size={18} /></i><span>Jaipur<small>Processing unit</small></span></div><dl><div><dt>Batch</dt><dd>{BATCH_ID}</dd></div><div><dt>Quantity</dt><dd>286 kg · 12 drums</dd></div><div><dt>Seal reference</dt><dd>HC-SEAL-44821–44832</dd></div></dl><button className="button button-primary button-block" onClick={() => act("Receive transfer")}>Receive and verify seals</button></div></section><section className="panel plausibility"><div className="panel-heading"><div><span className="eyebrow">Inventory assurance</span><h2>Quantity plausibility</h2></div><Status>Within range</Status></div><div className="donut"><span><strong>94%</strong><small>inputs accounted</small></span></div><p>Recorded output is consistent with approved inputs, process loss and current inventory.</p><button className="text-button" onClick={() => act("Review inventory proof")}>View calculation <ArrowRight size={16} /></button></section></div><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Active work</span><h2>Production board</h2></div></div><div className="production-board">{[["Inputs received", "Forest Batch 03", "286 kg", "Complete"], ["Processing", "Run MF-260912-02", "Filtering complete", "Complete"], ["Lab review", "BQL request 884", "Results ready", "Review"], ["Packaging", "500 g amber jars", "420 planned", "Blocked"]].map((c, i) => <article key={c[0]}><span className={`board-number ${i < 2 ? "done" : ""}`}>{i < 2 ? <Check size={16} /> : i + 1}</span><small>{c[0]}</small><strong>{c[1]}</strong><p>{c[2]}</p><Status tone={c[3] === "Complete" ? "green" : c[3] === "Review" ? "amber" : "grey"}>{c[3]}</Status></article>)}</div></section></>;
  if (tab === "Procure") return <><PageIntro eyebrow="Verified source network" title="Procure raw honey" copy="Purchase eligible raw batches. A confirmed order creates a custody transfer and receiving task." actions={<button className="button button-primary" onClick={() => act("Procure batch")}><Plus size={17} /> New procurement</button>} /><Marketplace compact /></>;
  if (tab === "Inputs") return <><PageIntro eyebrow="Received material" title="Input batches" copy="Approved source batches available for transformation without losing their original identity." actions={<button className="button button-primary" onClick={() => act("Receive transfer")}><Truck size={17} /> Receive transfer</button>} /><section className="panel table-panel"><Table headers={["Source batch", "Producer", "Received", "Available", "Status"]} rows={[[BATCH_ID, "Aravali Madhu Sakhi FPO", "08 Sep", "286 kg", "Approved"], ["HC-BK228-B260902-01", "Vaishali Bee Collective", "05 Sep", "94 kg", "Approved"], ["HC-BK311-B260828-02", "Ganga Apiary Cooperative", "31 Aug", "168 kg", "Reserved"]]} /></section></>;
  if (tab === "Processing") return <><PageIntro eyebrow="Transformation records" title="Processing runs" copy="Link every output to its source inputs, process measurements and accountable operator." actions={<button className="button button-primary" onClick={() => act("Start processing")}><Plus size={17} /> Start processing</button>} /><section className="panel process-detail"><div className="panel-heading"><div><span className="eyebrow">Run MF-260912-02</span><h2>Wild Forest · slow filtration</h2></div><Status tone="amber">Lab review</Status></div><div className="provenance-flow"><div><Boxes /><strong>{BATCH_ID}</strong><span>286 kg input</span></div><ArrowRight /><div><Activity /><strong>MF-260912-02</strong><span>36°C · 4.2 hours</span></div><ArrowRight /><div><Package /><strong>WF-500-260912</strong><span>278.4 kg output</span></div></div></section></>;
  if (tab === "Lab Tests") return <><PageIntro eyebrow="Independent assurance" title="Laboratory tests" copy="Request, track and link laboratory decisions to the correct processing output." actions={<button className="button button-primary" onClick={() => act("Request lab test")}><FlaskConical size={17} /> Request lab test</button>} /><section className="panel table-panel"><Table headers={["Request", "Batch / run", "Laboratory", "Submitted", "Status"]} rows={[["BQL-REQ-884", "MF-260912-02", "Bharat Quality Labs", "09 Sep", "Results ready"], ["BQL-REQ-863", "MF-260829-01", "Bharat Quality Labs", "30 Aug", "Approved"], ["NQAL-REQ-416", "MF-260817-03", "National Quality Analytics", "18 Aug", "Approved"]]} /></section></>;
  if (tab === "Packaging") return <><PageIntro eyebrow="Bottle-level identity" title="Packaging runs" copy="Generate secure bottle identities only from approved material." /><section className="panel package-feature"><div className="qr-large"><QrCode size={112} /></div><div><Status>Server-backed</Status><h2>Batch QR generation is ready</h2><p>Use the Golden path panel below to select an approved processing run, choose up to 24 bottles, and create a unique QR plus local blockchain block for every identity.</p><dl><div><dt>Identity format</dt><dd>Batch + 6-digit serial</dd></div><div><dt>Proof</dt><dd>SHA-256 local PoA block</dd></div><div><dt>Output</dt><dd>Printable QR label sheet</dd></div></dl></div></section></>;
  return <TraceabilityPanel title="Wild Forest provenance flow" />;
}

function LaboratoryView({ tab, toast }: { tab: string; toast: (message: string) => void }) {
  const [decision, setDecision] = useState("Pending review");
  const [certificate, setCertificate] = useState(false);
  const [selected, setSelected] = useState(BATCH_ID);
  if (tab !== "Work queue") {
    const content: Record<string, { title: string; copy: string; headers: string[]; rows: string[][] }> = {
      Specimens: { title: "Registered specimens", copy: "Chain-of-custody records assigned to your laboratory.", headers: ["Specimen", "Batch", "Received", "Seal", "State"], rows: [["BQL-S-884-A", BATCH_ID, "09 Sep · 10:24", "Intact", "Testing"], ["BQL-S-881-A", "HC-BK228-B260902-01", "08 Sep · 14:12", "Intact", "Stored"], ["BQL-S-863-A", "HC-MF221-P260829-01", "30 Aug · 11:05", "Intact", "Archived"]] },
      "Test results": { title: "Test results", copy: "Structured results and accountable review outcomes.", headers: ["Result", "Batch", "Moisture", "Adulteration", "Decision"], rows: [["BQL-R-884", BATCH_ID, "17.4%", "Not detected", decision], ["BQL-R-863", "HC-BK102-B260829-02", "17.8%", "Not detected", "Approved"], ["BQL-R-841", "HC-BK311-B260817-01", "19.6%", "Inconclusive", "Rejected"]] },
      Certificates: { title: "Certificates", copy: "Digitally signed quality certificates issued by Bharat Quality Labs.", headers: ["Certificate", "Batch", "Issued", "Signer", "Integrity"], rows: [["BQL-26-0910-884", BATCH_ID, "10 Sep 2026", "Dr. Neha Kulkarni", certificate ? "Valid" : "Draft"], ["BQL-26-0831-863", "HC-BK102-B260829-02", "31 Aug 2026", "Dr. Neha Kulkarni", "Valid"]] },
      "Approved batches": { title: "Approved batches", copy: "Batches approved after completed analytical review.", headers: ["Batch", "Client", "Approved", "Certificate", "State"], rows: [["HC-BK102-B260829-02", "Madhur Foods", "31 Aug", "BQL-26-0831-863", "Approved"], ["HC-BK228-B260826-04", "Pahadi Ras Foods", "28 Aug", "BQL-26-0828-852", "Approved"]] },
    };
    const item = content[tab];
    return <><PageIntro eyebrow="Bharat Quality Labs" title={item.title} copy={item.copy} /><section className="panel table-panel"><Table headers={item.headers} rows={item.rows} /></section></>;
  }
  function decide(next: string) { setDecision(next); toast(`Batch ${next.toLowerCase()} and accountable decision recorded`); }
  return <><PageIntro eyebrow="Bharat Quality Labs · Jaipur" title="Quality review queue" copy="Review assigned material, attach evidence and make an accountable batch decision." /><div className="lab-layout"><aside className="panel queue-panel"><div className="panel-heading"><div><span className="eyebrow">Assigned to you</span><h2>3 pending requests</h2></div></div>{[[BATCH_ID, "Madhur Foods", "High", "Today"], ["HC-BK228-B260902-01", "Pahadi Ras Foods", "Normal", "Today"], ["HC-BK311-B260828-02", "Sundar Naturals", "Normal", "Tomorrow"]].map((item) => <button className={selected === item[0] ? "selected" : ""} key={item[0]} onClick={() => setSelected(item[0])}><div><strong>{item[0]}</strong><span>{item[1]}</span></div><Status tone={item[2] === "High" ? "amber" : "grey"}>{item[2]}</Status><small>Due {item[3]}</small></button>)}</aside><section className="panel lab-detail"><div className="lab-detail-head"><div><span className="eyebrow">Request BQL-REQ-884</span><h2>{selected}</h2><p>Wild forest raw honey · Submitted by Madhur Foods</p></div><Status tone={decision === "Approved" ? "green" : decision === "Rejected" ? "red" : "amber"}>{decision}</Status></div><div className="sample-facts"><div><span>Specimen</span><strong>BQL-S-884-A</strong></div><div><span>Seal integrity</span><strong>Confirmed</strong></div><div><span>Received</span><strong>09 Sep, 10:24</strong></div><div><span>Requested by</span><strong>Rohan Mehta</strong></div></div><form className="lab-form" onSubmit={(event) => event.preventDefault()}><h3>Analytical results</h3><div className="form-grid three"><Field label="Pollen profile"><select defaultValue="Conforms"><option>Conforms</option><option>Does not conform</option><option>Inconclusive</option></select></Field><Field label="Moisture (%)"><input type="number" step="0.1" defaultValue="17.4" /></Field><Field label="Adulteration screen"><select defaultValue="Not detected"><option>Not detected</option><option>Detected</option><option>Inconclusive</option></select></Field></div><Field label="Reviewer notes"><textarea rows={3} defaultValue="Pollen spectrum is consistent with declared wild neem and acacia forage. Moisture is within the accepted range. No exogenous sugar markers detected." /></Field><button className={`upload-area ${certificate ? "uploaded" : ""}`} type="button" onClick={() => { setCertificate(true); toast("Certificate BQL-26-0910-884 attached"); }}><FileCheck2 size={27} /><span><strong>{certificate ? "BQL-26-0910-884.pdf attached" : "Attach signed laboratory certificate"}</strong><small>{certificate ? "248 KB · Signature ready for validation" : "PDF up to 10 MB · Select a certificate file"}</small></span>{certificate && <CheckCircle2 size={22} />}</button><div className="decision-bar"><button className="button button-danger" type="button" onClick={() => decide("Rejected")}><X size={17} /> Reject batch</button><button className="button button-primary" type="button" onClick={() => decide("Approved")} disabled={!certificate}><Check size={17} /> Approve and certify</button></div>{!certificate && <p className="form-hint">Attach the signed certificate before approval.</p>}</form></section></div></>;
}

function ConsumerView({ tab }: { tab: string }) {
  const [orders] = useState<Array<{ id: string; item: string; quantity: number }>>(() => typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem("hc_orders") || "[]"));
  if (tab === "Marketplace") return <><PageIntro eyebrow="Verified products" title="Marketplace" copy="Discover honey and registered assets with provenance you can inspect." /><Marketplace compact /></>;
  if (tab === "My orders") return <><PageIntro eyebrow="Purchase history" title="My orders" copy="Orders retain a link to the product record and relevant ownership or custody event." /><section className="panel table-panel"><Table headers={["Order", "Product", "Quantity", "Status"]} rows={[...orders.map((o) => [o.id, o.item, String(o.quantity), "Confirmed"]), ["HC-ORD-684291", "Wild Forest Honey · 500 g", "2 jars", "Confirmed"], ["HC-ORD-661824", "Himalayan Multi-flora Honey", "1 jar", "Completed"]]} /></section></>;
  if (tab === "Saved products") return <><PageIntro eyebrow="Your shortlist" title="Saved products" copy="Return to verified products and traceable harvests you are considering." /><div className="saved-grid"><article className="panel saved-item"><span className="saved-art"><Leaf /></span><div><Status>Traceability complete</Status><h2>Wild Forest Honey</h2><p>Madhur Foods · Jaipur</p><strong>₹449 · 500 g jar</strong></div><Link className="button button-dark" href="/marketplace">View listing</Link></article><article className="panel saved-item"><span className="saved-art raw"><Droplets /></span><div><Status>Batch approved</Status><h2>Litchi blossom raw honey</h2><p>Vaishali Bee Collective · Bihar</p><strong>₹410 · per kg</strong></div><Link className="button button-dark" href="/marketplace">View listing</Link></article></div></>;
  return <><PageIntro eyebrow="Public authenticity check" title="Verify a bottle" copy="Enter the identity printed beside a Honey Chain QR code." /><section className="panel inline-verify"><QrCode size={72} /><div><h2>Check bottle provenance</h2><p>View the approved source, laboratory assurance and farm-to-bottle journey without exposing protected producer information.</p><div className="id-preview">{TRACE_ID}</div><Link className="button button-primary" href={`/verify?trace=${TRACE_ID}`}>Open verification <ArrowRight size={17} /></Link></div></section></>;
}

function AdministratorView({ tab, toast }: { tab: string; toast: (message: string) => void }) {
  const [access, setAccess] = useState("Pending");
  const [anomaly, setAnomaly] = useState("Open review");
  const [org, setOrg] = useState("Pending");
  if (tab === "Command centre") return <><PageIntro eyebrow="Honey Chain Governance Cell" title="Command centre" copy="Network health, accountable approvals and evidence-led exception handling." /><div className="metrics-grid four"><MetricCard icon={Building2} label="Active organisations" value="42" note="3 awaiting review" /><MetricCard icon={Users} label="Verified participants" value="186" note="12 role updates this month" tone="green" /><MetricCard icon={ClipboardCheck} label="Access requests" value="7" note="2 nearing SLA" tone="blue" /><MetricCard icon={AlertTriangle} label="Open anomalies" value="4" note="1 high priority" tone="brown" /></div><div className="dash-grid admin-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Governance queue</span><h2>Pending approvals</h2></div></div><div className="approval-list"><article><span className="org-mark">GP</span><div><strong>Giriraj Pahadi Beekeepers Society</strong><p>Organisation registration · Alwar, Rajasthan</p><small>Documents checked · 14 Sep</small></div><Status tone={org === "Approved" ? "green" : org === "Denied" ? "red" : "amber"}>{org}</Status><div><button onClick={() => { setOrg("Denied"); toast("Organisation application denied with decision record"); }}>Deny</button><button onClick={() => { setOrg("Approved"); toast("Organisation approved and onboarding access issued"); }}>Approve</button></div></article><article><span className="org-mark green">BQ</span><div><strong>Bharat Quality Labs</strong><p>Add certificate reviewer role · Priya Sharma</p><small>Requested by lab administrator</small></div><Status tone="amber">Pending</Status><div><button onClick={() => toast("Role request denied")}>Deny</button><button onClick={() => toast("Certificate reviewer role approved")}>Approve</button></div></article></div></section><section className="panel network-health"><div className="panel-heading"><div><span className="eyebrow">Platform health</span><h2>Evidence network</h2></div><Status>Operational</Status></div><div className="health-score"><strong>99.96%</strong><span>event availability</span></div><MiniLineChart data={[33, 35, 34, 38, 37, 40, 39, 42, 43, 42]} color="#2e6b4f" /><div><span><i className="dot green" /> API and sync services</span><strong>Healthy</strong></div><div><span><i className="dot green" /> Proof anchoring</span><strong>4 min ago</strong></div><div><span><i className="dot honey" /> Offline queues</span><strong>21 devices</strong></div></section></div><section className="panel audit-preview"><div className="panel-heading"><div><span className="eyebrow">Immutable event stream</span><h2>Latest network events</h2></div></div><Table headers={["Time", "Event", "Identity", "Actor", "Proof"]} rows={[["09:41:22", "Bottle identity generated", TRACE_ID, "Madhur Foods", "Anchored"], ["09:38:07", "Laboratory approval", BATCH_ID, "Bharat Quality Labs", "Anchored"], ["09:31:44", "Hive inspection synced", "HC-HIVE-BK102-12", "Asha Devi", "Anchored"], ["09:26:18", "Access request submitted", "HC-REQ-26194", "Kavya Nair", "Pending"]]} /></section></>;
  if (tab === "Access requests") return <><PageIntro eyebrow="Consumer transparency" title="Access requests" copy="Grant purpose-limited access only when the stated need justifies protected detail." /><div className="admin-case-layout"><section className="panel case-list"><button className="selected"><div><strong>HC-REQ-26194</strong><span>Kavya Nair · Consumer</span><small>Full audit trail · 24 min ago</small></div><Status tone={access === "Approved" ? "green" : access === "Denied" ? "red" : "amber"}>{access}</Status></button><button><div><strong>HC-REQ-26188</strong><span>Meera Stores · Buyer</span><small>Supplier detail · 2 hours ago</small></div><Status tone="amber">Pending</Status></button></section><section className="panel case-detail"><span className="eyebrow">Selected request</span><h2>Full audit trail access</h2><p className="case-id">{TRACE_ID}</p><dl className="detail-list"><div><dt>Requester</dt><dd>Kavya Nair · Verified account</dd></div><div><dt>Requested</dt><dd>15 Sep 2026 · 09:26</dd></div><div><dt>Purpose</dt><dd>Reviewing purchase provenance for a resident welfare association&apos;s monthly food sourcing report.</dd></div><div><dt>Requested scope</dt><dd>Full custody events, participant organisations and quantity record.</dd></div></dl><div className="evidence-note"><ShieldCheck size={20} /><p>Identity confirmed. Stated purpose is specific. Access can be limited to 7 days and will exclude personal contact details.</p></div><div className="decision-bar"><button className="button button-danger" onClick={() => { setAccess("Denied"); toast("Access request denied and requester notified"); }}>Deny request</button><button className="button button-primary" onClick={() => { setAccess("Approved"); toast("Purpose-limited access granted for 7 days"); }}>Approve for 7 days</button></div></section></div></>;
  if (tab === "Anomalies") return <><PageIntro eyebrow="Evidence-led review" title="Traceability anomalies" copy="Plausibility flags support human review; they do not prove fraud or adulteration." /><div className="admin-case-layout"><section className="panel case-list"><button className="selected"><div><strong>HC-ANM-0472</strong><span>Packaged quantity variance</span><small>Madhuban Foods · High priority</small></div><Status tone={anomaly === "Resolved" ? "green" : "red"}>{anomaly}</Status></button><button><div><strong>HC-ANM-0468</strong><span>Repeated QR scan pattern</span><small>Delhi NCR · Medium</small></div><Status tone="amber">Investigating</Status></button></section><section className="panel case-detail"><span className="eyebrow">Selected anomaly</span><h2>Output exceeds expected material</h2><p className="case-id">HC-MB443-P260910-04</p><div className="variance-visual"><div><span>Approved inputs</span><strong>820 kg</strong><i style={{ width: "72%" }} /></div><div><span>Recorded packaged output</span><strong>1,142 kg</strong><i className="danger" style={{ width: "100%" }} /></div></div><dl className="detail-list"><div><dt>Expected range</dt><dd>771–812 kg after process loss</dd></div><div><dt>Variance</dt><dd>+330 kg above upper bound</dd></div><div><dt>Evidence sources</dt><dd>3 input batches · 2 processing runs · 2 packaging events</dd></div><div><dt>Organisation response</dt><dd>Additional source transfer document submitted 14 Sep</dd></div></dl><div className="decision-bar"><button className="button button-outline" onClick={() => toast("Additional evidence requested from Madhuban Foods")}>Request evidence</button><button className="button button-primary" onClick={() => { setAnomaly("Resolved"); toast("Case resolved with reason and evidence links recorded"); }}>Resolve case</button></div></section></div></>;
  const generic: Record<string, { title: string; copy: string; headers: string[]; rows: string[][] }> = {
    Organisations: { title: "Organisations", copy: "Verify legal entities, operating roles and onboarding evidence.", headers: ["Organisation", "Type", "Location", "Participants", "State"], rows: [["Aravali Madhu Sakhi FPO", "Producer collective", "Dausa, Rajasthan", "24", "Active"], ["Madhur Foods", "Manufacturer", "Jaipur, Rajasthan", "12", "Active"], ["Bharat Quality Labs", "Laboratory", "Jaipur, Rajasthan", "8", "Active"], ["Giriraj Pahadi Society", "Producer collective", "Alwar, Rajasthan", "16", org]] },
    "Users & roles": { title: "Users & roles", copy: "Role assignment controls access across organisations and operational workflows.", headers: ["Participant", "Organisation", "Roles", "Last active", "State"], rows: [["Asha Devi", "Aravali Madhu Sakhi FPO", "Beekeeper, Buyer", "8 min ago", "Active"], ["Rohan Mehta", "Madhur Foods", "Manufacturer, Buyer", "3 min ago", "Active"], ["Dr. Neha Kulkarni", "Bharat Quality Labs", "Laboratory", "Now", "Active"], ["Kavya Nair", "Independent", "Consumer", "24 min ago", "Active"]] },
    "Audit ledger": { title: "Audit ledger", copy: "Append-only material events with actor, time, source and proof state.", headers: ["Timestamp", "Event", "Object", "Actor", "Proof"], rows: traceTimeline.map((e) => [e.date, e.title, BATCH_ID, e.actor, "Anchored"]) },
    "Blockchain proof": { title: "Local PoA blockchain", copy: "Every event is stored in an append-only SHA-256 block; sensitive operational data remains off-chain.", headers: ["Network", "Consensus", "Validator", "Committed data", "State"], rows: [["Honey Chain Local", "Proof of authority", "HC-POA-VALIDATOR-01", "Event hash + receipt hash", "Verified"], ["Privacy boundary", "Off-chain records", "Application roles", "No personal data in blocks", "Active"]] },
  };
  const item = generic[tab];
  return <><PageIntro eyebrow="Network governance" title={item.title} copy={item.copy} /><section className="panel table-panel"><Table headers={item.headers} rows={item.rows} /></section></>;
}

function TraceabilityPanel({ title }: { title: string }) {
  return <><PageIntro eyebrow="Append-only provenance" title={title} copy="Every material handoff and transformation retains its link to the original source record." /><section className="panel trace-panel"><div className="panel-heading"><div><span className="eyebrow">Complete chain</span><h2>{BATCH_ID}</h2></div><Status>All stages linked</Status></div><div className="horizontal-trace">{traceTimeline.map((event, index) => <article key={event.title}><span>{index + 1}</span><div><small>{event.date}</small><strong>{event.title}</strong><p>{event.detail}</p><em>{event.actor}</em></div>{index < traceTimeline.length - 1 && <ArrowRight size={18} />}</article>)}</div></section></>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="responsive-table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={`${row[0]}-${i}`}>{row.map((cell, j) => <td key={`${cell}-${j}`}>{j === row.length - 1 ? <Status tone={cell.includes("Reject") || cell.includes("Denied") ? "red" : cell.includes("Pending") || cell.includes("Waiting") || cell.includes("Review") || cell.includes("Attention") || cell.includes("Reserved") || cell.includes("Draft") ? "amber" : "green"}>{cell}</Status> : cell}</td>)}</tr>)}</tbody></table></div>;
}

function ActionDialog({ action, onClose, onDone }: { action: string; onClose: () => void; onDone: (message: string) => void }) {
  const isVoice = action === "Voice entry";
  const isSync = action === "Sync now";
  const isPackage = action === "Package bottles";
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); onDone(`${action} completed and added to the traceability record`); onClose(); }
  return <Modal open={Boolean(action)} onClose={onClose} title={action} eyebrow="Accountable operation"><form className="form-stack" onSubmit={submit}>{isVoice ? <div className="voice-panel"><button type="button" className="voice-record" onClick={() => onDone("Voice note captured in Hindi and ready to review")}><Mic size={30} /></button><h3>Tap to record a field note</h3><p>Hindi and English field terms are available offline. Review the transcript before saving.</p></div> : isSync ? <div className="sync-panel"><RefreshCw size={36} /><h3>2 records ready to sync</h3><p>Hive 12 inspection and one voice note will be securely uploaded in creation order.</p></div> : <><div className="form-grid"><Field label={isPackage ? "Packaged product" : action.includes("hive") || action.includes("Hive") ? "Hive identity" : "Batch / material identity"}><input defaultValue={isPackage ? "Wild Forest Honey · 500 g" : action.includes("hive") || action.includes("Hive") ? "HC-HIVE-BK102-49" : BATCH_ID} required /></Field><Field label={action === "Record harvest" ? "Harvest quantity (kg)" : isPackage ? "Bottle count" : "Quantity (kg)"}><input type="number" defaultValue={isPackage ? "420" : action === "Record harvest" ? "42" : "286"} min="1" required /></Field></div><Field label="Responsible location"><input defaultValue={action.includes("processing") || isPackage ? "Madhur Foods · Jaipur Unit" : "Rajgarh North · Rajasthan"} required /></Field><Field label="Notes"><textarea rows={3} placeholder="Add handling, condition or decision notes" defaultValue={action === "Receive transfer" ? "All drum seals intact on arrival." : ""} /></Field></>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{isSync ? "Sync records" : isVoice ? "Save reviewed note" : `Confirm ${action.toLowerCase()}`}</button></div></form></Modal>;
}

export default function DashboardApp() {
  const router = useRouter();
  const role = useSyncExternalStore(subscribeRole, getRole, () => "beekeeper" as Role);
  const [tab, setTab] = useState("Overview");
  const [hindi, setHindi] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [action, setAction] = useState("");
  const toast = useToast();
  const meta = roleMeta[role];
  const navigation = navByRole[role];
  const activeTab = navigation.includes(tab) ? tab : navigation[0];

  function switchRole(next: Role) { localStorage.setItem("hc_role", next); window.dispatchEvent(new Event("hc-role-change")); setTab(navByRole[next][0]); }
  function logout() { localStorage.removeItem("hc_role"); localStorage.removeItem("hc_email"); router.push("/login"); }
  function showAction(name: string) { if (["Review recommendation", "Review inventory proof", "Nectar flow opportunity", "Humidity watch", "Yield confidence"].includes(name)) toast.show("Detailed evidence view opened and review marked in progress"); else setAction(name); }

  return <main className="dashboard-shell">
    <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand /><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
      <div className="workspace-label"><span>{hindi ? "कार्यस्थान" : "Workspace"}</span><strong>{meta.org}</strong></div>
      <nav className="dashboard-nav" aria-label="Workspace navigation">{navigation.map((item) => { const Icon = navIcons[item] || Home; return <button key={item} className={activeTab === item ? "active" : ""} onClick={() => { setTab(item); setSidebarOpen(false); }}><Icon size={19} /><span>{hindi ? hindiNav[item] || item : item}</span>{item === "Sync Queue" && <em>2</em>}{item === "Work queue" && <em>3</em>}{item === "Access requests" && <em>7</em>}</button>; })}</nav>
      <div className="sidebar-support"><HelpCircle size={18} /><div><strong>{hindi ? "सहायता चाहिए?" : "Need support?"}</strong><span>{hindi ? "फील्ड सहायता उपलब्ध" : "Field assistance available"}</span></div></div>
      <div className="sidebar-profile"><span className={`role-avatar role-${role}`}>{meta.initials}</span><div><strong>{meta.person}</strong><span>{meta.label}</span></div><button onClick={logout} aria-label="Sign out"><LogOut size={18} /></button></div>
    </aside>
    <div className="dashboard-main">
      <header className="dashboard-topbar"><button className="icon-button mobile-dash-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="top-search"><Search size={18} /><input aria-label="Search workspace" placeholder={hindi ? "रिकॉर्ड खोजें..." : "Search records, batches, identities..."} /></div><div className="top-actions"><button className="language-toggle" onClick={() => setHindi(!hindi)}><Languages size={18} /> {hindi ? "English" : "हिन्दी"}</button><label className="role-switch"><span className="sr-only">Switch active role</span><UserRound size={17} /><select value={role} onChange={(event) => switchRole(event.target.value as Role)}>{Object.entries(roleMeta).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select><ChevronDown size={15} /></label><button className="icon-button notification-button" aria-label="Notifications" onClick={() => toast.show("You have 3 reviewed notifications")}><Bell size={19} /><i /></button></div></header>
      <div className="dashboard-mobile-title"><span>{meta.org}</span><strong>{hindi ? hindiNav[activeTab] || activeTab : activeTab}</strong></div>
      <div className="dashboard-content">{role === "beekeeper" && <BeekeeperView tab={activeTab} act={showAction} />}{role === "manufacturer" && <ManufacturerView tab={activeTab} act={showAction} />}{role === "lab" && <LaboratoryView tab={activeTab} toast={toast.show} />}{role === "consumer" && <ConsumerView tab={activeTab} />}{role === "admin" && <AdministratorView tab={activeTab} toast={toast.show} />}</div>
    </div>
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <ActionDialog action={action} onClose={() => setAction("")} onDone={toast.show} />
    <Toast message={toast.message} />
  </main>;
}
