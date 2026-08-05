import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";
import {
  buildDateScheduleWindow,
  formatScheduleLabel,
  isScheduleDateEditable,
  SCHEDULE_ADJUSTMENT_LEAD_DAYS,
  type DateScheduleRow,
} from "@/lib/schedule";
import { rowToConfig } from "@/lib/settings";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Session expired — please sign in again." },
    { status: 401 },
  );
}

async function syncDateScheduleOff(date: string, reason: string | null) {
  const settingsRow = await prisma.clinicSettings.findUnique({
    where: { id: "default" },
  });
  if (!settingsRow) return;

  const config = rowToConfig(settingsRow);
  const saved = JSON.parse(
    settingsRow.dateScheduleJson || "[]",
  ) as DateScheduleRow[];
  const savedMap = new Map(saved.map((row) => [row.date, row]));

  const window = buildDateScheduleWindow(
    config.maxAdvanceDays,
    config.minLeadDays,
    saved,
  );

  const nextSchedule = window.map((row) => {
    if (row.date !== date) {
      const existing = savedMap.get(row.date);
      return existing
        ? {
            date: row.date,
            label: row.label,
            enabled: existing.enabled,
            slots: existing.slots ?? [],
          }
        : row;
    }
    return {
      date,
      label: formatScheduleLabel(date),
      enabled: false,
      slots: [],
    };
  });

  // Persist dates outside current window too
  for (const row of saved) {
    if (!nextSchedule.some((r) => r.date === row.date)) {
      nextSchedule.push(row);
    }
  }

  await prisma.clinicSettings.update({
    where: { id: "default" },
    data: { dateScheduleJson: JSON.stringify(nextSchedule) },
  });

  await prisma.blockedDate.upsert({
    where: { date },
    update: { reason: reason || "Blocked in admin" },
    create: { date, reason: reason || "Blocked in admin" },
  });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();

  const blockedDates = await prisma.blockedDate.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ blockedDates });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { date, reason } = parsed.data;

  if (!isScheduleDateEditable(date)) {
    return NextResponse.json(
      {
        error: `Use Schedule tab: dates within ${SCHEDULE_ADJUSTMENT_LEAD_DAYS} days are locked. Mark future dates Off there, or sign in again if you see Unauthorized.`,
      },
      { status: 400 },
    );
  }

  try {
    await syncDateScheduleOff(date, reason || null);
    const blocked = await prisma.blockedDate.findUnique({ where: { date } });
    return NextResponse.json({ ok: true, blocked });
  } catch {
    return NextResponse.json(
      { error: "That date is already blocked" },
      { status: 409 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const existing = await prisma.blockedDate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: true });
  }

  if (!isScheduleDateEditable(existing.date)) {
    return NextResponse.json(
      {
        error: `Cannot unblock dates within ${SCHEDULE_ADJUSTMENT_LEAD_DAYS} days from the schedule editor.`,
      },
      { status: 400 },
    );
  }

  await prisma.blockedDate.delete({ where: { id } });

  const settingsRow = await prisma.clinicSettings.findUnique({
    where: { id: "default" },
  });
  if (settingsRow) {
    const saved = JSON.parse(
      settingsRow.dateScheduleJson || "[]",
    ) as DateScheduleRow[];
    const next = saved.map((row) =>
      row.date === existing.date
        ? { ...row, enabled: true, label: formatScheduleLabel(existing.date) }
        : row,
    );
    await prisma.clinicSettings.update({
      where: { id: "default" },
      data: { dateScheduleJson: JSON.stringify(next) },
    });
  }

  return NextResponse.json({ ok: true });
}
