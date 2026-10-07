import { Footer } from '../../components/footer';

export const metadata = {
  title: 'Terms & Conditions – Bailamos Waldcafé',
  description: 'Terms and conditions of Bailamos Waldcafé',
};

export default function TermsAndConditions() {
  return (
    <>
    <main className="min-h-screen bg-white px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">Terms & Conditions</h1>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">1. Scope</h2>
          <p>
            These terms and conditions apply to all services and reservations at Bailamos Waldcafé,
            Anton-Saefkow-Allee 2A, 14772 Brandenburg an der Havel.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">2. Reservations</h2>
          <p>
            Reservations can be made online, by phone at +49 173 86 09 300, or by email at
            info@bailamos-waldcafe.de. A reservation becomes binding only upon our confirmation.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">3. Cancellation Policy</h2>
          <p className="font-semibold">[TODO: Define your cancellation policy, e.g.:]</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Free cancellation up to 48 hours before the reserved time</li>
            <li>Cancellation less than 48 hours before: 50% of average bill amount</li>
            <li>No-show: 100% of average bill amount</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">4. Table Duration</h2>
          <p className="font-semibold">[TODO: Define table duration, e.g.:]</p>
          <p>
            Maximum table use duration:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Friday & Saturday: 2.5 hours</li>
            <li>Monday to Thursday: 3 hours</li>
            <li>Sunday: 2.5 hours</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">5. Payment</h2>
          <p>
            Payment is made directly at the restaurant. We accept:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Cash</li>
            <li>Card payment (EC/Credit card)</li>
            <li>[TODO: Add further payment methods]</li>
          </ul>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">6. Allergies & Intolerances</h2>
          <p>
            Please inform us of any known allergies and intolerances when making a reservation.
            We cannot completely exclude that allergens are present in our kitchen.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">7. House Rules</h2>
          <p>We reserve the right to refuse entry in case of:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Strong alcohol intoxication</li>
            <li>Grossly disrespectful behavior</li>
            <li>Violation of house and hygiene rules</li>
          </ul>
          <p className="mt-2">
            Smoking is not permitted inside the restaurant. Smoking on the terrace is allowed.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">8. Liability</h2>
          <p>
            We are not liable for loss, damage, or theft of personal items. Please take good care
            of your valuables or give them to our staff.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">9. Photography & Video Recording</h2>
          <p>
            Photography and video recording for private purposes are permitted. Commercial use
            requires our express permission.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">10. Changes to Terms & Conditions</h2>
          <p>
            We reserve the right to change these terms and conditions at any time. Changes will
            be published on our website. By making further reservations, you accept the current version.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold">11. Final Provisions</h2>
          <p>
            German law applies. The place of jurisdiction is Brandenburg an der Havel.
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
