import { Footer } from '../../components/footer';

export const metadata = {
  title: 'Datenschutz – Bailamos Waldcafé',
  description: 'Datenschutzerklärung von Bailamos Waldcafé',
};

export default function Datenschutz() {
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung:<br />
            <span className="font-semibold">[TODO: Name des Betreibers]</span><br />
            Anton-Saefkow-Allee 2A<br />
            14772 Brandenburg an der Havel<br />
            E-Mail: info@bailamos-waldcafe.de<br />
            Telefon: +49 173 86 09 300
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">2. Erhobene Daten</h2>
          <p>Wir erheben folgende Daten:</p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>Reservierungen:</strong> Name, Telefon, E-Mail, Datum, Uhrzeit, Personenanzahl</li>
            <li><strong>Kontaktanfragen:</strong> Name, E-Mail, Nachrichtentext</li>
            <li><strong>Website-Nutzung:</strong> IP-Adresse, Browser-Typ, Seiten die besucht wurden (via Google Analytics mit Anonymisierung)</li>
            <li><strong>Cookies:</strong> Funktionale Cookies für Nutzungserlebnis</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">3. Rechtsgrundlage & Zweck</h2>
          <p>
            Wir verarbeiten Ihre Daten basierend auf:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>DSGVO Art. 6 Abs. 1 b):</strong> Erfüllung von Verträgen (Reservierungen)</li>
            <li><strong>DSGVO Art. 6 Abs. 1 a):</strong> Ihre Einwilligung (Newsletter, Marketing)</li>
            <li><strong>DSGVO Art. 6 Abs. 1 f):</strong> Berechtigte Interessen (Website-Verbesserung, Sicherheit)</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">4. Datenweitergabe</h2>
          <p>
            Ihre Daten werden nicht an Dritte weitergegeben, außer:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>An Hosting-Provider (Cloudflare) für Website-Betrieb</li>
            <li>An Google Analytics (mit Anonymisierung)</li>
            <li>Wenn gesetzlich verpflichtet</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">5. Speicherdauer</h2>
          <p>
            Reservierungsdaten: [TODO: z.B. "6 Monate nach Reservierungsdatum"]<br />
            Kontaktanfragen: [TODO: z.B. "12 Monate"]<br />
            Website-Analyse: 14 Monate
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">6. Ihre Rechte</h2>
          <p>Sie haben das Recht auf:</p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>Auskunft:</strong> Welche Daten wir über Sie gespeichert haben</li>
            <li><strong>Berichtigung:</strong> Falsche Daten korrigieren</li>
            <li><strong>Löschung:</strong> Daten löschen (sofern gesetzlich möglich)</li>
            <li><strong>Einschränkung:</strong> Verarbeitung einschränken</li>
            <li><strong>Portabilität:</strong> Daten in strukturiertem Format erhalten</li>
            <li><strong>Widerspruch:</strong> Verarbeitung widersprechen</li>
          </ul>
          <p className="mt-4">
            Kontaktieren Sie uns unter info@bailamos-waldcafe.de, um diese Rechte auszuüben.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">7. Beschwerde</h2>
          <p>
            Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren:
            <br />
            <strong>Landesbeauftragte für Datenschutz und Informationsfreiheit Brandenburg</strong>
            <br />
            Alte Sparkasse, Saarmunder Straße 68<br />
            14195 Berlin<br />
            Tel.: +49 (0)30 13 888 0
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">8. SSL-Verschlüsselung</h2>
          <p>
            Diese Website verwendet SSL-Verschlüsselung (https://). Ihre Daten werden verschlüsselt übertragen.
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
