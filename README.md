# Dr. Sharath S. Honnani — Surgical Gastroenterology

Clinic website for **Dr. Sharath S. Honnani** (MBBS, MS, Fellowship in Surgical Gastroenterology), Visiting Consultant at Yenepoya Specialty Hospital, Mangaluru.

Built with **Next.js**, **Prisma**, and **PostgreSQL**. Deploy on **Vercel** (site + API + admin in one app).

## Features

- Public site: home, about, services, gallery, journal, contact
- Booking: **clinic consultation** or **virtual consultation**
- Open slots confirm instantly; virtual visits get a Google Meet link
- Admin dashboard (`/admin`) for profile, hours, services, slots, blocked dates, and appointments

## Sources

- Hospital profile: https://www.yenepoyahospital.com/dr-s-s-honnani/
- Instagram: https://www.instagram.com/dr.honnani/

## Local setup

1. Create a Postgres database (local install, Docker, or free [Neon](https://neon.tech)).
2. Copy env and set `DATABASE_URL`:

```bash
npm install
cp .env.example .env
# edit DATABASE_URL, ADMIN_SECRET, ADMIN_PASSWORD
npx prisma migrate deploy
npm run dev
```

Admin: `/admin` (password from `ADMIN_PASSWORD`; default `Demo@12345` in development).

## Deploy on Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. Add a Postgres database:
   - Vercel dashboard → **Storage** → **Create Database** → **Postgres** (or Neon), then connect it to the project  
   - Or paste a Neon connection string as `DATABASE_URL`
4. Set environment variables:

| Name | Notes |
|------|--------|
| `DATABASE_URL` | Postgres URL (**pooled** URL on Neon/Vercel) |
| `DIRECT_URL` | Direct (non-pooled) URL — same as `DATABASE_URL` if you only have one |
| `ADMIN_SECRET` | Random string, 32+ characters |
| `ADMIN_PASSWORD` | Admin login password |

5. Deploy. Build runs `prisma migrate deploy` then `next build`, so tables are created automatically.
6. Open `https://YOUR-APP.vercel.app/admin` and sign in.

Frontend, booking APIs, and the admin panel all ship together — no separate backend host.
