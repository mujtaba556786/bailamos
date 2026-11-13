import { env } from "cloudflare:workers";
import { accessFor } from "../../../../lib/admin-auth.ts";
import { bookingResponse } from "../../../../lib/booking-http.ts";
// Tells the admin page which key it has and which tabs it may show.
export async function GET(request: Request) {
  return bookingResponse(async () => accessFor(request));
}
