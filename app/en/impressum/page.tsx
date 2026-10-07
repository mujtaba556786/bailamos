import { Footer } from '../../components/footer';

export const metadata = {
  title: 'Legal Notice – Bailamos Waldcafé',
  description: 'Legal information and contact details of Bailamos Waldcafé',
};

export default function Impressum() {
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Legal Notice</h1>

        <section className="mb-8 space-y-4 text-gray-700">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Information pursuant to § 5 TMG</h2>
            <p className="font-semibold">[TODO: Full name of operator]</p>
            <p>[TODO: Business form (e.g., Sole proprietorship, GmbH)]</p>
            <p className="mt-4">
              Anton-Saefkow-Allee 2A<br />
              14772 Brandenburg an der Havel<br />
              Germany
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Contact</h2>
            <p>
              Phone: +49 173 86 09 300<br />
              Email: info@bailamos-waldcafe.de
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">VAT ID</h2>
            <p>[TODO: VAT ID or "Not registered"]</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Responsible Person</h2>
            <p>[TODO: Name of person responsible for content]</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Disclaimer</h2>
            <p className="text-sm">
              Despite careful content control, we assume no liability for the contents of external links.
              The operators of the linked pages are solely responsible for their content.
            </p>
          </div>
        </section>
      </div>
    </main>
    <Footer lang="en" />
    </>
  );
}
