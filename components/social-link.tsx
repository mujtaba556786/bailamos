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
  WhatsApp: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path fill="#fff" d="M12 4.8a7.2 7.2 0 0 0-6.2 10.9L4.8 19.2l3.6-.9A7.2 7.2 0 1 0 12 4.8zm0 1.7a5.5 5.5 0 1 1-2.9 10.2l-.2-.1-2.1.6.6-2-.1-.2A5.5 5.5 0 0 1 12 6.5zm-2.3 2.6c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3l-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.3 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.5l-.8-2c-.2-.5-.4-.5-.6-.5z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path fill="#fff" d="M13.4 22v-7.6h2.6l.4-3h-3V9.5c0-.9.3-1.5 1.5-1.5h1.6V5.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.7v3h2.6V22z" />
    </svg>
  ),
};

// One-colour icons (currentColor) for the outlined style on dark or red backgrounds.
const icons: Record<string, ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M19.6 6.9a4.8 4.8 0 0 1-3.5-4.5h-3.3v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .5 0 .8.1V9.5a6.2 6.2 0 1 0 5.4 6.1V9.3a8 8 0 0 0 4.7 1.5V7.5a4.8 4.8 0 0 1-1.2-.6z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15.1V8.9l5.3 3.1z" />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5zm0 1.8a7.7 7.7 0 1 1-4 14.3l-.3-.2-2.8.8.8-2.7-.2-.3A7.7 7.7 0 0 1 12 4.3zm-2.9 3.5c-.2 0-.5 0-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4l-.6-.3-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.5-.5.3-.5v-.5l-.9-2.2c-.2-.5-.5-.5-.7-.5z" />
    </svg>
  ),
};

// Brand logo on its own, for places like the share menu.
export function SocialLogo({ name, size = 22 }: { name: string; size?: number }) {
  const logo = logos[name];
  if (!logo) return null;
  return <span aria-hidden="true" style={{ width: size, height: size }} className="inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full">{logo}</span>;
}

export function SocialLink({ name, href, className = "", variant = "brand" }: { name: string; href: string; className?: string; variant?: "brand" | "outline" }) {
  const outline = variant === "outline";
  return (
    <a
      href={href}
      target="_blank"
      rel="me noopener noreferrer"
      aria-label={name}
      title={name}
      className={outline
        ? `inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#fff4e3]/40 text-[#fff4e3] transition hover:bg-[#fff4e3] hover:text-[#8f1f1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c878] focus-visible:ring-offset-2 focus-visible:ring-offset-[#8f1f1b] ${className}`
        : `inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:-translate-y-0.5 ${className}`}
    >
      {outline ? icons[name] : logos[name]}
    </a>
  );
}
