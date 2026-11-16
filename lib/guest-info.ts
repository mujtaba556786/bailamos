// Guest-facing facts for the reservation page and the homepage FAQ.
// Everything comes from the operations config (address, phone, email, hours, group rule) or describes the
// real booking flow. Do not add prices, reviews or promises here that the data does not back up.
import type { OperationsConfig } from "./operations-config.ts";
import { groupNoteText } from "./booking-rules.ts";
import { openingHoursSentence } from "./opening-hours.ts";
import { openingHoursPrefix } from "./opening-state.ts";
import { berlinDate } from "./booking-policy.ts";
import type { Locale } from "./i18n";

type Restaurant = OperationsConfig["restaurant"];

// "+491738609300" → "+49 173 8609300" for reading; links keep the raw number.
export function displayPhone(phone: string) {
  const compact = phone.replace(/\s+/g, "");
  const match = compact.match(/^\+49(1\d{2})(\d{4,})$/);
  return match ? `+49 ${match[1]} ${match[2]}` : phone;
}

export function groupRule(restaurant: Restaurant, locale: Locale) {
  const { largeGroupNote, guestSelectLimit } = restaurant.reservation;
  return groupNoteText(locale === "en" ? largeGroupNote.en : largeGroupNote.de, guestSelectLimit);
}

export function bookingSteps(locale: Locale) {
  return locale === "en"
    ? [
        "Choose the date, time and number of guests.",
        "Enter your name, phone number and email address.",
        "You first receive a request confirmation. Your table is confirmed once the restaurant accepts the request. With your personal link you can manage or cancel the request later.",
      ]
    : [
        "Datum, Uhrzeit und Anzahl der Gäste wählen.",
        "Name, Telefonnummer und E-Mail-Adresse angeben.",
        "Sie erhalten zunächst eine Anfragebestätigung. Verbindlich ist der Tisch, sobald das Restaurant die Anfrage bestätigt. Mit Ihrem persönlichen Link können Sie die Anfrage später verwalten oder stornieren.",
      ];
}

// Homepage FAQ. One array: add a question by adding an entry. `parts` is the visible answer (text and tappable links),
// `answer` the same text as plain words for the FAQPage structured data, `actions` optional buttons under the answer.
export type FaqLink = { href: string; label: string };
export type FaqPart = string | FaqLink;
export type FaqAction = FaqLink & { kind: "primary" | "secondary" };
export type FaqItem = { question: string; parts: FaqPart[]; answer: string; actions: FaqAction[] };

const faqItem = (question: string, parts: FaqPart[], actions: FaqAction[] = []): FaqItem => ({
  question, parts, actions, answer: parts.map((part) => (typeof part === "string" ? part : part.label)).join(""),
});

export function homeFaq(restaurant: Restaurant, locale: Locale, today: string = berlinDate()): FaqItem[] {
  const phoneLabel = displayPhone(restaurant.contact.phone), email = restaurant.contact.email;
  const phone: FaqLink = { href: `tel:${restaurant.contact.phone.replace(/\s+/g, "")}`, label: phoneLabel };
  const mail: FaqLink = { href: `mailto:${email}`, label: email };
  const groupSize = restaurant.reservation.guestSelectLimit, hours = openingHoursPrefix(today, locale) + openingHoursSentence(restaurant.openingHours, locale);
  return locale === "en"
    ? [
        faqItem("How do I book a table?", ["Book online in under a minute: pick date, time and party size, then add your contact details. We'll confirm your request."], [
          { kind: "primary", href: "/en/reservieren", label: "Reserve a table" },
          { kind: "secondary", href: phone.href, label: `Call ${phoneLabel}` },
        ]),
        faqItem("Can I book for a larger group?", [`Yes — for groups of more than ${groupSize}, contact us directly so we can prepare the right table: `, mail, " or ", phone, "."]),
        faqItem("What are your opening hours?", [hours]),
      ]
    : [
        faqItem("Wie kann ich einen Tisch reservieren?", ["Online in weniger als einer Minute: Datum, Uhrzeit und Personenzahl wählen, dann Ihre Kontaktdaten angeben. Wir bestätigen Ihre Anfrage."], [
          { kind: "primary", href: "/reservieren", label: "Tisch reservieren" },
          { kind: "secondary", href: phone.href, label: `Anrufen: ${phoneLabel}` },
        ]),
        faqItem("Kann ich für eine größere Gruppe reservieren?", [`Ja – für Gruppen über ${groupSize} Personen kontaktieren Sie uns bitte direkt, damit wir den passenden Tisch vorbereiten können: `, mail, " oder ", phone, "."]),
        faqItem("Wann haben Sie geöffnet?", [hours]),
      ];
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}
