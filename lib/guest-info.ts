// Guest-facing facts for the reservation page and the homepage FAQ.
// Everything comes from the operations config (address, phone, email, hours, group rule) or describes the
// real booking flow. Do not add prices, reviews or promises here that the data does not back up.
import type { OperationsConfig } from "./operations-config.ts";
import { groupNoteText } from "./booking-rules.ts";
import { openingHoursSentence } from "./opening-hours.ts";
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

export function homeFaq(restaurant: Restaurant, locale: Locale) {
  const phone = displayPhone(restaurant.contact.phone), email = restaurant.contact.email;
  return locale === "en"
    ? [
        { question: "How do I book a table?", answer: `Online on our reservation page: choose the date, time and number of guests, then enter your contact details. The restaurant confirms your request. You can also book by phone on ${phone} or by email at ${email}.` },
        { question: "Can I book for a larger group?", answer: groupRule(restaurant, "en") },
        { question: "What are your opening hours?", answer: openingHoursSentence(restaurant.openingHours, "en") },
      ]
    : [
        { question: "Wie kann ich einen Tisch reservieren?", answer: `Online auf unserer Reservierungsseite: Datum, Uhrzeit und Gästezahl wählen, dann Ihre Kontaktdaten angeben. Das Restaurant bestätigt Ihre Anfrage. Sie können auch telefonisch unter ${phone} oder per E-Mail an ${email} reservieren.` },
        { question: "Kann ich für eine größere Gruppe reservieren?", answer: groupRule(restaurant, "de") },
        { question: "Wann haben Sie geöffnet?", answer: `Unsere Öffnungszeiten: ${openingHoursSentence(restaurant.openingHours, "de")}` },
      ];
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}
