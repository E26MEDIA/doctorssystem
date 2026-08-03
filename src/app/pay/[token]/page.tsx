import type { Metadata } from "next";
import { PaymentCheckout } from "@/components/PaymentCheckout";

export const metadata: Metadata = {
  title: "Secure checkout",
  description: "Complete consultation fee payment for your virtual visit.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function PayPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-5xl px-5 pb-20 md:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
          Secure checkout
        </p>
        <h1 className="display mt-3 text-4xl md:text-5xl">
          Complete your payment
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          Your slot is reserved. Choose a payment method to confirm the visit
          and receive your Google Meet link with a receipt by email.
        </p>
        <div className="mt-10">
          <PaymentCheckout token={token} />
        </div>
      </section>
    </div>
  );
}
