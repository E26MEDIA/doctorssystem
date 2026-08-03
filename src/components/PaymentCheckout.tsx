"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type PayPayload = {
  clinic: { name: string; doctor: string };
  appointment: {
    name: string;
    email: string;
    date: string;
    time: string;
    timeLabel: string;
    service: string;
    paymentStatus: string;
    paymentAmountLabel: string;
    paymentRef: string | null;
    paymentMethod: string | null;
  };
  meetLink: string | null;
  meetCode: string | null;
  paid: boolean;
};

type Method = "upi" | "debit" | "credit" | "netbanking";

const METHODS: { id: Method; label: string; hint: string }[] = [
  { id: "upi", label: "UPI", hint: "GPay, PhonePe, Paytm & more" },
  { id: "debit", label: "Debit card", hint: "Visa, Mastercard, RuPay" },
  { id: "credit", label: "Credit card", hint: "Visa, Mastercard, Amex" },
  { id: "netbanking", label: "Net banking", hint: "All major Indian banks" },
];

const BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
];

export function PaymentCheckout({ token }: { token: string }) {
  const [data, setData] = useState<PayPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<Method>("upi");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    meetLink: string;
    meetCode: string;
    paymentRef: string;
    paymentAmountLabel: string;
    paymentMethod: string;
    emailSent: boolean;
    emailTo: string;
    emailDemo?: boolean;
  } | null>(null);
  const [form, setForm] = useState({
    upiId: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    bank: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pay/${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to load checkout");
        setData(null);
        return;
      }
      setData(json);
      if (json.paid && json.meetLink) {
        setResult({
          meetLink: json.meetLink,
          meetCode: json.meetCode || "",
          paymentRef: json.appointment.paymentRef || "",
          paymentAmountLabel: json.appointment.paymentAmountLabel,
          paymentMethod: json.appointment.paymentMethod || "Paid",
          emailSent: true,
          emailTo: json.appointment.email,
        });
      }
    } catch {
      setError("Network error loading checkout");
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
    setMessage("");
    try {
      const res = await fetch(`/api/pay/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, ...form }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Payment failed");
        return;
      }
      setResult({
        meetLink: json.meetLink,
        meetCode: json.meetCode,
        paymentRef: json.paymentRef,
        paymentAmountLabel: json.paymentAmountLabel,
        paymentMethod: json.paymentMethod,
        emailSent: Boolean(json.emailSent),
        emailTo: json.emailTo,
        emailDemo: Boolean(json.emailDemo),
      });
      setMessage(json.message);
      await load();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  async function copyMeet() {
    if (!result?.meetLink) return;
    try {
      await navigator.clipboard.writeText(result.meetLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded-2xl border border-[var(--line)] bg-white p-8 text-[var(--muted)]">
        Preparing secure checkout…
      </p>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8">
        <p className="text-rose-800">{error || "Checkout unavailable"}</p>
        <Link href="/#book" className="btn-ghost mt-6 inline-flex">
          Back to booking
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--teal)] bg-white p-6 shadow-[0_16px_40px_rgba(6,51,44,0.08)] md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
            Payment successful
          </p>
          <h2 className="display mt-2 text-3xl text-[var(--deep)]">
            Your consultation is confirmed
          </h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            {message ||
              `Receipt and Meet link sent to ${result.emailTo}.`}
          </p>

          <div className="mt-6 grid gap-3 rounded-xl bg-[var(--sand)] p-4 text-sm text-[var(--ink)] sm:grid-cols-2">
            <p>
              <span className="text-[var(--muted)]">Amount</span>
              <br />
              <strong>{result.paymentAmountLabel}</strong>
            </p>
            <p>
              <span className="text-[var(--muted)]">Reference</span>
              <br />
              <strong className="font-mono">{result.paymentRef}</strong>
            </p>
            <p>
              <span className="text-[var(--muted)]">Method</span>
              <br />
              <strong>{result.paymentMethod}</strong>
            </p>
            <p>
              <span className="text-[var(--muted)]">Email</span>
              <br />
              <strong>{result.emailTo}</strong>
            </p>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
              Google Meet
            </p>
            <p className="mt-2 font-mono text-xl font-semibold text-[var(--deep)]">
              {result.meetCode}
            </p>
            <p className="mt-2 break-all text-sm text-[var(--ink)]">
              {result.meetLink}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={copyMeet}>
                {copied ? "Copied!" : "Copy Meet link"}
              </button>
              <a
                href={result.meetLink}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                Open Meet
              </a>
            </div>
          </div>

          <p className="mt-6 text-sm text-[var(--ink-soft)]">
            {result.emailSent
              ? result.emailDemo
                ? `Demo mode: receipt + Meet details were logged for ${result.emailTo}. Connect SMTP later for real inbox delivery.`
                : `A copy of this receipt and your Meet link was emailed to ${result.emailTo}.`
              : "Keep a screenshot of this page for your records."}
          </p>
        </div>
        <Link href="/" className="btn-ghost inline-flex">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_16px_40px_rgba(6,51,44,0.06)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Order summary
        </p>
        <h2 className="display mt-2 text-3xl text-[var(--deep)]">
          Consultation fee
        </h2>
        <p className="mt-4 text-4xl font-semibold text-[var(--deep)]">
          {data.appointment.paymentAmountLabel}
        </p>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Patient</dt>
            <dd className="font-medium text-[var(--ink)]">
              {data.appointment.name}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Doctor</dt>
            <dd className="font-medium text-[var(--ink)]">{data.clinic.doctor}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">When</dt>
            <dd className="font-medium text-[var(--ink)]">
              {data.appointment.date} · {data.appointment.timeLabel}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Service</dt>
            <dd className="font-medium text-[var(--ink)]">
              {data.appointment.service}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
          Demo checkout — no real money is charged. After payment you receive
          the Google Meet link and a receipt by email.
        </p>
      </aside>

      <form
        onSubmit={onPay}
        className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_16px_40px_rgba(6,51,44,0.06)] md:p-8"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Payment method
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`visit-card text-left ${method === m.id ? "active" : ""}`}
            >
              <p className="font-medium text-[var(--deep)]">{m.label}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{m.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {method === "upi" && (
            <label className="field">
              <span>UPI ID</span>
              <input
                required
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="name@oksbi"
              />
            </label>
          )}

          {(method === "debit" || method === "credit") && (
            <>
              <label className="field">
                <span>Name on card</span>
                <input
                  required
                  value={form.cardName}
                  onChange={(e) =>
                    setForm({ ...form, cardName: e.target.value })
                  }
                  placeholder="As printed on card"
                />
              </label>
              <label className="field">
                <span>Card number</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={form.cardNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cardNumber: e.target.value.replace(/[^\d\s]/g, ""),
                    })
                  }
                  placeholder="4242 4242 4242 4242"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span>Expiry (MM/YY)</span>
                  <input
                    required
                    value={form.expiry}
                    onChange={(e) =>
                      setForm({ ...form, expiry: e.target.value })
                    }
                    placeholder="12/28"
                  />
                </label>
                <label className="field">
                  <span>CVV</span>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={form.cvv}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    placeholder="123"
                  />
                </label>
              </div>
            </>
          )}

          {method === "netbanking" && (
            <label className="field">
              <span>Select bank</span>
              <select
                required
                value={form.bank}
                onChange={(e) => setForm({ ...form, bank: e.target.value })}
              >
                <option value="">Choose a bank</option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={paying}>
          {paying
            ? "Processing…"
            : `Pay ${data.appointment.paymentAmountLabel} securely`}
        </button>

        {message && !result && (
          <p className="mt-4 text-sm text-rose-700" role="status">
            {message}
          </p>
        )}

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Demo gateway for client preview. Replace with Razorpay / PayU later.
        </p>
      </form>
    </div>
  );
}
