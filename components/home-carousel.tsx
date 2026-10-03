"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export type HighlightSlide = {
  id: string;
  kind: "news" | "event" | "dish";
  label: string;
  title: string;
  text: string;
  meta?: string;
  image: string;
  href: string;
  cta: string;
};

const INTERVAL_MS = 6500;

export function HomeCarousel({ slides, labels }: { slides: HighlightSlide[]; labels: { previous: string; next: string; pause: string; play: string; region: string; slide: string } }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Autoplay stops for reduced motion, explicit pause, and while the visitor hovers or focuses the carousel.
  const autoplay = count > 1 && !paused && !hovering && !reducedMotion;
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, index, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="highlight-carousel relative isolate h-[calc(100svh-5rem)] min-h-[34rem] max-h-[56rem] overflow-hidden bg-[#09130f]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHovering(false); }}
      onKeyDown={event => { if (event.key === "ArrowLeft") go(index - 1); if (event.key === "ArrowRight") go(index + 1); }}
      onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={event => { if (touchStart.current === null) return; const delta = event.changedTouches[0].clientX - touchStart.current; touchStart.current = null; if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1)); }}
    >
      <div aria-live={autoplay ? "off" : "polite"}>
        {slides.map((slide, position) => {
          const active = position === index;
          return (
            <article
              key={slide.id}
              aria-roledescription="slide"
              aria-label={`${position + 1} ${labels.slide} ${count}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${active ? "z-10 opacity-100" : "z-0 opacity-0"}`}
            >
              <div className={`absolute inset-0 ${active && !reducedMotion ? "carousel-kenburns" : ""}`}>
                <Image src={slide.image} alt="" fill priority={position === 0} sizes="100vw" className="object-cover" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,13,10,.9)_0%,rgba(5,13,10,.62)_42%,rgba(5,13,10,.1)_78%)]" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#09130f] via-[#09130f]/40 to-transparent" />
              <div className="relative mx-auto flex h-full w-full max-w-[1440px] items-end px-5 pb-28 sm:px-10 lg:px-16 lg:pb-32">
                <div className={`max-w-2xl transition duration-1000 ${active ? "translate-y-0 opacity-100 delay-300" : "translate-y-6 opacity-0"}`}>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[.7rem] font-bold uppercase tracking-[.2em] ${slide.kind === "event" ? "bg-[#a52520] text-white" : slide.kind === "dish" ? "bg-[#efc67e] text-[#10261e]" : "bg-[#f5e8d3] text-[#10261e]"}`}>{slide.label}</span>
                  {slide.meta && <p className="mt-5 text-sm font-semibold uppercase tracking-[.18em] text-[#efc67e]">{slide.meta}</p>}
                  <h2 className="font-display mt-4 text-[clamp(2.8rem,6.4vw,6.4rem)] leading-[.86] tracking-[-.04em] text-[#f5e8d3]">{slide.title}</h2>
                  {slide.text && <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">{slide.text}</p>}
                  <a href={slide.href} tabIndex={active ? 0 : -1} className="button-primary mt-8">{slide.cta} <ArrowRight size={18} /></a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 pb-8 sm:px-10 lg:px-16">
          <div className="flex items-center gap-2">
            {slides.map((slide, position) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(position)}
                aria-label={`${position + 1} ${labels.slide} ${count}: ${slide.title}`}
                aria-current={position === index}
                className="group relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-all"
                style={{ width: position === index ? "2.75rem" : "1.1rem" }}
              >
                {position === index && <span key={`${index}-${autoplay}`} className={`absolute inset-y-0 left-0 rounded-full bg-[#efc67e] ${autoplay ? "carousel-progress" : "w-full"}`} style={{ animationDuration: `${INTERVAL_MS}ms` }} />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? labels.play : labels.pause} className="carousel-control">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
            {/* Phones swipe instead; .carousel-control sets display, so hide a wrapper. */}
            <div className="hidden items-center gap-2 sm:flex">
              <button type="button" onClick={() => go(index - 1)} aria-label={labels.previous} className="carousel-control"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => go(index + 1)} aria-label={labels.next} className="carousel-control"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
