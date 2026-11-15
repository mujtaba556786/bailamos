import type { MarketingContent } from "../../lib/marketing-content";

export type SectionProps = {
  content: MarketingContent;
  language: "de" | "en";
  change: (mutator: (copy: MarketingContent) => void) => void;
  uploading: boolean;
  uploadMedia: (file: File, expect?: "image", purpose?: "hero") => Promise<{ url: string; kind: "image" | "video" } | null>;
};
