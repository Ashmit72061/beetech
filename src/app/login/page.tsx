"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Brand, HexPattern } from "@/components/brand";
import { credentials, Role } from "@/lib/data";
import { signInAccount, tr, useLocale } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { locale, setLocale } = useLocale();

  function destination() {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (!requested || !requested.startsWith("/") || requested.startsWith("//")) return "/dashboard";
    try {
      const target = new URL(requested, window.location.origin);
      if (target.origin !== window.location.origin) return "/dashboard";
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return "/dashboard";
    }
  }

  function signIn(role: Role, selectedEmail?: string) {
    if (signInAccount(role, selectedEmail || email)) router.push(destination());
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = credentials.find((item) => item.email === email.trim().toLowerCase() && item.password === password);
    if (!account) {
      setError("Email or password does not match an available Honey Chain account.");
      return;
    }
    signIn(account.role, account.email);
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <HexPattern />
        <Brand />
        <div className="login-story">
          <span className="eyebrow eyebrow-light">{tr(locale, "Secure provenance workspace", "सुरक्षित उत्पत्ति कार्यस्थान")}</span>
          <h1>{tr(locale, "Every action becomes part of the story.", "हर कार्य कहानी का हिस्सा बनता है।")}</h1>
          <p>{tr(locale, "Record field work, preserve custody, review quality and govern access from one accountable network.", "मैदानी कार्य दर्ज करें, अभिरक्षा सुरक्षित रखें और एक जवाबदेह नेटवर्क से गुणवत्ता की समीक्षा करें।")}</p>
          <div className="login-proof"><ShieldCheck size={24} /><div><strong>Tamper-evident by design</strong><span>Sensitive operational data stays protected off-chain.</span></div></div>
        </div>
        <p className="login-panel-foot">Honey Chain · Ministry of MSME / KVIC Honey Mission</p>
      </section>
      <section className="login-content">
        <div className="login-top"><Link href="/"><ArrowLeft size={17} /> {tr(locale, "Back to Honey Chain", "हनी चेन पर वापस जाएँ")}</Link><button className="login-locale" type="button" onClick={() => setLocale(locale === "en" ? "hi" : "en")}>{locale === "en" ? "हिन्दी" : "English"}</button></div>
        <div className="login-form-wrap">
          <span className="eyebrow">{tr(locale, "Welcome back", "आपका स्वागत है")}</span>
          <h2>{tr(locale, "Sign in to your workspace", "अपने कार्यस्थान में साइन इन करें")}</h2>
          <p>{tr(locale, "Use your organisation credentials or choose an account below.", "अपने संगठन के विवरण का उपयोग करें या नीचे एक खाता चुनें।")}</p>
          <form className="login-form" onSubmit={submit}>
            <label className="field"><span>{tr(locale, "Email address", "ईमेल पता")}</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="name@organisation.in" autoComplete="email" required /></label>
            <label className="field"><span>{tr(locale, "Password", "पासवर्ड")}</span><div className="password-control"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder={tr(locale, "Enter your password", "अपना पासवर्ड दर्ज करें")} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="login-options"><label><input type="checkbox" /> Keep me signed in</label><button type="button" onClick={() => setError("Contact your organisation administrator to reset access securely.")}>Need help?</button></div>
            <button className="button button-primary button-block" type="submit">{tr(locale, "Sign in securely", "सुरक्षित साइन इन करें")} <ArrowRight size={18} /></button>
          </form>

          <div className="account-divider"><span>{tr(locale, "Available role accounts", "उपलब्ध भूमिका खाते")}</span></div>
          <div className="account-grid">
            {credentials.map((account) => (
              <article className="account-card" key={account.role}>
                <div className={`role-avatar role-${account.role}`}>{account.person.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                <div className="account-copy"><strong>{account.title}</strong><span>{account.person}</span><small>{account.email}</small></div>
                <button type="button" onClick={() => signIn(account.role, account.email)}>{tr(locale, "Use account", "खाता उपयोग करें")} <ArrowRight size={15} /></button>
              </article>
            ))}
          </div>
          <p className="credential-note">All role accounts use password <code>honey123</code></p>
        </div>
      </section>
    </main>
  );
}
