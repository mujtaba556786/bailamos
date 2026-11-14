// Info block under the booking form: address, opening hours, how booking works, group rule.
// Rendered on the server so search engines see the text; all facts come from the operations config.
import { Clock3, MapPin, Phone, Users } from "lucide-react";
import type { OperationsConfig } from "../lib/operations-config.ts";
import { groupedOpeningHours } from "../lib/opening-hours";
import { bookingSteps, displayPhone, groupRule } from "../lib/guest-info";
import type { Locale } from "../lib/i18n";

export function ReservationInfo({ restaurant, locale }: { restaurant: OperationsConfig["restaurant"]; locale: Locale }) {
  const L = (de: string, en: string) => (locale === "en" ? en : de);
  const { address, phone, email } = restaurant.contact;
  return (
    <section aria-labelledby="reservation-info" className="mx-auto mt-14 max-w-6xl">
      <h2 id="reservation-info" className="font-display text-3xl sm:text-4xl">{L("Gut zu wissen vor Ihrem Besuch", "Good to know before your visit")}</h2>
      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#c68a3b]/25 bg-white/5 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} className="text-[#efc67e]" />{L("Adresse", "Address")}</h3>
          <p className="mt-3 leading-7 text-white/70">{restaurant.name}<br />{address}</p>
          <h3 className="mt-6 flex items-center gap-2 text-lg font-semibold"><Clock3 size={18} className="text-[#efc67e]" />{L("Öffnungszeiten", "Opening hours")}</h3>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 leading-7 text-white/70">
            {groupedOpeningHours(restaurant.openingHours, locale).map((row) => <div key={row.days} className="contents"><dt>{row.days}</dt><dd>{row.hours}</dd></div>)}
          </dl>
        </div>
        <div className="rounded-[1.5rem] border border-[#c68a3b]/25 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">{L("So reservieren Sie", "How to book")}</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 leading-7 text-white/70">
            {bookingSteps(locale).map((step) => <li key={step}>{step}</li>)}
          </ol>
          <h3 className="mt-6 flex items-center gap-2 text-lg font-semibold"><Users size={18} className="text-[#efc67e]" />{L("Gruppen", "Groups")}</h3>
          <p className="mt-3 leading-7 text-white/70">{groupRule(restaurant, locale)}</p>
          <h3 className="mt-6 flex items-center gap-2 text-lg font-semibold"><Phone size={18} className="text-[#efc67e]" />{L("Telefon & E-Mail", "Phone & email")}</h3>
          <p className="mt-3 leading-7 text-white/70"><a href={`tel:${phone.replace(/\s+/g, "")}`} className="underline underline-offset-4">{displayPhone(phone)}</a><br /><a href={`mailto:${email}`} className="underline underline-offset-4">{email}</a></p>
        </div>
      </div>
    </section>
  );
}
