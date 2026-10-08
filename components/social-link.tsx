import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-6 w-6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
      <path d="M19.6 6.9a4.8 4.8 0 0 1-3.5-4.5h-3.3v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .5 0 .8.1V9.5a6.2 6.2 0 1 0 5.4 6.1V9.3a8 8 0 0 0 4.7 1.5V7.5a4.8 4.8 0 0 1-1.2-.6z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
      <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.6 15.1V8.9l5.8 3.1z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
      <path d="M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4V11H7.5v3.5H10V22h3.5v-7.5h2.7l.5-3.5h-3.2V8.7c0-.4.3-.7.5-.7z" />
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
      className={`inline-flex transition-opacity hover:opacity-100 ${className}`}
    >
      {icons[name]}
    </a>
  );
}
