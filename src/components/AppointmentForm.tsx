"use client";

import { FormEvent, useEffect, useState } from "react";

type ServiceOption = { title: string; slug: string };

type Status = "idle" | "loading" | "success" | "error";

export function AppointmentForm() {
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [date, setDate] = useState("");
  const [booked, setBooked] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [dayBlocked, setDayBlocked] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    time: "",
    service: "",
    notes: "",
  });

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

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }
      setStatus("success");
      setMessage(data.message);
      setForm((f) => ({
        ...f,
        name: "",
        email: "",
        phone: "",
        time: "",
        notes: "",
      }));
      setBooked((prev) => (form.time ? [...prev, form.time] : prev));
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

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Symptoms, goals, or anything we should know before your visit."
        />
      </label>

      <button
        type="submit"
        className="btn-primary w-full md:w-auto"
        disabled={status === "loading" || dayBlocked}
      >
        {status === "loading" ? "Sending…" : "Request appointment"}
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
