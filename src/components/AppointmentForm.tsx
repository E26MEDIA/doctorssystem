"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ServiceOption = { title: string; slug: string };
type Status = "idle" | "loading" | "success" | "error";
type VisitType = "in_clinic" | "online";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AppointmentForm() {
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [date, setDate] = useState("");
  const [booked, setBooked] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [dayBlocked, setDayBlocked] = useState(false);
  const [videoFee, setVideoFee] = useState(799);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    time: "",
    service: "",
    notes: "",
    visitType: "in_clinic" as VisitType,
  });
  const [payment, setPayment] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const online = form.visitType === "online";

  const prefersVideoService = useMemo(() => {
    const selected = services.find((s) => s.title === form.service);
    return selected?.slug === "teleconsult" || /video|tele/i.test(form.service);
  }, [form.service, services]);

  useEffect(() => {
    async function boot() {
      const res = await fetch("/api/clinic");
      const data = await res.json();
      const list: ServiceOption[] = (data.services ?? []).map(
        (s: { title: string; slug: string }) => ({
          title: s.title,
          slug: s.slug,
        }),
      );
      setServices(list);
      setTimeSlots(data.timeSlots ?? []);
      setBookingEnabled(data.clinic?.bookingEnabled ?? true);
      if (typeof data.clinic?.videoConsultFee === "number") {
        setVideoFee(data.clinic.videoConsultFee);
      }
      const lead = data.clinic?.minLeadDays ?? 1;
      const maxAdv = data.clinic?.maxAdvanceDays ?? 60;
      const minD = new Date();
      minD.setDate(minD.getDate() + lead);
      const maxD = new Date();
      maxD.setDate(maxD.getDate() + maxAdv);
      const minStr = minD.toISOString().slice(0, 10);
      const maxStr = maxD.toISOString().slice(0, 10);
      setMinDate(minStr);
      setMaxDate(maxStr);
      setDate(minStr);
      if (list[0]) {
        setForm((f) => ({ ...f, service: list[0].title }));
      }
    }
    boot();
  }, []);

  useEffect(() => {
    if (prefersVideoService && form.visitType !== "online") {
      setForm((f) => ({ ...f, visitType: "online" }));
    }
  }, [prefersVideoService, form.visitType]);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/appointments?date=${date}`);
        const data = await res.json();
        if (cancelled) return;
        setBooked(data.booked ?? []);
        setDayBlocked(Boolean(data.blocked));
        if (data.timeSlots?.length) setTimeSlots(data.timeSlots);
        if (data.minDate) setMinDate(data.minDate);
        if (data.maxDate) setMaxDate(data.maxDate);
        if (typeof data.bookingEnabled === "boolean") {
          setBookingEnabled(data.bookingEnabled);
        }
        if (typeof data.videoConsultFee === "number") {
          setVideoFee(data.videoConsultFee);
        }
      } catch {
        if (!cancelled) setBooked([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (online) {
      const digits = payment.cardNumber.replace(/\s+/g, "");
      if (
        payment.cardName.trim().length < 2 ||
        !/^\d{12,19}$/.test(digits) ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.expiry.trim()) ||
        !/^\d{3,4}$/.test(payment.cvv.trim())
      ) {
        setStatus("error");
        setMessage(
          "Enter card details to pay the consultation fee before you get your Meet link.",
        );
        return;
      }
    }

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date,
          ...(online ? { payment } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message);
      setJoinUrl(data.joinUrl ?? null);
      setDone(true);
      setBooked((prev) => (form.time ? [...prev, form.time] : prev));
      setForm((f) => ({
        ...f,
        name: "",
        email: "",
        phone: "",
        time: "",
        notes: "",
      }));
      setPayment({ cardName: "", cardNumber: "", expiry: "", cvv: "" });
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!bookingEnabled) {
    return (
      <p className="rounded-xl border border-[var(--line)] bg-[var(--mist)] p-6 text-[var(--ink-soft)]">
        Online booking is temporarily closed. Please call the clinic or use the
        contact form.
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[var(--teal)]/30 bg-[color-mix(in_oklab,var(--teal)_10%,white)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
            {joinUrl ? "Paid · consult ready" : "Request received"}
          </p>
          <p className="mt-2 text-[var(--ink)]">{message}</p>
          {joinUrl && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={joinUrl} className="btn-primary">
                Open my Google Meet page
              </Link>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setDone(false);
                  setStatus("idle");
                  setMessage("");
                  setJoinUrl(null);
                }}
              >
                Book another
              </button>
            </div>
          )}
          {!joinUrl && (
            <button
              type="button"
              className="btn-ghost mt-5"
              onClick={() => {
                setDone(false);
                setStatus("idle");
                setMessage("");
              }}
            >
              Book another
            </button>
          )}
        </div>
        {joinUrl && (
          <p className="text-sm text-[var(--muted)]">
            Save this link for your appointment time — payment is already done:{" "}
            <Link href={joinUrl} className="text-[var(--teal)] underline">
              {joinUrl}
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Visit type
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "in_clinic" as const,
                title: "In clinic",
                blurb: "Visit Indiranagar in person — no online fee",
              },
              {
                value: "online" as const,
                title: "Online video",
                blurb: `Must pay ${formatInr(videoFee)} here to get Meet link`,
              },
            ] as const
          ).map((opt) => {
            const active = form.visitType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, visitType: opt.value })}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-[var(--teal)] bg-[color-mix(in_oklab,var(--teal)_10%,white)] shadow-[0_8px_24px_rgba(18,184,134,0.12)]"
                    : "border-[var(--line)] bg-white hover:border-[var(--teal)]/50"
                }`}
              >
                <p className="font-medium text-[var(--ink)]">{opt.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{opt.blurb}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="field">
          <span>Full name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@email.com"
          />
        </label>
        <label className="field">
          <span>Phone</span>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 …"
          />
        </label>
        <label className="field">
          <span>Service</span>
          <select
            required
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value })}
          >
            {services.length === 0 && <option value="">Loading…</option>}
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Preferred date</span>
          <input
            required
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setForm({ ...form, time: "" });
            }}
          />
        </label>
        <label className="field">
          <span>Preferred time</span>
          <select
            required
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            disabled={dayBlocked}
          >
            <option value="">
              {dayBlocked ? "Clinic closed this day" : "Select a slot"}
            </option>
            {!dayBlocked &&
              timeSlots.map((slot) => {
                const taken = booked.includes(slot);
                return (
                  <option key={slot} value={slot} disabled={taken}>
                    {slot}
                    {taken ? " (taken)" : ""}
                  </option>
                );
              })}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Notes (optional)</span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Symptoms, goals, or anything we should know before your visit."
        />
      </label>

      {online && (
        <div className="space-y-4 rounded-xl border-2 border-[var(--teal)] bg-[color-mix(in_oklab,var(--teal)_8%,white)] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
              Pay consultation fee (required)
            </p>
            <p className="display mt-1 text-3xl text-[var(--navy)]">
              {formatInr(videoFee)}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Card payment is required on this form. You only get the Google Meet
              join link after payment succeeds. Demo — no real charge (use{" "}
              <strong>4242 4242 4242 4242</strong>).
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field md:col-span-2">
              <span>Name on card</span>
              <input
                required={online}
                value={payment.cardName}
                onChange={(e) =>
                  setPayment({ ...payment, cardName: e.target.value })
                }
                placeholder="As printed on card"
              />
            </label>
            <label className="field md:col-span-2">
              <span>Card number</span>
              <input
                required={online}
                inputMode="numeric"
                autoComplete="cc-number"
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
            <label className="field">
              <span>Expiry (MM/YY)</span>
              <input
                required={online}
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
                required={online}
                inputMode="numeric"
                autoComplete="cc-csc"
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
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full md:w-auto"
        disabled={status === "loading" || dayBlocked}
      >
        {status === "loading"
          ? "Processing…"
          : online
            ? `Pay ${formatInr(videoFee)} & get Meet link`
            : "Request appointment"}
      </button>

      {message && (
        <p
          className={`text-sm ${
            status === "success" ? "text-[var(--teal)]" : "text-red-700"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
