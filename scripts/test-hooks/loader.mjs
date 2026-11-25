const stub = (name) => new URL(`./stubs/${name}`, import.meta.url).href;
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") return { url: stub("cloudflare-workers.mjs"), shortCircuit: true };
  if (specifier === "cloudflare:sockets") return { url: stub("cloudflare-sockets.mjs"), shortCircuit: true };
  if (specifier === "next/server") return { url: stub("next-server.mjs"), shortCircuit: true };
  if (specifier === "./mail.ts" && context.parentURL?.endsWith("/lib/reservation-mail.ts")) return { url: stub("mail.mjs"), shortCircuit: true };
  return nextResolve(specifier, context);
}
