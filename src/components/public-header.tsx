"use client";

import Link from "next/link";
import { Globe2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { tr, useLocale } from "@/lib/storage";

export function PublicHeader() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Brand />
        <button className="mobile-menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`public-nav ${open ? "public-nav-open" : ""}`} aria-label="Main navigation">
          <Link href="/verify" onClick={() => setOpen(false)}>{tr(locale, "Verify bottle", "बोतल सत्यापित करें")}</Link>
          <Link href="/marketplace" onClick={() => setOpen(false)}>{tr(locale, "Marketplace", "बाज़ार")}</Link>
          <Link href="/#journey" onClick={() => setOpen(false)}>{tr(locale, "How it works", "यह कैसे काम करता है")}</Link>
          <button className="language-button" type="button" onClick={() => setLocale(locale === "en" ? "hi" : "en")} aria-label={tr(locale, "Switch to Hindi", "Switch to English")}>
            <Globe2 size={17} /> {locale === "hi" ? "English" : "हिन्दी"}
          </button>
          <Link className="button button-dark header-signin" href="/login">{tr(locale, "Sign in", "साइन इन")}</Link>
        </nav>
      </div>
    </header>
  );
}
