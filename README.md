# Meridian Health — Doctor Clinic Website

Full-stack clinic site for **Dr. Anika Rao, MD** (Internal Medicine), built with Next.js, Prisma, and SQLite.

## Features

- Marketing pages: Home, About, Services, Journal, Contact
- Online appointment booking with conflict checks
- Contact form with message storage
- Admin dashboard (`/admin`) to confirm appointments and read messages
- Responsive design with scroll reveal motion

## Quick start

```bash
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
Default password: `Demo@12345` (change in `.env` or Admin → Security)

### Admin settings tabs

- Overview, Appointments, Messages
- Clinic profile, Hours, Services
- Booking rules & time slots, Blocked dates
- Notifications, Security (password change)

## Environment

Copy `.env.example` to `.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (`file:./dev.db`) |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_SECRET` | Session signing secret |

## Production

```bash
npm run build
npm start
```

Before deploying, set strong values for:

- `ADMIN_SECRET` — random, **≥ 32 characters** (required; example values are rejected)
- `ADMIN_PASSWORD` — required in production (no default fallback)

### Security controls

- Signed, expiring admin sessions (`HttpOnly`, `SameSite=Strict`)
- Origin checks on mutating API routes
- Rate limits on login, booking, and contact
- Public `/api/clinic` strips internal notification settings
- Security headers via middleware (CSP, frame deny, nosniff, etc.)
- Stronger admin password policy (length + complexity)
