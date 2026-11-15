// Upload checks for /api/admin/media. The browser's claimed type is not trusted:
// the first bytes of the file must match it. SVG, HTML and every other type are refused.

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const UPLOAD_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" } as const;
// Homepage carousel images ("?purpose=hero"): photos only, AVIF allowed, at most 5 MB.
export const HERO_UPLOAD_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as const;
export const MAX_HERO_UPLOAD_BYTES = 5 * 1024 * 1024;
export type UploadType = keyof typeof UPLOAD_TYPES | keyof typeof HERO_UPLOAD_TYPES;

// What one upload request may contain. Unknown purposes get the general rules.
export function uploadPolicy(purpose: string | null) {
  return purpose === "hero"
    ? { types: HERO_UPLOAD_TYPES as Record<string, string>, maxBytes: MAX_HERO_UPLOAD_BYTES, typeText: "JPG, PNG, WebP oder AVIF", sizeText: "5 MB", folder: "marketing/hero" }
    : { types: UPLOAD_TYPES as Record<string, string>, maxBytes: MAX_UPLOAD_BYTES, typeText: "JPG, PNG, WebP, MP4 oder WebM", sizeText: "50 MB", folder: "marketing" };
}

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) => signature.every((value, index) => bytes[offset + index] === value);
const ascii = (bytes: Uint8Array, text: string, offset: number) => startsWith(bytes, [...text].map((char) => char.charCodeAt(0)), offset);

// The real type from the file's first bytes (at least 12 are needed), or null if it is none of the allowed ones.
export function detectMediaType(bytes: Uint8Array): UploadType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, "RIFF", 0) && ascii(bytes, "WEBP", 8)) return "image/webp";
  // AVIF is an ISO media file like MP4; its brand ("avif" / "avis") right after "ftyp" tells them apart.
  if (ascii(bytes, "ftyp", 4) && (ascii(bytes, "avif", 8) || ascii(bytes, "avis", 8))) return "image/avif";
  if (ascii(bytes, "ftyp", 4)) return "video/mp4";
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  return null;
}

// Reads the first bytes of a stream and returns them together with a stream of the whole file.
export async function peekStream(stream: ReadableStream<Uint8Array>, size = 16) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (length < size) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.byteLength;
  }
  const head = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { head.set(chunk, offset); offset += chunk.byteLength; }
  const rest = new ReadableStream<Uint8Array>({
    start(controller) { if (head.byteLength) controller.enqueue(head); },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) controller.close(); else controller.enqueue(value);
    },
    cancel(reason) { return reader.cancel(reason); },
  });
  return { head, stream: rest };
}
