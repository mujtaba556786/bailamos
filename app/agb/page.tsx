import { Footer } from '../components/footer';

export const metadata = {
  title: 'AGB – Bailamos Waldcafé',
  description: 'Allgemeine Geschäftsbedingungen von Bailamos Waldcafé',
};

export default function AGB() {
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
            Reservierungen können online, per Telefon unter +49 173 86 09 300 oder per E-Mail
            an info@bailamos-waldcafe.de vorgenommen werden. Eine Reservierung wird erst mit
            unserer Bestätigung verbindlich.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">3. Stornierungsbedingungen</h2>
          <p className="font-semibold">[TODO: Definieren Sie Ihre Stornierungspolitik, z.B.:]</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Kostenlose Stornierung bis 48 Stunden vor der reservierten Zeit</li>
            <li>Bei Stornierung weniger als 48 Stunden vorher: 50% des durchschnittlichen Rechnungsbetrages</li>
            <li>Bei Nichterscheinen (No-Show): 100% des durchschnittlichen Rechnungsbetrages</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">4. Tischdauer</h2>
          <p className="font-semibold">[TODO: Definieren Sie die Tischdauer, z.B.:]</p>
          <p>
            Die maximale Tischnutzungsdauer beträgt:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Freitag & Samstag: 2,5 Stunden</li>
            <li>Montag bis Donnerstag: 3 Stunden</li>
            <li>Sonntag: 2,5 Stunden</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">5. Zahlung</h2>
          <p>
            Die Bezahlung erfolgt direkt im Restaurant. Wir akzeptieren:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Barzahlung</li>
            <li>Kartenzahlung (EC/Kreditkarte)</li>
            <li>[TODO: Weitere Zahlungsarten hinzufügen]</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">6. Allergien & Unverträglichkeiten</h2>
          <p>
            Bitte informieren Sie uns bei der Reservierung über bekannte Allergien und
            Unverträglichkeiten. Wir können nicht vollständig ausschließen, dass Allergene
            in unserer Küche vorhanden sind.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">7. Hausordnung</h2>
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
          <h2 className="text-xl font-semibold">8. Haftung</h2>
          <p>
            Wir haften nicht für Verlust, Beschädigung oder Diebstahl von persönlichen Gegenständen.
            Bitte bewahren Sie Ihre Wertsachen sorgfältig auf oder geben Sie diese an unseren Service.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">9. Fotografien & Videoaufnahmen</h2>
          <p>
            Fotografieren und Videoaufnahmen zu privaten Zwecken sind erlaubt. Kommerzielle Nutzung
            bedarf unserer ausdrücklichen Genehmigung.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">10. Änderung der AGB</h2>
          <p>
            Wir behalten uns das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden
            auf unserer Website veröffentlicht. Bei weiteren Reservierungen akzeptieren Sie die
            aktuelle Fassung.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">11. Schlussbestimmungen</h2>
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
