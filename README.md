# fama-mochkla 📍

**A community-powered city problem reporting platform.** Report potholes, broken streetlights, garbage, water leaks, and more — on an interactive live map visible to everyone.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

### 3. Set up Supabase

#### A) Run the SQL schema

Go to your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → **New query**, and run:

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null, -- zbila, hofra, dhaw, ma_famech_ma, accident, other
  status text not null default 'pending', -- pending, in_progress, resolved
  latitude double precision not null,
  longitude double precision not null,
  address text,
  photo_url text,
  reporter_name text,
  created_at timestamp with time zone default now()
);

alter table reports enable row level security;

create policy "Public can view reports" on reports
  for select using (true);

create policy "Public can insert reports" on reports
  for insert with check (true);
```

#### B) Create the storage bucket

1. In the Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name it exactly: `report-photos`
4. Check **Public bucket** (so images are publicly accessible)
5. Click **Create bucket**

#### C) Enable Realtime

1. Go to **Database → Replication**
2. Enable replication on the `reports` table

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, live map preview, and reports feed |
| `/map` | Full interactive map with filters, click-to-report, and GPS |
| `/report/[id]` | Individual report detail with photo, mini-map, and metadata |

---

## Features

- **Interactive Map** — Leaflet + OpenStreetMap (free, no API key)
- **Tunisian categories** — Zbila, 7ofra fi Dhnya, Dhaw, Ma Famech Ma, Accident, Other
- **Color-coded pins** per category with read-only popups on click
- **Click-to-report** — click empty map space to open the report form at that location
- **Floating filter card** — filter by category, status, and search by address
- **Photo upload** — camera capture on mobile (`capture="environment"`) → Supabase Storage
- **RTL-friendly** description field (Arabic / French / Tunisian)
- **Real-time updates** — Supabase Realtime subscription (no refresh needed)
- **Status badges** — Pending (yellow), In Progress (blue), Resolved (green)
- **Framer Motion** — smooth page load, hover, and modal animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn-style UI components |
| Map | Leaflet + react-leaflet + OpenStreetMap |
| Backend/DB | Supabase (PostgreSQL + Row Level Security) |
| Storage | Supabase Storage (`report-photos` bucket) |
| Realtime | Supabase Realtime (Postgres changes) |
| Animations | Framer Motion |
| Geocoding | Nominatim (OpenStreetMap, free) |
| Fonts | Inter + Poppins (Google Fonts) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout + fonts + metadata
│   ├── globals.css           # Design system + Leaflet overrides
│   ├── map/page.tsx          # Full interactive map page
│   ├── report/[id]/          # Report detail + mini-map
│   └── api/reports/route.ts  # GET + POST API route
├── components/
│   ├── MapComponent.tsx      # Leaflet map with popups + click handler
│   ├── MapPreview.tsx        # Hero browser-frame map preview
│   ├── ReportModal.tsx       # Single-form report submission modal
│   ├── ReportCard.tsx        # Feed card (dark + light variants)
│   ├── FilterCard.tsx        # Floating filter/search card
│   ├── BrowserFrame.tsx      # Hero browser mockup wrapper
│   ├── StatusBadge.tsx       # Status badge component
│   ├── Navbar.tsx            # Sticky navigation
│   └── ui/                   # shadcn-style primitives (Button, Input, Textarea)
├── lib/
│   ├── supabase.ts           # Supabase client + helpers
│   └── utils.ts              # cn() utility
└── types/
    └── report.ts             # Types + category/status config
```

---

## Security

- All data access is governed by **Supabase Row Level Security (RLS)**
- Public read and insert are explicitly allowed; no write/delete without auth
- The publishable key is safe to use client-side with RLS enabled
- `.env.local` is in `.gitignore` — never commit your keys
