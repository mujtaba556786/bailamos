import type { Metadata } from "next";
// Personal booking pages: never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function ReservationManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
