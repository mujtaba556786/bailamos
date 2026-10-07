import { Footer } from '../../components/footer';

export const metadata = {
  title: 'Privacy Policy – Bailamos Waldcafé',
  description: 'Privacy policy of Bailamos Waldcafé',
};

export default function PrivacyPolicy() {
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">1. Responsible Party</h2>
          <p>
            Responsible for data processing:<br />
            <span className="font-semibold">[TODO: Name of operator]</span><br />
            Anton-Saefkow-Allee 2A<br />
            14772 Brandenburg an der Havel<br />
            Email: info@bailamos-waldcafe.de<br />
            Phone: +49 173 86 09 300
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">2. Data Collected</h2>
          <p>We collect the following data:</p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>Reservations:</strong> Name, phone, email, date, time, number of guests</li>
            <li><strong>Contact inquiries:</strong> Name, email, message</li>
            <li><strong>Website usage:</strong> IP address, browser type, visited pages (via Google Analytics with anonymization)</li>
            <li><strong>Cookies:</strong> Functional cookies for user experience</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">3. Legal Basis & Purpose</h2>
          <p>We process your data based on:</p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>GDPR Art. 6 Para 1 b):</strong> Fulfillment of contracts (reservations)</li>
            <li><strong>GDPR Art. 6 Para 1 a):</strong> Your consent (newsletter, marketing)</li>
            <li><strong>GDPR Art. 6 Para 1 f):</strong> Legitimate interests (website improvement, security)</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">4. Data Sharing</h2>
          <p>Your data will not be shared with third parties, except:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>To hosting providers (Cloudflare) for website operation</li>
            <li>To Google Analytics (with anonymization)</li>
            <li>If legally required</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">5. Storage Duration</h2>
          <p>
            Reservation data: [TODO: e.g., "6 months after reservation date"]<br />
            Contact inquiries: [TODO: e.g., "12 months"]<br />
            Website analytics: 14 months
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>Access:</strong> Know what data we store about you</li>
            <li><strong>Correction:</strong> Correct incorrect data</li>
            <li><strong>Deletion:</strong> Delete data (where legally applicable)</li>
            <li><strong>Restriction:</strong> Restrict processing</li>
            <li><strong>Portability:</strong> Receive data in structured format</li>
            <li><strong>Objection:</strong> Object to processing</li>
          </ul>
          <p className="mt-4">
            Contact us at info@bailamos-waldcafe.de to exercise these rights.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">7. Complaint</h2>
          <p>
            You have the right to lodge a complaint with the competent data protection authority:
            <br />
            <strong>State Data Protection Officer of Brandenburg</strong>
            <br />
            Alte Sparkasse, Saarmunder Straße 68<br />
            14195 Berlin<br />
            Phone: +49 (0)30 13 888 0
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">8. SSL Encryption</h2>
          <p>
            This website uses SSL encryption (https://). Your data is transmitted encrypted.
          </p>
        </section>

        <div className="border-t border-gray-300 pt-6 text-sm text-gray-600">
          <p>Last updated: October 2026</p>
        </div>
      </div>
    </main>
    <Footer lang="en" />
    </>
  );
}
