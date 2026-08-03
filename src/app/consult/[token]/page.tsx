import type { Metadata } from "next";
import { ConsultRoom } from "@/components/ConsultRoom";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Join video consult",
  description: "Pay and join your Meridian Health Google Meet consultation.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function ConsultPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Online consultation
          </p>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Your video visit
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
            Join Google Meet from this page after your consultation fee is paid.
            Demo mode for now — real Meet and payments can be configured later.
          </p>
        </Reveal>
        <div className="mt-10">
          <ConsultRoom token={token} />
        </div>
      </section>
    </div>
  );
}
