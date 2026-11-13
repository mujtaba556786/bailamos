// Turns structured data into text that is safe inside <script type="application/ld+json">.
// "<" and the line separators U+2028/U+2029 are written as escapes, so admin text such as
// "</script><script>..." can never close the tag or run code. The JSON stays identical for search engines.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), "g");
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), "g");

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(LINE_SEPARATOR, "\\u2028").replace(PARAGRAPH_SEPARATOR, "\\u2029");
}
