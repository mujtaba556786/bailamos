import { env } from "cloudflare:workers";
import { ReservationExperience } from "../../components/reservation-experience";
import { ReservationInfo } from "../../components/reservation-info";
import { getOperations } from "../../lib/operations-config.ts";

export default async function Reservation() {
  const { config } = await getOperations(env.DB);
  return <ReservationExperience locale="de"><ReservationInfo restaurant={config.restaurant} locale="de" /></ReservationExperience>;
}
