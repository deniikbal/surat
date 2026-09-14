export function BrandLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1e3a8a" />
      <path d="M12 20a3.5 3.5 0 0 1 3.5-3.5h33A3.5 3.5 0 0 1 52 20v21a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 12 41z" fill="#ffffff" />
      <path d="M13.5 19 32 33l18.5-14" fill="none" stroke="#1e3a8a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 46.5l5.5 5.5 11-13" fill="none" stroke="#1e3a8a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 46.5l5.5 5.5 11-13" fill="none" stroke="#fac800" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
