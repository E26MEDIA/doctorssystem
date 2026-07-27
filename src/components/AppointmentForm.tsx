"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ServiceOption = { title: string; slug: string };

type Status = "idle" | "loading" | "success" | "error";

const VISIT_TYPES = [
  {
    slug: "clinic-consultation",
    title: "Clinic Consultation",
    blurb: "In-person visit at the hospital clinic.",
  },
  {
    slug: "virtual-consultation",
    title: "Virtual Consultation",
    blurb: "Video visit with Google Meet link on confirm.",
  },
] as const;

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
  const [meetLink, setMeetLink] = useState("");
  const [visitSlug, setVisitSlug] = useState<string>("clinic-consultation");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    time: "",
    notes: "",
  });

  const selectedService = useMemo(() => {
    const fromApi = services.find((s) => s.slug === visitSlug);
    if (fromApi) return fromApi;
    const fallback = VISIT_TYPES.find((v) => v.slug === visitSlug);
    return fallback
      ? { title: fallback.title, slug: fallback.slug }
      : { title: "Clinic Consultation", slug: "clinic-consultation" };
  }, [services, visitSlug]);

  const isVirtual = selectedService.slug === "virtual-consultation";

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
      const lead = data.clinic?.minLeadDays ?? 0;
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
      const hasClinic = list.some((s) => s.slug === "clinic-consultation");
      const hasVirtual = list.some((s) => s.slug === "virtual-consultation");
      if (hasClinic) setVisitSlug("clinic-consultation");
      else if (hasVirtual) setVisitSlug("virtual-consultation");
      else if (list[0]) setVisitSlug(list[0].slug);
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
    setMeetLink("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date,
          service: selectedService.title,
          visitType: selectedService.slug,
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
      if (data.meetLink) setMeetLink(data.meetLink);
      setForm({
        name: "",
        email: "",
        phone: "",
        time: "",
        notes: "",
      });
      setBooked((prev) => (form.time ? [...prev, form.time] : prev));
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!bookingEnabled) {
    return (
      <p className="text-[var(--ink-soft)]">
        Online booking is temporarily closed. Please call the clinic.
      </p>
    );
  }

  const openSlots = timeSlots.filter((t) => !booked.includes(t));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Visit type
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {VISIT_TYPES.map((visit) => {
            const available =
              services.length === 0 ||
              services.some((s) => s.slug === visit.slug);
            if (!available) return null;
            const active = visitSlug === visit.slug;
            return (
              <button
                key={visit.slug}
                type="button"
                className={`visit-card text-left ${active ? "active" : ""}`}
                onClick={() => setVisitSlug(visit.slug)}
              >
                <p className="font-medium text-[var(--deep)]">{visit.title}</p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {visit.blurb}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <label className="field">
        <span>Full name</span>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your name"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
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
            placeholder="+91 ..."
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
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
              setForm((f) => ({ ...f, time: "" }));
            }}
          />
        </label>
        <label className="field">
          <span>Open slot</span>
          <select
            required
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            disabled={dayBlocked || openSlots.length === 0}
          >
            <option value="">
              {dayBlocked
                ? "Clinic closed this day"
                : openSlots.length
                  ? "Select a slot"
                  : "No open slots"}
            </option>
            {openSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Notes (optional)</span>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Symptoms, reports, or anything we should know."
        />
      </label>

      {isVirtual && (
        <p className="rounded-xl bg-[var(--sand)] px-4 py-3 text-sm text-[var(--ink-soft)]">
          Virtual booking is confirmed right away. Your Google Meet link will be
          emailed to you and available for the doctor at the scheduled time.
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={status === "loading" || dayBlocked || !form.time}
      >
        {status === "loading" ? "Booking..." : "Confirm booking"}
      </button>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            status === "success"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          <p>{message}</p>
          {meetLink && (
            <p className="mt-2">
              Meet link:{" "}
              <a
                href={meetLink}
                className="underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                {meetLink}
              </a>
            </p>
          )}
        </div>
      )}
    </form>
  );
}
