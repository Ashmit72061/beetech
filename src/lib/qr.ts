export function publicAppOrigin() {
  const configured = process.env.PUBLIC_APP_ORIGIN || (process.env.DEMO_MODE === "true" ? "http://localhost:3001" : "");
  const origin = new URL(configured);
  if (!['http:', 'https:'].includes(origin.protocol)) throw new Error("Unsupported public application origin.");
  return origin;
}

export function verificationUrl(traceId: string) {
  return new URL(`/verify?trace=${encodeURIComponent(traceId)}`, publicAppOrigin()).toString();
}
