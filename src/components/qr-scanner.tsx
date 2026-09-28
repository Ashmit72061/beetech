"use client";

import { ArrowRight, QrCode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type QrScannerProps = {
  onClose: () => void;
  onScan: (traceId: string) => void;
  demoTraceId: string;
};

function traceIdFromScan(value: string) {
  const candidate = value.trim();
  if (/^HC-[A-Z0-9-]+$/i.test(candidate)) return candidate.toUpperCase();
  try {
    const url = new URL(candidate, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== "/verify") return null;
    const trace = url.searchParams.get("trace");
    return trace && /^HC-[A-Z0-9-]+$/i.test(trace) ? trace.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function QrScanner({ onClose, onScan, demoTraceId }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("Starting camera…");

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    const video = videoRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    async function start() {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (!active || !video) return;
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
          if (!result || !active) return;
          const traceId = traceIdFromScan(result.getText());
          if (!traceId) {
            setMessage("That code is not a Honey Chain verification code.");
            return;
          }
          controls.stop();
          onScan(traceId);
        });
        stop = () => controls.stop();
        if (active) setMessage("Point your camera at a Honey Chain QR code.");
        else controls.stop();
      } catch {
        if (active) setMessage("Camera access is unavailable. Use the demo bottle or enter the trace ID manually.");
      }
    }
    void start();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      active = false;
      stop?.();
      if (video?.srcObject) (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      previouslyFocused?.focus();
    };
  }, [onClose, onScan]);

  return (
    <div className="scanner-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="scanner-dialog" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
        <header><div><span className="eyebrow">Bottle verification</span><h2 id="scanner-title">Scan the bottle QR code</h2></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close scanner"><X size={21} /></button></header>
        <div className="scanner-viewport">
          <video ref={videoRef} className="scanner-video" muted playsInline aria-label="Camera preview for QR scanning" />
          <span className="scanner-corner corner-top-left" /><span className="scanner-corner corner-top-right" /><span className="scanner-corner corner-bottom-left" /><span className="scanner-corner corner-bottom-right" />
        </div>
        <p role="status">{message}</p>
        <button className="button button-primary button-block scanner-demo-button" type="button" onClick={() => onScan(demoTraceId)}>Try demo bottle <ArrowRight size={18} /></button>
        <small><QrCode size={13} /> Camera scanning generally requires HTTPS (or localhost). Camera access is optional.</small>
      </section>
    </div>
  );
}
