"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { SocialLogo } from "./social-link";

type Props = { title: string; text: string; url: string; label: string; copiedLabel: string; copyLabel: string; whatsappLabel: string; facebookLabel: string };

// Share options for an event: the device share sheet when available, otherwise
// WhatsApp, Facebook and copy-link buttons.
export function EventShare({ title, text, url, label, copiedLabel, copyLabel, whatsappLabel, facebookLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const message = encodeURIComponent(`${text} ${url}`);
  const encodedUrl = encodeURIComponent(url);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // The user cancelled, or sharing is blocked: fall back to the options.
      }
    }
    setOpen(current => !current);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const option = "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-[#10261e] hover:bg-[#fff8ec]";

  return (
    <div ref={wrapper} className="relative">
      <button type="button" onClick={handleShare} aria-label={label} aria-expanded={open} className="grid h-12 w-12 place-items-center rounded-full border border-[#10261e]/15">
        <Share2 size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-14 right-0 z-20 grid w-56 gap-1 rounded-2xl border border-[#10261e]/10 bg-white p-2 shadow-xl">
          <a role="menuitem" href={`https://wa.me/?text=${message}`} target="_blank" rel="noopener noreferrer" className={option}><SocialLogo name="WhatsApp" />{whatsappLabel}</a>
          <a role="menuitem" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={option}><SocialLogo name="Facebook" />{facebookLabel}</a>
          <button role="menuitem" type="button" onClick={copyLink} className={option}>
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      )}
    </div>
  );
}
