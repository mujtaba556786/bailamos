import type { Metadata } from 'next';
import { localeAlternates } from '../../lib/seo';
import { Footer } from '../../components/footer';
import { env } from 'cloudflare:workers';
import { getOperations } from '../../lib/operations-config.ts';
import { displayPhone } from '../../lib/guest-info';


export const metadata: Metadata = {
  title: 'AGB',
  alternates: localeAlternates('/agb', '/en/agb', 'de'),
  description: 'Allgemeine Geschäftsbedingungen von Bailamos Waldcafé',
};

export default async function AGB() {
  const phone = displayPhone((await getOperations(env.DB)).config.restaurant.contact.phone);
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Allgemeine Geschäftsbedingungen (AGB)</h1>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">1. Geltungsbereich</h2>
          <p>
            Diese AGB gelten für alle Leistungen und Reservierungen bei Bailamos Waldcafé,
            Anton-Saefkow-Allee 2A, 14772 Brandenburg an der Havel.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">2. Reservierungen</h2>
          <p>
            Reservierungen können online, per Telefon unter {phone} oder per E-Mail
            an info@bailamos-waldcafe.de vorgenommen werden. Eine Reservierung wird erst mit
            unserer Bestätigung verbindlich.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">3. Zahlung</h2>
          <p>
            Die Bezahlung erfolgt direkt im Restaurant. Wir akzeptieren:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Barzahlung</li>
            <li>Kartenzahlung (EC/Kreditkarte)</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">4. Allergien & Unverträglichkeiten</h2>
          <p>
            Bitte informieren Sie uns bei der Reservierung über bekannte Allergien und
            Unverträglichkeiten. Wir können nicht vollständig ausschließen, dass Allergene
            in unserer Küche vorhanden sind.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">5. Hausordnung</h2>
          <p>Wir behalten uns das Recht vor, den Eintritt zu verweigern bei:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Starker Alkoholeinfluss</li>
            <li>Grob unhöflichem Verhalten</li>
            <li>Verletzung von Haus- und Hygieneregeln</li>
          </ul>
          <p className="mt-2">
            Rauchen ist im Restaurant nicht gestattet. Das Rauchen auf der Terrasse ist erlaubt.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">6. Haftung</h2>
          <p>
            Wir haften nicht für Verlust, Beschädigung oder Diebstahl von persönlichen Gegenständen.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">7. Fotografien & Videoaufnahmen</h2>
          <p>
            Fotografieren und Videoaufnahmen zu privaten Zwecken sind erlaubt. Kommerzielle Nutzung
            bedarf unserer ausdrücklichen Genehmigung.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">8. Änderung der AGB</h2>
          <p>
            Wir behalten uns das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden
            auf unserer Website veröffentlicht. Bei weiteren Reservierungen akzeptieren Sie die
            aktuelle Fassung.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">9. Schlussbestimmungen</h2>
          <p>
            Es gilt deutsches Recht. Gerichtsstand ist Brandenburg an der Havel.
          </p>
        </section>

        <div className="border-t border-gray-300 pt-6 text-sm text-gray-600">
          <p>Stand: Oktober 2026</p>
        </div>
      </div>
    </main>
    <Footer lang="de" />
    </>
  );
}
