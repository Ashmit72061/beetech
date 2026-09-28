"use client";

import { Printer } from "lucide-react";

export function PrintLabelButton() {
  return <button className="button button-dark no-print" type="button" onClick={() => window.print()}><Printer size={17} /> Print QR labels</button>;
}
