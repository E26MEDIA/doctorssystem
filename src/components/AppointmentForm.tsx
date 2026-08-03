"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ServiceOption = { title: string; slug: string };
type Status = "idle" | "loading" | "success" | "error";

function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const VISIT_TYPES = [
  {
    slug: "clinic-consultation",
    title: "Clinic Consultation",
    blurb: "In-person visit at the hospital clinic.",
  },
  {
    slug: "virtual-consultation",
    title: "Virtual Consultation",
    blurb: "Secure video visit with Google Meet after confirmation.",
  },
] as const;

export function AppointmentForm() {
  const router = useRouter();
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
  const openSlots = timeSlots.filter((t) => !booked.includes(t));

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
        const nextBooked: string[] = data.booked ?? [];
        const nextSlots: string[] = Array.isArray(data.timeSlots)
          ? data.timeSlots
          : [];
        setBooked(nextBooked);
        setDayBlocked(Boolean(data.blocked));
        setTimeSlots(nextSlots);
        setForm((f) => {
          if (!f.time) return f;
          if (!nextSlots.includes(f.time) || nextBooked.includes(f.time)) {
            return { ...f, time: "" };
          }
          return f;
        });
        if (data.minDate) setMinDate(data.minDate);
        if (data.maxDate) setMaxDate(data.maxDate);
        if (typeof data.bookingEnabled === "boolean") {
          setBookingEnabled(data.bookingEnabled);
        }
      } catch {
        if (!cancelled) {
          setBooked([]);
          setTimeSlots([]);
        }
      }
    }

    load();
    const refresh = window.setInterval(load, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
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
        // Slot may have been taken by someone else — refresh availability
        if (res.status === 409 && date) {
          const refresh = await fetch(`/api/appointments?date=${date}`);
          const slotData = await refresh.json();
          setBooked(slotData.booked ?? []);
          setTimeSlots(
            Array.isArray(slotData.timeSlots) ? slotData.timeSlots : [],
          );
          setForm((f) => ({ ...f, time: "" }));
        }
        return;
      }

      setBooked((prev) => (form.time ? [...prev, form.time] : prev));

      if (data.payUrl) {
        router.push(data.payUrl);
        return;
      }

      setStatus("success");
      setMessage(data.message);
      setForm({
        name: "",
        email: "",
        phone: "",
        time: "",
        notes: "",
      });
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

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Open slot
        </p>
        {dayBlocked ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Clinic closed this day
          </p>
        ) : timeSlots.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            No slots scheduled for this date
          </p>
        ) : openSlots.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            All slots for this date are already booked
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {timeSlots.map((slot) => {
              const taken = booked.includes(slot);
              const active = form.time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={taken}
                  onClick={() => setForm({ ...form, time: slot })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    taken
                      ? "cursor-not-allowed border-[var(--line)] bg-[var(--sand)] text-[var(--muted)] line-through opacity-70"
                      : active
                        ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--teal)]"
                  }`}
                  aria-pressed={active}
                  title={taken ? "Already booked" : to12h(slot)}
                >
                  {to12h(slot)}
                </button>
              );
            })}
          </div>
        )}
        {!dayBlocked && openSlots.length > 0 && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Greyed-out times are already taken and cannot be booked again.
          </p>
        )}
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
          After you reserve a slot, you will continue to a secure checkout to
          complete the consultation fee. Your Google Meet link and receipt are
          emailed once payment succeeds.
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={status === "loading" || dayBlocked || !form.time}
      >
        {status === "loading"
          ? "Please wait..."
          : isVirtual
            ? "Continue to payment"
            : "Confirm booking"}
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
        </div>
      )}
    </form>
  );
}
