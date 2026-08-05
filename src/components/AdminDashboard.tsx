"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ClinicConfig,
  DateScheduleRow,
  HourRow,
  JournalArticleItem,
  ServiceItem,
} from "@/lib/settings";
import type { JournalBlock } from "@/lib/journal";
import {
  buildDateScheduleWindow,
  isScheduleDateEditable,
  SCHEDULE_ADJUSTMENT_LEAD_DAYS,
  getScheduleEditCutoffDate,
} from "@/lib/schedule";

type Appointment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  visitType?: string;
  meetLink?: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

type Tab =
  | "overview"
  | "appointments"
  | "messages"
  | "profile"
  | "hours"
  | "services"
  | "journal"
  | "booking"
  | "notifications"
  | "security";

const emptyJournalDraft = (): JournalArticleItem => ({
  slug: "",
  title: "",
  category: "Guidance",
  excerpt: "",
  body: [""],
  blocks: [{ type: "paragraph", text: "" }],
  imageUrl: "/images/gallery-1.jpg",
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: "5 min",
  active: true,
  sortOrder: 0,
});

const emptySettings = (): ClinicConfig => ({
  name: "",
  doctor: "",
  credentials: "",
  tagline: "",
  phone: "",
  email: "",
  address: { line1: "", line2: "" },
  hours: [{ day: "Monday – Friday", time: "9:00 AM – 6:00 PM" }],
  social: { instagram: "", linkedin: "" },
  timeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  weeklySchedule: [],
  dateSchedule: [],
  savedDateSchedule: [],
  bookingEnabled: true,
  minLeadDays: 7,
  maxAdvanceDays: 60,
  autoConfirm: true,
  confirmationNote: "",
  notifyEmail: "",
  notifyOnBooking: true,
  notifyOnContact: true,
  emergencyNote: "",
});

// ── Utilities ────────────────────────────────────────────────────────────────

/** Convert "14:30" → "2:30 PM" */
function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.padStart(2, "0")} ${ampm}`;
}

/** All bookable slots throughout the day in 30-min increments */
const ALL_SLOTS: string[] = Array.from({ length: 28 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30; // 7:00 AM to 8:30 PM
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

// ── Date Schedule Editor (real calendar dates) ────────────────────────────────

function DateScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: DateScheduleRow[];
  onChange: (updated: DateScheduleRow[]) => void;
}) {
  const editCutoff = getScheduleEditCutoffDate();
  const [openDate, setOpenDate] = useState<string | null>(
    () => schedule.find((r) => r.enabled)?.date ?? schedule[0]?.date ?? null,
  );

  function updateDay(date: string, patch: Partial<DateScheduleRow>) {
    if (!isScheduleDateEditable(date)) return;
    onChange(
      schedule.map((row) => (row.date === date ? { ...row, ...patch } : row)),
    );
  }

  function toggleSlot(date: string, slot: string, currentSlots: string[]) {
    if (!isScheduleDateEditable(date)) return;
    const next = currentSlots.includes(slot)
      ? currentSlots.filter((s) => s !== slot)
      : [...currentSlots, slot].sort();
    updateDay(date, { slots: next, enabled: true });
  }

  const openCount = schedule.filter((r) => r.enabled && r.slots.length > 0).length;
  const offCount = schedule.filter((r) => !r.enabled).length;
  const lockedCount = schedule.filter((r) => !isScheduleDateEditable(r.date)).length;

  return (
    <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--sand)]/35 p-5">
      <h3 className="text-lg font-semibold text-[var(--deep)]">
        Daily consultation schedule
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Set times for each calendar date. Turn a day <strong>Off</strong> when the
        doctor is unavailable. Changes must be made at least{" "}
        <strong>{SCHEDULE_ADJUSTMENT_LEAD_DAYS} days</strong> before the visit
        (from {editCutoff} onward).
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {openCount} open day{openCount === 1 ? "" : "s"} with times · {offCount}{" "}
        closed · {lockedCount} locked within {SCHEDULE_ADJUSTMENT_LEAD_DAYS} days
      </p>

      <div className="mt-5 space-y-3">
        {schedule.map((row) => {
          const expanded = openDate === row.date;
          const locked = !isScheduleDateEditable(row.date);
          return (
            <div
              key={row.date}
              className={`rounded-xl border bg-white transition ${
                row.enabled
                  ? "border-[var(--line)]"
                  : "border-[var(--line)] bg-[var(--sand)]/40"
              } ${locked ? "opacity-80" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    setOpenDate((d) => (d === row.date ? null : row.date))
                  }
                >
                  <p className="font-semibold text-[var(--deep)]">{row.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {locked
                      ? "Locked — schedule was set; changes need 7+ days notice"
                      : !row.enabled
                        ? "Closed — patients cannot book"
                        : row.slots.length
                          ? row.slots.map(to12h).join(" · ")
                          : "Open — tap to choose times"}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  {locked ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--sand)] px-4 py-1.5 text-sm text-[var(--muted)]">
                      Locked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !row.enabled;
                        updateDay(row.date, {
                          enabled: next,
                          slots: next ? row.slots : [],
                        });
                        if (next) setOpenDate(row.date);
                      }}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        row.enabled
                          ? "bg-[var(--teal)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--ink-soft)]"
                      }`}
                    >
                      {row.enabled ? "Open" : "Off"}
                    </button>
                  )}
                </div>
              </div>

              {expanded && row.enabled && !locked && (
                <div className="border-t border-[var(--line)] px-4 pb-4 pt-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    Available times for this date
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SLOTS.map((slot) => {
                      const active = row.slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleSlot(row.date, slot, row.slots)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                            active
                              ? "border-[var(--teal)] bg-[var(--teal)] text-white shadow-sm"
                              : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
                          }`}
                        >
                          {to12h(slot)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function adminFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (
    init?.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, {
    ...init,
    credentials: "same-origin",
    headers,
  });
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-[var(--deep)] text-white"
          : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--teal)]"
      }`}
    >
      {children}
    </button>
  );
}

function SaveBar({
  saving,
  message,
  onSave,
  label = "Save changes",
}: {
  saving: boolean;
  message: string;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <button
        type="button"
        className="btn-primary"
        disabled={saving}
        onClick={onSave}
      >
        {saving ? "Saving…" : label}
      </button>
      {message && (
        <p className="text-sm text-[var(--teal)]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<ClinicConfig>(emptySettings);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [journal, setJournal] = useState<JournalArticleItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [serviceDraft, setServiceDraft] = useState<ServiceItem>({
    slug: "",
    title: "",
    summary: "",
    details: "",
    duration: "45 min",
    active: true,
    sortOrder: 0,
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [journalDraft, setJournalDraft] =
    useState<JournalArticleItem>(emptyJournalDraft);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [uploadingJournal, setUploadingJournal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/data");
    if (res.status === 401) {
      setAuthed(false);
      setChecking(false);
      setError("Session expired — please sign in again.");
      return;
    }
    if (!res.ok) {
      setChecking(false);
      return;
    }
    const data = await res.json();
    setAppointments(data.appointments ?? []);
    setMessages(data.messages ?? []);
    setSettings(data.settings ?? emptySettings());
    setServices(data.services ?? []);
    setJournal(data.journal ?? []);
    setAuthed(true);
    setChecking(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments],
  );
  const unread = useMemo(
    () => messages.filter((m) => !m.read).length,
    [messages],
  );
  const confirmed = useMemo(
    () => appointments.filter((a) => a.status === "confirmed").length,
    [appointments],
  );

  const closedDays = useMemo(
    () => settings.dateSchedule.filter((d) => !d.enabled).length,
    [settings.dateSchedule],
  );

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await adminFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Login failed");
      return;
    }
    setPassword("");
    await load();
  }

  async function logout() {
    await adminFetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setAppointments([]);
    setMessages([]);
  }

  async function updateStatus(id: string, status: string) {
    const res = await adminFetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) await load();
  }

  async function markRead(id: string) {
    const res = await adminFetch(`/api/admin/messages/${id}`, { method: "PATCH" });
    if (res.ok) await load();
  }

  async function saveSettings(next?: ClinicConfig) {
    setSaving(true);
    setSaveMsg("");
    const payload = next ?? settings;
    const res = await adminFetch("/api/admin/data", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.status === 401) {
      setAuthed(false);
      setSaveMsg("Session expired — please sign in again.");
      return;
    }
    if (!res.ok) {
      setSaveMsg(data.error || "Save failed");
      if (res.status === 400 || res.status === 401) {
        await load();
      }
      return;
    }
    setSettings(data.settings);
    setSaveMsg("Saved successfully");
  }

  async function saveService(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const payload = {
      ...serviceDraft,
      slug: serviceDraft.slug || slugify(serviceDraft.title),
    };
    const res = await adminFetch(
      editingServiceId
        ? `/api/admin/services/${editingServiceId}`
        : "/api/admin/services",
      {
        method: editingServiceId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setSaveMsg(data.error || "Could not save service");
      return;
    }
    setServiceDraft({
      slug: "",
      title: "",
      summary: "",
      details: "",
      duration: "45 min",
      active: true,
      sortOrder: services.length,
    });
    setEditingServiceId(null);
    setSaveMsg(editingServiceId ? "Service updated" : "Service added");
    await load();
  }

  function editService(service: ServiceItem) {
    setEditingServiceId(service.id ?? null);
    setServiceDraft({ ...service });
    setTab("services");
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    await adminFetch(`/api/admin/services/${id}`, { method: "DELETE" });
    await load();
  }

  async function saveJournal(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const blocks = journalDraft.blocks
      .map((block) => {
        if (block.type === "paragraph") {
          return { ...block, text: block.text.trim() };
        }
        return {
          ...block,
          src: block.src.trim(),
          caption: block.caption?.trim() || undefined,
        };
      })
      .filter((block) =>
        block.type === "paragraph" ? Boolean(block.text) : Boolean(block.src),
      );

    if (!blocks.some((b) => b.type === "paragraph")) {
      setSaving(false);
      setSaveMsg("Add at least one text paragraph");
      return;
    }
    if (!journalDraft.imageUrl.trim()) {
      setSaving(false);
      setSaveMsg("Choose a preview image");
      return;
    }

    const payload = {
      title: journalDraft.title,
      slug: journalDraft.slug || slugify(journalDraft.title),
      category: journalDraft.category,
      excerpt: journalDraft.excerpt,
      blocks,
      imageUrl: journalDraft.imageUrl,
      publishedAt: journalDraft.publishedAt,
      readTime: journalDraft.readTime,
      active: journalDraft.active,
      sortOrder: journalDraft.sortOrder,
    };
    const res = await adminFetch(
      editingJournalId
        ? `/api/admin/journal/${editingJournalId}`
        : "/api/admin/journal",
      {
        method: editingJournalId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setSaveMsg(data.error || "Could not save article");
      return;
    }
    setJournalDraft(emptyJournalDraft());
    setEditingJournalId(null);
    setSaveMsg(editingJournalId ? "Article updated" : "Article added");
    await load();
  }

  function editJournal(article: JournalArticleItem) {
    setEditingJournalId(article.id ?? null);
    const blocks =
      article.blocks?.length > 0
        ? article.blocks
        : article.body.length
          ? article.body.map((text) => ({
              type: "paragraph" as const,
              text,
            }))
          : [{ type: "paragraph" as const, text: "" }];
    setJournalDraft({
      ...article,
      blocks,
      body: article.body.length ? [...article.body] : [""],
    });
    setTab("journal");
  }

  async function deleteJournal(id: string) {
    if (!confirm("Delete this journal article?")) return;
    await adminFetch(`/api/admin/journal/${id}`, { method: "DELETE" });
    await load();
  }

  async function uploadJournalFile(file: File): Promise<string | null> {
    setUploadingJournal(true);
    setSaveMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error || "Upload failed");
        return null;
      }
      setSaveMsg("Image uploaded");
      return data.url as string;
    } catch {
      setSaveMsg("Upload failed");
      return null;
    } finally {
      setUploadingJournal(false);
    }
  }

  async function uploadJournalImage(file: File, mode: "preview" | "insert") {
    const url = await uploadJournalFile(file);
    if (!url) return null;
    if (mode === "preview") {
      setJournalDraft((d) => ({ ...d, imageUrl: url }));
    } else {
      setJournalDraft((d) => ({
        ...d,
        blocks: [...d.blocks, { type: "image", src: url, caption: "" }],
      }));
    }
    return url;
  }

  function updateBlock(index: number, patch: Partial<JournalBlock>) {
    setJournalDraft((d) => ({
      ...d,
      blocks: d.blocks.map((block, i) =>
        i === index ? ({ ...block, ...patch } as JournalBlock) : block,
      ),
    }));
  }

  function removeBlock(index: number) {
    setJournalDraft((d) => ({
      ...d,
      blocks: d.blocks.filter((_, i) => i !== index),
    }));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setJournalDraft((d) => {
      const next = [...d.blocks];
      const target = index + direction;
      if (target < 0 || target >= next.length) return d;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return { ...d, blocks: next };
    });
  }

  function rebuildScheduleWindow(
    next: Pick<ClinicConfig, "minLeadDays" | "maxAdvanceDays" | "dateSchedule">,
  ) {
    return buildDateScheduleWindow(
      next.maxAdvanceDays,
      0,
      next.dateSchedule,
    );
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setSecurityMsg("");
    if (newPassword !== confirmPassword) {
      setSecurityMsg("New passwords do not match");
      return;
    }
    const res = await adminFetch("/api/admin/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSecurityMsg(data.error || "Update failed");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityMsg(data.message);
  }

  function updateHour(index: number, key: keyof HourRow, value: string) {
    setSettings((s) => ({
      ...s,
      hours: s.hours.map((h, i) => (i === index ? { ...h, [key]: value } : h)),
    }));
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-28 text-[var(--muted)]">
        Checking session…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 pt-28">
        <h1 className="display text-4xl">Clinic admin</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Sign in to manage appointments, messages, and clinic settings.
        </p>
        <form onSubmit={onLogin} className="mt-8 space-y-4">
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl md:text-5xl">Admin panel</h1>
          <p className="mt-2 text-[var(--muted)]">
            {settings.name} · {settings.doctor}
          </p>
        </div>
        <button type="button" onClick={logout} className="btn-ghost !py-2.5">
          Sign out
        </button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>
        <TabButton
          active={tab === "appointments"}
          onClick={() => setTab("appointments")}
        >
          Appointments ({appointments.length})
        </TabButton>
        <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>
          Messages ({messages.length})
        </TabButton>
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          Clinic profile
        </TabButton>
        <TabButton active={tab === "hours"} onClick={() => setTab("hours")}>
          Hours
        </TabButton>
        <TabButton active={tab === "services"} onClick={() => setTab("services")}>
          Services
        </TabButton>
        <TabButton active={tab === "journal"} onClick={() => setTab("journal")}>
          Journal ({journal.length})
        </TabButton>
        <TabButton active={tab === "booking"} onClick={() => setTab("booking")}>
          Schedule
        </TabButton>
        <TabButton
          active={tab === "notifications"}
          onClick={() => setTab("notifications")}
        >
          Notifications
        </TabButton>
        <TabButton active={tab === "security"} onClick={() => setTab("security")}>
          Security
        </TabButton>
      </div>

      {tab === "overview" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Pending", value: pending },
            { label: "Confirmed", value: confirmed },
            { label: "Unread messages", value: unread },
            { label: "Closed days", value: closedDays },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--line)] bg-white p-5"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {stat.label}
              </p>
              <p className="display mt-2 text-4xl text-[var(--deep)]">
                {stat.value}
              </p>
            </div>
          ))}
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:col-span-2 lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Quick status
            </p>
            <p className="mt-3 text-[var(--ink-soft)]">
              Online booking is{" "}
              <strong className="text-[var(--deep)]">
                {settings.bookingEnabled ? "open" : "closed"}
              </strong>
              . Auto-confirm is{" "}
              <strong>{settings.autoConfirm ? "on" : "off"}</strong>. Active
              services:{" "}
              <strong>{services.filter((s) => s.active).length}</strong>.
            </p>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-[var(--muted)]">
                    No appointments yet.
                  </td>
                </tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-[var(--line)] align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium text-[var(--ink)]">{a.name}</p>
                    <p className="text-[var(--muted)]">{a.email}</p>
                    <p className="text-[var(--muted)]">{a.phone}</p>
                    {a.notes && (
                      <p className="mt-2 max-w-xs text-[var(--ink-soft)]">
                        {a.notes}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {a.date}
                    <br />
                    {a.time}
                  </td>
                  <td className="px-4 py-4">
                    <p>{a.service}</p>
                    {a.visitType === "virtual-consultation" && (
                      <p className="mt-1 text-xs uppercase tracking-wider text-[var(--teal)]">
                        Virtual
                      </p>
                    )}
                    {a.meetLink && (
                      <a
                        href={a.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-medium text-[var(--teal)] underline-offset-2 hover:underline"
                      >
                        Join Google Meet
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 capitalize">{a.status}</td>
                  <td className="px-4 py-4">
                    <select
                      className="rounded-lg border border-[var(--line)] bg-white px-2 py-1"
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "messages" && (
        <div className="mt-8 space-y-4">
          {messages.length === 0 && (
            <p className="text-[var(--muted)]">No messages yet.</p>
          )}
          {messages.map((m) => (
            <article
              key={m.id}
              className={`rounded-xl border border-[var(--line)] p-5 ${
                m.read ? "bg-white/50" : "bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                  {m.subject && (
                    <p className="mt-1 text-sm text-[var(--teal)]">{m.subject}</p>
                  )}
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  {new Date(m.createdAt).toLocaleString()}
                  {!m.read && (
                    <button
                      type="button"
                      onClick={() => markRead(m.id)}
                      className="mt-2 block text-[var(--teal)] underline-offset-2 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[var(--ink-soft)]">
                {m.message}
              </p>
            </article>
          ))}
        </div>
      )}

      {tab === "profile" && (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8">
          <h2 className="display text-3xl">Clinic profile</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            These details appear across the public website and booking pages.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="field">
              <span>Clinic name</span>
              <input
                value={settings.name}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Doctor name</span>
              <input
                value={settings.doctor}
                onChange={(e) =>
                  setSettings({ ...settings, doctor: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Credentials</span>
              <input
                value={settings.credentials}
                onChange={(e) =>
                  setSettings({ ...settings, credentials: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
              />
            </label>
            <label className="field md:col-span-2">
              <span>Tagline</span>
              <input
                value={settings.tagline}
                onChange={(e) =>
                  setSettings({ ...settings, tagline: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Public email</span>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Address line 1</span>
              <input
                value={settings.address.line1}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    address: { ...settings.address, line1: e.target.value },
                  })
                }
              />
            </label>
            <label className="field md:col-span-2">
              <span>Address line 2</span>
              <input
                value={settings.address.line2}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    address: { ...settings.address, line2: e.target.value },
                  })
                }
              />
            </label>
            <label className="field">
              <span>Instagram URL</span>
              <input
                value={settings.social.instagram}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, instagram: e.target.value },
                  })
                }
              />
            </label>
            <label className="field">
              <span>LinkedIn URL</span>
              <input
                value={settings.social.linkedin}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, linkedin: e.target.value },
                  })
                }
              />
            </label>
            <label className="field md:col-span-2">
              <span>Emergency / footer note</span>
              <textarea
                rows={2}
                value={settings.emergencyNote}
                onChange={(e) =>
                  setSettings({ ...settings, emergencyNote: e.target.value })
                }
              />
            </label>
          </div>
          <SaveBar
            saving={saving}
            message={saveMsg}
            onSave={() => saveSettings()}
          />
        </div>
      )}

      {tab === "hours" && (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8">
          <h2 className="display text-3xl">Clinic hours</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Display text for the website footer and contact page only. Patient
            booking times are set under Schedule, date by date.
          </p>
          <div className="mt-6 space-y-4">
            {settings.hours.map((h, i) => (
              <div key={i} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <label className="field">
                  <span>Day / range</span>
                  <input
                    value={h.day}
                    onChange={(e) => updateHour(i, "day", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Hours</span>
                  <input
                    value={h.time}
                    onChange={(e) => updateHour(i, "time", e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn-ghost self-end !py-2.5"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      hours: settings.hours.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-ghost mt-4"
            onClick={() =>
              setSettings({
                ...settings,
                hours: [...settings.hours, { day: "New day", time: "Closed" }],
              })
            }
          >
            Add row
          </button>
          <SaveBar
            saving={saving}
            message={saveMsg}
            onSave={() => saveSettings()}
          />
        </div>
      )}

      {tab === "services" && (
        <div className="mt-8 space-y-6">
          <form
            onSubmit={saveService}
            className="rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8"
          >
            <h2 className="display text-3xl">
              {editingServiceId ? "Edit service" : "Add service"}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="field">
                <span>Title</span>
                <input
                  required
                  value={serviceDraft.title}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      title: e.target.value,
                      slug: editingServiceId
                        ? serviceDraft.slug
                        : slugify(e.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Slug</span>
                <input
                  required
                  value={serviceDraft.slug}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      slug: slugify(e.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Duration</span>
                <input
                  required
                  value={serviceDraft.duration}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      duration: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Sort order</span>
                <input
                  type="number"
                  value={serviceDraft.sortOrder}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      sortOrder: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field md:col-span-2">
                <span>Summary</span>
                <textarea
                  required
                  rows={2}
                  value={serviceDraft.summary}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      summary: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field md:col-span-2">
                <span>Details</span>
                <textarea
                  required
                  rows={3}
                  value={serviceDraft.details}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      details: e.target.value,
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                <input
                  type="checkbox"
                  checked={serviceDraft.active}
                  onChange={(e) =>
                    setServiceDraft({
                      ...serviceDraft,
                      active: e.target.checked,
                    })
                  }
                />
                Active (visible on website & booking)
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {editingServiceId ? "Update service" : "Add service"}
              </button>
              {editingServiceId && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceDraft({
                      slug: "",
                      title: "",
                      summary: "",
                      details: "",
                      duration: "45 min",
                      active: true,
                      sortOrder: services.length,
                    });
                  }}
                >
                  Cancel edit
                </button>
              )}
              {saveMsg && (
                <p className="self-center text-sm text-[var(--teal)]">{saveMsg}</p>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-white p-5"
              >
                <div>
                  <p className="font-medium text-[var(--deep)]">
                    {s.title}{" "}
                    <span className="text-xs text-[var(--muted)]">
                      ({s.active ? "active" : "hidden"}) · {s.duration}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{s.summary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost !py-2"
                    onClick={() => editService(s)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !py-2 !text-red-700"
                    onClick={() => s.id && deleteService(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "journal" && (
        <div className="mt-8 space-y-6">
          <form
            onSubmit={saveJournal}
            className="rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8"
          >
            <h2 className="display text-3xl">
              {editingJournalId ? "Edit article" : "Add journal article"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Upload a preview image for journal cards. Inside the article, mix
              text paragraphs with as many photos as you need.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="field">
                <span>Title</span>
                <input
                  required
                  value={journalDraft.title}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      title: e.target.value,
                      slug: editingJournalId
                        ? journalDraft.slug
                        : slugify(e.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Slug</span>
                <input
                  required
                  value={journalDraft.slug}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      slug: slugify(e.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Category</span>
                <input
                  required
                  value={journalDraft.category}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      category: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Read time</span>
                <input
                  required
                  value={journalDraft.readTime}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      readTime: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Published date</span>
                <input
                  required
                  type="date"
                  value={journalDraft.publishedAt}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      publishedAt: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Sort order</span>
                <input
                  type="number"
                  value={journalDraft.sortOrder}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      sortOrder: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="field md:col-span-2">
                <span>Excerpt (card preview text)</span>
                <textarea
                  required
                  rows={2}
                  value={journalDraft.excerpt}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      excerpt: e.target.value,
                    })
                  }
                />
              </label>

              <div className="md:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--sand)]/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Preview image (card cover)
                </p>
                <div className="mt-3 flex flex-wrap items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={journalDraft.imageUrl}
                    alt="Preview"
                    className="h-28 w-44 rounded-lg object-cover border border-[var(--line)] bg-white"
                  />
                  <div className="space-y-3">
                    <label className="btn-ghost inline-flex cursor-pointer !py-2">
                      {uploadingJournal ? "Uploading…" : "Upload preview image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={uploadingJournal}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) await uploadJournalImage(file, "preview");
                        }}
                      />
                    </label>
                    <p className="text-xs text-[var(--muted)]">
                      This single image appears on journal cards and at the top
                      of the article.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Article content
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost !py-2"
                      onClick={() =>
                        setJournalDraft((d) => ({
                          ...d,
                          blocks: [
                            ...d.blocks,
                            { type: "paragraph", text: "" },
                          ],
                        }))
                      }
                    >
                      + Paragraph
                    </button>
                    <label className="btn-ghost inline-flex cursor-pointer !py-2">
                      {uploadingJournal ? "Uploading…" : "+ Upload image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={uploadingJournal}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) await uploadJournalImage(file, "insert");
                        }}
                      />
                    </label>
                  </div>
                </div>

                {journalDraft.blocks.map((block, index) => (
                  <div
                    key={`${block.type}-${index}`}
                    className="rounded-xl border border-[var(--line)] bg-white p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                        {block.type === "paragraph"
                          ? `Paragraph ${index + 1}`
                          : `Image ${index + 1}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-ghost !py-1.5 !text-xs"
                          onClick={() => moveBlock(index, -1)}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="btn-ghost !py-1.5 !text-xs"
                          onClick={() => moveBlock(index, 1)}
                        >
                          Down
                        </button>
                        {block.type === "image" && (
                          <button
                            type="button"
                            className="btn-ghost !py-1.5 !text-xs"
                            onClick={() =>
                              setJournalDraft((d) => ({
                                ...d,
                                imageUrl: block.src,
                              }))
                            }
                          >
                            Use as preview
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-ghost !py-1.5 !text-xs !text-red-700"
                          onClick={() => removeBlock(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {block.type === "paragraph" ? (
                      <textarea
                        rows={4}
                        className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                        value={block.text}
                        onChange={(e) =>
                          updateBlock(index, { text: e.target.value })
                        }
                        placeholder="Write this section of the article…"
                      />
                    ) : (
                      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={block.src}
                          alt=""
                          className="h-28 w-full rounded-lg object-cover border border-[var(--line)]"
                        />
                        <div className="space-y-3">
                          <label className="field">
                            <span>Caption (optional)</span>
                            <input
                              value={block.caption ?? ""}
                              onChange={(e) =>
                                updateBlock(index, {
                                  caption: e.target.value,
                                })
                              }
                              placeholder="Short caption under the photo"
                            />
                          </label>
                          <label className="btn-ghost inline-flex cursor-pointer !py-2">
                            Replace image
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              disabled={uploadingJournal}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                const url = await uploadJournalFile(file);
                                if (!url) return;
                                setJournalDraft((d) => ({
                                  ...d,
                                  imageUrl:
                                    d.imageUrl === block.src ? url : d.imageUrl,
                                  blocks: d.blocks.map((b, i) =>
                                    i === index && b.type === "image"
                                      ? { ...b, src: url }
                                      : b,
                                  ),
                                }));
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                <input
                  type="checkbox"
                  checked={journalDraft.active}
                  onChange={(e) =>
                    setJournalDraft({
                      ...journalDraft,
                      active: e.target.checked,
                    })
                  }
                />
                Active (visible on website)
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {editingJournalId ? "Update article" : "Add article"}
              </button>
              {editingJournalId && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setEditingJournalId(null);
                    setJournalDraft(emptyJournalDraft());
                  }}
                >
                  Cancel edit
                </button>
              )}
              {saveMsg && (
                <p className="self-center text-sm text-[var(--teal)]">{saveMsg}</p>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {journal.map((article) => (
              <div
                key={article.id ?? article.slug}
                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-white p-5"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--deep)]">
                      {article.title}{" "}
                      <span className="text-xs text-[var(--muted)]">
                        ({article.active ? "active" : "hidden"}) ·{" "}
                        {article.category} ·{" "}
                        {(article.blocks ?? []).filter((b) => b.type === "image")
                          .length}{" "}
                        photos
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost !py-2"
                    onClick={() => editJournal(article)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !py-2 !text-red-700"
                    onClick={() => article.id && deleteJournal(article.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "booking" && (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8">
          <h2 className="display text-3xl">Schedule</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage availability by calendar date in one place. Open a day and tap
            the times the doctor will see patients. Mark a day Off when they are
            away — patients will not see that date as bookable.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={settings.bookingEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingEnabled: e.target.checked,
                  })
                }
              />
              Accept online appointment requests
            </label>
            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={settings.autoConfirm}
                onChange={(e) =>
                  setSettings({ ...settings, autoConfirm: e.target.checked })
                }
              />
              Auto-confirm new bookings (otherwise stay pending)
            </label>
            <label className="field">
              <span>Minimum booking lead (days)</span>
              <input
                type="number"
                min={SCHEDULE_ADJUSTMENT_LEAD_DAYS}
                max={30}
                value={settings.minLeadDays}
                onChange={(e) => {
                  const minLeadDays = Math.max(
                    SCHEDULE_ADJUSTMENT_LEAD_DAYS,
                    Number(e.target.value) || SCHEDULE_ADJUSTMENT_LEAD_DAYS,
                  );
                  setSettings((s) => ({
                    ...s,
                    minLeadDays,
                    dateSchedule: rebuildScheduleWindow({
                      minLeadDays,
                      maxAdvanceDays: s.maxAdvanceDays,
                      dateSchedule: s.dateSchedule,
                    }),
                  }));
                }}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Patients can book from {getScheduleEditCutoffDate()} onward (at
                least {SCHEDULE_ADJUSTMENT_LEAD_DAYS} days ahead).
              </p>
            </label>
            <label className="field">
              <span>Show schedule for (days ahead)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={settings.maxAdvanceDays}
                onChange={(e) => {
                  const maxAdvanceDays = Math.min(
                    90,
                    Math.max(1, Number(e.target.value) || 1),
                  );
                  setSettings((s) => ({
                    ...s,
                    maxAdvanceDays,
                    dateSchedule: rebuildScheduleWindow({
                      minLeadDays: s.minLeadDays,
                      maxAdvanceDays,
                      dateSchedule: s.dateSchedule,
                    }),
                  }));
                }}
              />
            </label>
            <label className="field md:col-span-2">
              <span>Confirmation message to patients</span>
              <textarea
                rows={2}
                value={settings.confirmationNote}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    confirmationNote: e.target.value,
                  })
                }
              />
            </label>
          </div>

          <DateScheduleEditor
            schedule={settings.dateSchedule}
            onChange={(dateSchedule) =>
              setSettings((s) => ({
                ...s,
                dateSchedule,
                timeSlots: Array.from(
                  new Set(
                    dateSchedule.flatMap((row) =>
                      row.enabled ? row.slots : [],
                    ),
                  ),
                ).sort(),
              }))
            }
          />
          <SaveBar
            saving={saving}
            message={saveMsg}
            onSave={() => saveSettings()}
          />
          <p className="mt-4 text-xs text-[var(--muted)]">
            After changing times, click <strong>Save schedule</strong>. Dates
            within {SCHEDULE_ADJUSTMENT_LEAD_DAYS} days are locked on the booking
            site — set slots for dates from {getScheduleEditCutoffDate()} onward.
          </p>
        </div>
      )}

      {tab === "notifications" && (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8">
          <h2 className="display text-3xl">Notifications</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Preferences for where clinic alerts should go. Email delivery can be
            wired to an SMTP provider later; settings are stored now.
          </p>
          <div className="mt-6 grid gap-5">
            <label className="field">
              <span>Notify email</span>
              <input
                type="email"
                value={settings.notifyEmail}
                onChange={(e) =>
                  setSettings({ ...settings, notifyEmail: e.target.value })
                }
                placeholder="doctor@clinic.com"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.notifyOnBooking}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifyOnBooking: e.target.checked,
                  })
                }
              />
              Alert on new appointment requests
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.notifyOnContact}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifyOnContact: e.target.checked,
                  })
                }
              />
              Alert on new contact messages
            </label>
          </div>
          <SaveBar
            saving={saving}
            message={saveMsg}
            onSave={() => saveSettings()}
          />
        </div>
      )}

      {tab === "security" && (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6 md:p-8">
          <h2 className="display text-3xl">Security</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Change the admin password. Use at least 10 characters with upper,
            lower, number, and special character.
          </p>
          <form onSubmit={changePassword} className="mt-6 max-w-md space-y-5">
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                required
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                required
                minLength={10}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary">
              Update password
            </button>
            {securityMsg && (
              <p className="text-sm text-[var(--teal)]">{securityMsg}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
