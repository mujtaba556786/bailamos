import type { Metadata } from 'next';
import { localeAlternates } from '../../../lib/seo';
import { Footer } from '../../../components/footer';
import { env } from 'cloudflare:workers';
import { getOperations } from '../../../lib/operations-config.ts';
import { displayPhone } from '../../../lib/guest-info';


export const metadata: Metadata = {
  title: 'Legal Notice',
  alternates: localeAlternates('/impressum', '/en/impressum', 'en'),
  description: 'Legal information and contact details of Bailamos Waldcafé',
};

export default async function Impressum() {
  const phone = displayPhone((await getOperations(env.DB)).config.restaurant.contact.phone);
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Legal Notice</h1>

        <section className="mb-8 space-y-4 text-gray-700">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Information pursuant to § 5 TMG</h2>
            <p className="font-semibold">Shief Ullah</p>
            <p>Sole proprietorship (Einzelunternehmen)</p>
            <p className="mt-4">
              Anton-Saefkow-Allee 2A<br />
              14772 Brandenburg an der Havel<br />
              Germany
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Contact</h2>
            <p>
              Phone: {phone}<br />
              Email: info@bailamos-waldcafe.de
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Responsible Person</h2>
            <p>Shief Ullah</p>
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
