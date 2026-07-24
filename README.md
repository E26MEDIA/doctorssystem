# Dr. Sharath S. Honnani — Surgical Gastroenterology

Clinic website for **Dr. Sharath S. Honnani** (MBBS, MS, Fellowship in Surgical Gastroenterology), Visiting Consultant at Yenepoya Specialty Hospital, Mangaluru.

Built with Next.js, Prisma, and SQLite.

## Features

- Public site: home, about, services, journal, contact
- Booking: **clinic consultation** or **virtual consultation**
- Doctor-owned weekly slots — open slots confirm instantly (no second approval)
- Virtual visits receive a Google Meet link at booking time
- Admin dashboard for profile, hours, services, slots, blocked dates, and appointments (join Meet from admin)

## Sources

- Hospital profile: https://www.yenepoyahospital.com/dr-s-s-honnani/
- Instagram: https://www.instagram.com/dr.honnani/

## Local setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Admin: `/admin` (password from `ADMIN_PASSWORD`, default `Demo@12345` in development).
