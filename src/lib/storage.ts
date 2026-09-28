"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Listing, Role } from "@/lib/data";

export type Session = {
  email: string;
  accountRole: Role;
  activeRole: Role;
  person: string;
  organisation: string;
  signedInAt: string;
};

export type ActivityRecord = {
  id: string;
  action: string;
  detail: string;
  actor: string;
  role: Role;
  timestamp: string;
};

export type AuditRequest = {
  id: string;
  name: string;
  email: string;
  reason: string;
  consent: boolean;
  traceId: string;
  timestamp: string;
  status: "Pending" | "Approved" | "Denied";
  decidedAt?: string;
  decidedBy?: string;
};

export type MarketplaceOrder = {
  id: string;
  category: Listing["category"];
  listingId: string;
  item: string;
  buyerEmail: string;
  buyerRole: Role;
  buyerOrganisation: string;
  seller: string;
  quantity: number;
  total: number;
  timestamp: string;
  auditEvent: string;
  status: "Confirmed";
};

export type LabRecord = {
  id: string;
  batchId: string;
  client: string;
  product: string;
  priority: "High" | "Normal";
  due: string;
  specimenId: string;
  received: string;
  seal: string;
  requester: string;
  pollen: string;
  moisture: string;
  adulteration: string;
  notes: string;
  certificateName: string;
  certificateSize: number;
  status: "Pending review" | "Approved" | "Rejected";
  decidedAt?: string;
};

const SESSION_KEY = "hc:session";
const LOCALE_KEY = "hc:locale";
let dataVersion = 0;

function emit(name: string) {
  window.dispatchEvent(new Event(name));
}

function subscribeSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("hc-session-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("hc-session-change", callback);
  };
}

function sessionSnapshot() {
  return localStorage.getItem(SESSION_KEY) || "";
}

export function useSession(): Session | null {
  // Authentication is server-owned. Public client screens do not infer identity.
  useSyncExternalStore(subscribeSession, sessionSnapshot, () => "");
  return null;
}

export function accountKey(session: Session, bucket: string, role = session.activeRole) {
  return `hc:account:${session.email}:${role}:${bucket}`;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  dataVersion += 1;
  emit("hc-data-change");
}

function subscribeData(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("hc-data-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("hc-data-change", callback);
  };
}

export function useStoredData<T>(key: string, fallback: T) {
  const version = useSyncExternalStore(subscribeData, () => dataVersion, () => 0);
  return useMemo(() => {
    void version;
    return readJson(key, fallback);
  }, [fallback, key, version]);
}

export type Locale = "en" | "hi";

function subscribeLocale(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("hc-locale-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("hc-locale-change", callback);
  };
}

function localeSnapshot(): Locale {
  return localStorage.getItem(LOCALE_KEY) === "hi" ? "hi" : "en";
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, localeSnapshot, () => "en" as Locale);
  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
  }, [locale]);
  const setLocale = (next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next);
    document.documentElement.lang = next === "hi" ? "hi" : "en";
    emit("hc-locale-change");
  };
  return { locale, setLocale };
}

export function tr(locale: Locale, english: string, hindi: string) {
  return locale === "hi" ? hindi : english;
}

export const AUDIT_REQUESTS_KEY = "hc:audit-requests";
export const CUSTOM_LISTINGS_KEY = "hc:marketplace:listings";

export function categoryAuditLabel(category: Listing["category"]) {
  if (category === "Hive/Colony Asset") return "Asset ownership order recorded";
  if (category === "Raw Honey Batch") return "Material custody transfer initiated";
  return "Terminal consumer sale recorded";
}
