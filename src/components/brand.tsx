import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Honey Chain home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <path d="M24 3 41.3 13v20L24 43 6.7 33V13L24 3Z" fill="currentColor" />
          <path d="M24 10.2 35 16.6v12.8l-11 6.4-11-6.4V16.6L24 10.2Z" fill="#fff8e8" />
          <path d="M24 16.7 29.7 20v6.6L24 30l-5.7-3.4V20l5.7-3.3Z" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span>
          <strong>Honey Chain</strong>
          <small>Trusted from hive to home</small>
        </span>
      )}
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
