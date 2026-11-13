import { env } from "cloudflare:workers";
import { requireTab } from "../../../../lib/admin-auth.ts";
import { bookingResponse, readBody } from "../../../../lib/booking-http.ts";
import { BookingError } from "../../../../lib/booking-policy.ts";
import { getOperations, saveOperations } from "../../../../lib/operations-config.ts";
// Online-closed days for the reservations tab. Staff with the reservations tab may use this; it only changes blockedDates.
export async function GET(request: Request) {
  return bookingResponse(async () => {
    await requireTab(request, "reservations");
    const { config, version } = await getOperations(env.DB);
    return { blockedDates: config.restaurant.reservation.blockedDates, version };
  });
}
export async function PUT(request: Request) {
  return bookingResponse(async () => {
    await requireTab(request, "reservations");
    const body = await readBody(request, 20000);
    if (!body || !Array.isArray(body.blockedDates) || !Number.isInteger(body.version)) throw new BookingError(400, "INVALID_CONFIG", "Ungültige Angaben.");
    const { config } = await getOperations(env.DB);
    const next = { ...config, restaurant: { ...config.restaurant, reservation: { ...config.restaurant.reservation, blockedDates: body.blockedDates } } };
    if (!env.DB) throw new Error("Missing DB");
    const saved = await saveOperations(env.DB, next, body.version);
    return { blockedDates: saved.config.restaurant.reservation.blockedDates, version: saved.version };
  });
}
