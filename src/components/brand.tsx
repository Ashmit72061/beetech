import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand ${compact ? "brand-compact" : ""}`} href="/" aria-label="Honey Chain home, by BeeTech">
      <Image className="brand-logo" src="/BeeTech.png" alt="BeeTech, Honey Chain platform" width={176} height={48} priority />
    </Link>
  );
}

export function HexPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`hex-pattern ${className}`} viewBox="0 0 260 220" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="m65 5 43 25v50l-43 25L22 80V30L65 5Z" />
        <path d="m151 5 43 25v50l-43 25-43-25V30l43-25Z" />
        <path d="m108 80 43 25v50l-43 25-43-25v-50l43-25Z" />
        <path d="m194 80 43 25v50l-43 25-43-25v-50l43-25Z" />
        <path d="m65 155 43 25v50l-43 25-43-25v-50l43-25Z" />
      </g>
    </svg>
  );
}
