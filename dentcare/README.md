# DentCare – Dental Cabinet Appointment Management

React 18 + Vite + TypeScript + Tailwind CSS. Runs fully in the browser with demo data stored in `localStorage`; the data layer is isolated so a real backend can replace it later.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

Requires Node.js 18+.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Doctor / Admin | doctor@dentcare.com | doctor123 |
| Secretary | secretary@dentcare.com | secretary123 |

The secretary cannot open **Settings** or **Reports** (role-based routes). Public booking page: `/book` (no login).

## Features

- **Dashboard** – today's appointments, week count, patients, monthly revenue (admin), today's timeline, charts
- **Appointments** – FullCalendar (day/week/month) with drag-and-drop rescheduling, list view with search, filters and pagination; statuses Scheduled / Confirmed / Completed / Cancelled / No-show; double-booking prevention; working-hours, lunch-break and holiday checks; free-slot suggestions
- **Patients** – search/sort, full profile, allergies, medical history, insurance, treatment history, interactive **odontogram** (FDI numbering), document and X-ray upload (stored as base64)
- **Treatments & Billing** – treatment catalog, invoices (editable lines, discount, partial payments), **PDF download and print** (jsPDF)
- **Reminders** – simulated SMS / Email reminders, "send all pending", sent log
- **Requests** – public booking requests appear as *Pending*; approving opens a pre-filled appointment
- **Reports** (admin) – revenue, completion / no-show / cancellation rates, top treatments
- **Settings** (admin) – cabinet info and logo, working hours and breaks, slot length, holidays, staff accounts, reset demo data
- English + French (i18next), dark mode, responsive layout with collapsible sidebar, toasts, confirm dialogs, empty/loading states, ARIA labels

## Folder structure

```
src/
  components/
    ui/            Modal, ConfirmDialog, Field, badges, misc (Pagination, Avatar…)
    layout/        Layout, Sidebar, Navbar
    appointments/  AppointmentForm
    patients/      PatientForm, Odontogram
  pages/           Login, Dashboard, Appointments, Patients, PatientDetail,
                   Treatments, Billing, Reminders, Requests, Reports, Settings, PublicBooking
  routes/          ProtectedRoute (role-based)
  store/           data (Zustand + localStorage), auth, ui (theme, sidebar)
  services/        db.ts  ← mock API layer
  hooks/           useLookups, useReminders
  utils/           scheduling (conflicts, hours, slots), time, format, invoicePdf
  i18n/            en.json, fr.json
  data/db.json     seed data (re-dated to the current week on first load)
  types/           TypeScript models
```

## Demo data

On first launch `src/data/db.json` is copied to `localStorage` (key `dentcare_db`). Dates are shifted by whole weeks so the dashboard always shows current appointments. Use **Settings → Demo data → Reset** (or clear site data) to restore it.

## Connecting a real backend

All persistence goes through two places:

1. `src/services/db.ts` – `loadDb()` / `saveDb()` / `resetDb()`
2. `src/store/data.ts` – `upsert`, `remove`, `updateSettings`

To use a REST API (Node/Express, Supabase, Firebase…):

1. Replace `loadDb()` with `GET /api/...` calls and load the result into the store (show a loading state while fetching).
2. In `upsert` / `remove` / `updateSettings`, call `POST/PUT/DELETE` on your API, then update the store with the response.
3. Replace `useAuth.login` in `src/store/auth.ts` with a real login endpoint returning a JWT; send it in an `Authorization` header.
4. **Hash passwords** server-side. The demo stores them in plain text.
5. Move conflict detection (`utils/scheduling.ts`) to the server as well, so it cannot be bypassed.
6. Send real SMS / email from the server in `useSendReminder` (`src/hooks/useReminders.ts`).

The data shapes are in `src/types/index.ts`.

## Theming

Brand colors live in `tailwind.config.js` (`brand` palette). Fonts (Bricolage Grotesque + Figtree) are loaded in `index.html`.

## Notes

- `localStorage` is limited (~5 MB); uploaded documents are capped at 1.5 MB each.
- SPA routing: configure your host to serve `index.html` for unknown paths when deploying.
