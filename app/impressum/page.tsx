import { Footer } from '../../components/footer';

export const metadata = {
  title: 'Impressum – Bailamos Waldcafé',
  description: 'Rechtliche Informationen und Kontaktdaten von Bailamos Waldcafé',
};

export default function Impressum() {
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Impressum</h1>

        <section className="mb-8 space-y-4 text-gray-700">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Angaben gemäß § 5 TMG</h2>
            <p className="font-semibold">[TODO: Vollständiger Name des Betreibers]</p>
            <p>[TODO: Geschäftsform (z.B. Einzelunternehmen, GmbH)]</p>
            <p className="mt-4">
              Anton-Saefkow-Allee 2A<br />
              14772 Brandenburg an der Havel<br />
              Deutschland
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Kontakt</h2>
            <p>
              Telefon: +49 173 86 09 300<br />
              E-Mail: info@bailamos-waldcafe.de
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Umsatzsteuer-Identifikationsnummer</h2>
            <p>[TODO: USt-ID oder "Nicht registriert"]</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Verantwortliche Person</h2>
            <p>[TODO: Name der für den Inhalt verantwortlichen Person]</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Haftungshinweis</h2>
            <p className="text-sm">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </div>
        </section>
      </div>
    </main>
    <Footer lang="de" />
    </>
  );
}
