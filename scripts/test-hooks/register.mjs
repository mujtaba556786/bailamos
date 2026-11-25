// Test-only module hooks: lets node:test import the Worker code that uses Cloudflare/Next modules.
// - cloudflare:workers / cloudflare:sockets / next/server are replaced by small stubs.
// - lib/mail.ts (SMTP) is replaced by a recorder, so no real e-mail is ever sent.
import { register } from "node:module";
register("./loader.mjs", import.meta.url);
