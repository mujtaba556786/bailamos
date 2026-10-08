import type { ReactNode } from "react";

const logos: Record<string, ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FED576" />
          <stop offset=".3" stopColor="#F47133" />
          <stop offset=".6" stopColor="#BC3081" />
          <stop offset="1" stopColor="#4C63D2" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <g transform="translate(-0.6 -0.6)" fill="#25F4EE">
        <path d="M19.6 6.9a4.8 4.8 0 0 1-3.5-4.5h-3.3v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .5 0 .8.1V9.5a6.2 6.2 0 1 0 5.4 6.1V9.3a8 8 0 0 0 4.7 1.5V7.5a4.8 4.8 0 0 1-1.2-.6z" />
      </g>
      <g transform="translate(0.6 0.6)" fill="#FE2C55">
        <path d="M19.6 6.9a4.8 4.8 0 0 1-3.5-4.5h-3.3v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .5 0 .8.1V9.5a6.2 6.2 0 1 0 5.4 6.1V9.3a8 8 0 0 0 4.7 1.5V7.5a4.8 4.8 0 0 1-1.2-.6z" />
      </g>
      <path fill="#000" d="M19.6 6.9a4.8 4.8 0 0 1-3.5-4.5h-3.3v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .5 0 .8.1V9.5a6.2 6.2 0 1 0 5.4 6.1V9.3a8 8 0 0 0 4.7 1.5V7.5a4.8 4.8 0 0 1-1.2-.6z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
      <path fill="#fff" d="M9.8 8.8v6.4l5.6-3.2z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path fill="#fff" d="M13.4 22v-7.6h2.6l.4-3h-3V9.5c0-.9.3-1.5 1.5-1.5h1.6V5.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.7v3h2.6V22z" />
    </svg>
  ),
};

export function SocialLink({ name, href, className = "" }: { name: string; href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="me noopener noreferrer"
      aria-label={name}
      title={name}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:-translate-y-0.5 ${className}`}
    >
      {logos[name]}
    </a>
  );
}
