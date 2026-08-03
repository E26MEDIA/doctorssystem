"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type ConsultPayload = {
  clinic: {
    name: string;
    doctor: string;
    credentials: string;
  };
  appointment: {
    name: string;
    date: string;
    time: string;
    service: string;
    status: string;
    paymentStatus: string;
    paymentAmount: number;
    paymentAmountLabel: string;
    paymentRef: string | null;
  };
  meetLink: string;
  demo: boolean;
  canJoin: boolean;
};

export function ConsultRoom({ token }: { token: string }) {
  const [data, setData] = useState<ConsultPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [payment, setPayment] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/consult/${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to load consultation");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Network error loading consultation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPay(e: FormEvent) {
    e.preventDefault();
    setPaying(true);
    setPayMsg("");
    try {
      const res = await fetch(`/api/consult/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      });
      const json = await res.json();
      if (!res.ok) {
        setPayMsg(json.error || "Payment failed");
        return;
      }
      setPayMsg(json.message);
      await load();
    } catch {
      setPayMsg("Network error. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded-2xl border border-[var(--line)] bg-white p-8 text-[var(--muted)]">
        Loading your consultation room…
      </p>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-2xl border border-red-200 bg-white p-8 text-red-700">
        {error || "Consultation not found"}
      </p>
    );
  }

  const needsPay = data.appointment.paymentStatus !== "paid";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--forest)] shadow-[0_24px_60px_rgba(7,21,38,0.28)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">
              Video consult
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-white">
              {data.clinic.name}
            </p>
          </div>
          {data.demo && (
            <span className="rounded-full bg-[var(--brass)]/20 px-3 py-1 text-xs font-medium text-[var(--brass)]">
              Demo Meet
            </span>
          )}
        </div>

        <div className="relative aspect-[16/10] min-h-[320px] bg-[#06101f]">
          {!needsPay && joined ? (
            <>
              <iframe
                title="Google Meet"
                src={data.meetLink}
                className="absolute inset-0 h-full w-full border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="max-w-md text-xs text-white/75">
                  If Meet doesn’t load inside the frame (common), open it from
                  this page with the buttons.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={data.meetLink}
                    className="btn-primary !bg-[var(--teal)] !px-4 !py-2 text-sm"
                  >
                    Open Meet here
                  </a>
                  <a
                    href={data.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost !border-white/25 !px-4 !py-2 text-sm !text-white hover:!border-[var(--brass)] hover:!text-[var(--brass)]"
                  >
                    New tab
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl text-white">
                {data.clinic.doctor
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl text-white">
                  {data.clinic.doctor}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {data.clinic.credentials}
                </p>
              </div>
              {needsPay ? (
                <p className="max-w-sm text-sm text-white/70">
                  Pay the consultation fee to unlock Google Meet on this page.
                </p>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    className="btn-primary !bg-[var(--teal)]"
                    onClick={() => setJoined(true)}
                  >
                    Join Google Meet
                  </button>
                  <a
                    href={data.meetLink}
                    className="btn-ghost !border-white/25 !text-white hover:!border-[var(--brass)] hover:!text-[var(--brass)]"
                  >
                    Open Meet directly
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_16px_40px_rgba(10,27,51,0.06)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Your appointment
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Patient</dt>
              <dd className="font-medium text-[var(--ink)]">
                {data.appointment.name}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">When</dt>
              <dd className="font-medium text-[var(--ink)]">
                {data.appointment.date} · {data.appointment.time}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Service</dt>
              <dd className="font-medium text-[var(--ink)]">
                {data.appointment.service}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Payment</dt>
              <dd className="font-medium capitalize text-[var(--ink)]">
                {data.appointment.paymentStatus}
                {data.appointment.paymentAmount > 0
                  ? ` · ${data.appointment.paymentAmountLabel}`
                  : ""}
              </dd>
            </div>
          </dl>
        </div>

        {needsPay && (
          <form
            onSubmit={onPay}
            className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_16px_40px_rgba(10,27,51,0.06)]"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Pay consultation fee
              </p>
              <p className="display mt-1 text-3xl text-[var(--navy)]">
                {data.appointment.paymentAmountLabel}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Demo checkout — no real charge.
              </p>
            </div>
            <label className="field">
              <span>Name on card</span>
              <input
                required
                value={payment.cardName}
                onChange={(e) =>
                  setPayment({ ...payment, cardName: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Card number</span>
              <input
                required
                inputMode="numeric"
                value={payment.cardNumber}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    cardNumber: e.target.value.replace(/[^\d\s]/g, ""),
                  })
                }
                placeholder="4242 4242 4242 4242"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field">
                <span>Expiry</span>
                <input
                  required
                  value={payment.expiry}
                  onChange={(e) =>
                    setPayment({ ...payment, expiry: e.target.value })
                  }
                  placeholder="12/28"
                />
              </label>
              <label className="field">
                <span>CVV</span>
                <input
                  required
                  value={payment.cvv}
                  onChange={(e) =>
                    setPayment({
                      ...payment,
                      cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  placeholder="123"
                />
              </label>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={paying}>
              {paying ? "Processing…" : "Pay & unlock Meet"}
            </button>
            {payMsg && (
              <p className="text-sm text-[var(--teal)]" role="status">
                {payMsg}
              </p>
            )}
          </form>
        )}

        {!needsPay && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5 text-sm text-[var(--ink-soft)]">
            <p>
              Meet link is a demo placeholder. Replace{" "}
              <code className="text-[var(--teal)]">NEXT_PUBLIC_GOOGLE_MEET_URL</code>{" "}
              later with your real clinic room.
            </p>
            {data.appointment.paymentRef && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Ref: {data.appointment.paymentRef}
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
