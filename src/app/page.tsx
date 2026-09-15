"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Leaf,
  LockKeyhole,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useState } from "react";
import { HexPattern } from "@/components/brand";
import { PublicHeader } from "@/components/public-header";
import { TRACE_ID } from "@/lib/data";
import { tr, useLocale } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [trace, setTrace] = useState("");
  const { locale } = useLocale();

  function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/verify?trace=${encodeURIComponent(trace.trim())}`);
  }

  return (
    <main className="landing">
      <PublicHeader />
      <section className="hero">
        <HexPattern className="hero-pattern" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><span className="live-dot" /> {tr(locale, "India's trusted honey provenance network", "भारत का विश्वसनीय शहद उत्पत्ति नेटवर्क")}</span>
            <h1>{tr(locale, "Know the hands.", "मेहनत को जानें।")}<br />{tr(locale, "Trust the honey.", "शहद पर भरोसा करें।")}</h1>
            <p className="hero-lead">{tr(locale, "Follow every jar from a registered hive to independent lab review and responsible bottling. One trace ID holds the story.", "हर जार की यात्रा पंजीकृत छत्ते से स्वतंत्र लैब समीक्षा और जिम्मेदार पैकेजिंग तक देखें। एक ट्रेस आईडी पूरी कहानी बताती है।")}</p>
            <form className="verify-bar" onSubmit={verify}>
              <ScanLine size={22} aria-hidden="true" />
              <label className="sr-only" htmlFor="hero-trace">Bottle trace ID</label>
              <input id="hero-trace" value={trace} onChange={(event) => setTrace(event.target.value)} placeholder={TRACE_ID} required />
              <button type="submit">{tr(locale, "Verify bottle", "बोतल सत्यापित करें")} <ArrowRight size={18} /></button>
            </form>
            <button className="example-id" type="button" onClick={() => setTrace(TRACE_ID)}>
              {tr(locale, "Try a verified ID:", "सत्यापित आईडी आज़माएँ:")} <strong>{TRACE_ID}</strong>
            </button>
            <div className="trust-row">
              <span><CheckCircle2 size={17} /> Lab-reviewed quality</span>
              <span><CheckCircle2 size={17} /> Tamper-evident record</span>
              <span><CheckCircle2 size={17} /> Protected producer data</span>
            </div>
          </div>
          <div className="hero-product" aria-label="Verified Wild Forest Honey bottle">
            <div className="product-orbit orbit-one"><Leaf size={18} /> Wild forest</div>
            <div className="product-orbit orbit-two"><FlaskConical size={18} /> Lab tested</div>
            <div className="hero-bottle-shadow" />
            <div className="hero-bottle">
              <div className="bottle-cap" />
              <div className="bottle-label">
                <span>HONEY CHAIN</span>
                <i />
                <h2>Wild<br />Forest</h2>
                <p>PURE INDIAN HONEY</p>
                <QrCode size={34} />
                <small>500 g</small>
              </div>
            </div>
            <div className="verification-seal"><ShieldCheck size={25} /><strong>VERIFIED</strong><span>5-stage provenance</span></div>
          </div>
        </div>
        <div className="impact-strip">
          <div><strong>2,480+</strong><span>registered hives</span></div>
          <div><strong>18</strong><span>producer collectives</span></div>
          <div><strong>34,760</strong><span>bottles traceable</span></div>
          <div><strong>7</strong><span>independent labs</span></div>
        </div>
      </section>

      <section className="story-section" id="journey">
        <div className="section-heading editorial-heading">
          <span className="eyebrow">{tr(locale, "Evidence at every handoff", "हर हस्तांतरण पर प्रमाण")}</span>
          <h2>{tr(locale, "A living record, not just a label.", "सिर्फ लेबल नहीं, एक जीवंत रिकॉर्ड।")}</h2>
          <p>{tr(locale, "Honey Chain connects the people who nurture, test and bottle your honey while keeping sensitive rural livelihoods protected.", "हनी चेन ग्रामीण आजीविका की संवेदनशील जानकारी सुरक्षित रखते हुए शहद पालने, जाँचने और पैक करने वाले लोगों को जोड़ती है।")}</p>
        </div>
        <div className="journey-grid">
          <article className="journey-card journey-large">
            <div className="journey-number">01</div>
            <div className="illustration apiary-illustration"><div className="sun" /><div className="hill hill-one" /><div className="hill hill-two" /><div className="mini-hive" /><Sprout size={50} /></div>
            <div><span>At the source</span><h3>Hive and harvest identity</h3><p>Registered hives, inspection records and harvest conditions begin a verifiable material lineage in the field.</p></div>
          </article>
          <article className="journey-card">
            <div className="journey-number">02</div>
            <FlaskConical className="journey-icon" size={34} />
            <span>Independent assurance</span><h3>Lab-reviewed quality</h3><p>Assigned laboratories record pollen, moisture and adulteration screening against each batch.</p>
          </article>
          <article className="journey-card dark-card">
            <div className="journey-number">03</div>
            <LockKeyhole className="journey-icon" size={34} />
            <span>Tamper-evident proof</span><h3>History that cannot be quietly rewritten</h3><p>Material events are attributable and secured without exposing personal or commercial data on-chain.</p>
          </article>
          <article className="journey-card journey-wide">
            <div><div className="journey-number">04</div><span>At your table</span><h3>One bottle. One clear answer.</h3><p>Scan the identity to see approved origin, quality and journey details, then request deeper access with a reason when needed.</p></div>
            <Link className="button button-primary" href={`/verify?trace=${TRACE_ID}`}>See a verified journey <ArrowRight size={18} /></Link>
          </article>
        </div>
      </section>

      <section className="people-section">
        <div className="people-quote">
          <span className="quote-mark">“</span>
          <blockquote>When buyers can see the care behind every harvest, our honey carries more than a price. It carries our name and our work.</blockquote>
          <div className="quote-person"><span>AD</span><div><strong>Asha Devi</strong><small>Beekeeper · Aravali Madhu Sakhi FPO</small></div></div>
        </div>
        <div className="people-copy">
          <span className="eyebrow">Stronger rural market links</span>
          <h2>Trust that returns value to the source.</h2>
          <p>Responsible provenance helps beekeeper organisations build dependable buyer relationships, manage hive health and preserve the identity of their work through processing.</p>
          <Link className="text-link" href="/marketplace">Explore the marketplace <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="landing-cta">
        <HexPattern />
        <div><span className="eyebrow">{tr(locale, "For producers, processors and institutions", "उत्पादकों, प्रसंस्करणकर्ताओं और संस्थानों के लिए")}</span><h2>{tr(locale, "Build trust into every batch.", "हर बैच में भरोसा जोड़ें।")}</h2></div>
        <Link className="button button-light" href="/login">{tr(locale, "Access your workspace", "अपना कार्यस्थान खोलें")} <ArrowRight size={18} /></Link>
      </section>
      <footer className="public-footer">
        <div><strong>Honey Chain</strong><span>Trusted from hive to home.</span></div>
        <p>Transparent provenance. Protected livelihoods. Responsible honey.</p>
        <div><Link href="/verify">Verify</Link><Link href="/marketplace">Marketplace</Link><Link href="/login">Sign in</Link></div>
      </footer>
    </main>
  );
}
