### Urban Mobility – NYC Taxi Trips Dashboard

An Express + EJS application that ingests raw NYC Taxi Trip CSV data, cleans and enriches it, stores it in a relational database (Supabase/Postgres), and serves interactive endpoints and pages to explore urban mobility patterns.

---

## Quick Links

- Technical report (PDF) placeholder: `[Insert technical report PDF link here]`
- Video walkthrough placeholder: `[Insert video link here]`

## Team

- Peggy Dusenge – p.dusenge@alustudent.com
- Frank Nkurunziza – f.nkurunziz2@alustudent.com
- Grace Umwari – g.umwari@alustudent.com
- Esther Irakoze – e.irakoze1@alustudent.com
- Kagaba Shingiro Etienne - e.kagaba@alustudent.com

## Architecture Overview

- Backend: Node.js, Express 5, TypeScript, EJS views
- Database: Supabase (Postgres)
- Static assets: served from `src/public`
- Views: EJS templates in `src/views`
- Ingestion: CSV upload endpoint processes and upserts trips/vendors

High-level flow:

1. Upload raw CSV to `/api/v1/ingress` → parse/clean/derive fields
2. Upsert vendors and trips → Postgres (Supabase)
3. Explore API: `/api/v1/trips` (list, map, stats, vendors) and homepage `/`

## Tech Stack

- Express 5, TypeScript, EJS, Multer, CORS, Winston, Zod
- Supabase JS client for Postgres
- Tooling: Webpack, Gulp (TS build), Jest

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase account and project (to obtain URL and Service Role key)
- A Mapbox account to obtain public access token

## Environment Variables

Create a `.env` file at the project root with:

```
SITE_URL=http://localhost:3000
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_service_role_key
MAPBOX_TOKEN=your_mapbox_token
NODE_ENV=development
```

Notes:

- `SUPABASE_SECRET_KEY` is required at server start (see `src/utils/supabase.ts`).
- `MAPBOX_TOKEN` is optional but required if you may need to use the frontend.

## Install, Build, Run

```bash
npm install

# Dev mode (watches TS/EJS via nodemon, builds via gulp+webpack)
npm run dev

# Production build
npm run build

# Start compiled server
npm start
```

Scripts reference (from `package.json`):

- `dev`: nodemon + gulp + webpack
- `build`: gulp + webpack
- `start`: node `dist/index.js`
- `test`: jest
- `eslint`, `format`

## Database Setup (Supabase only)

Use Supabase exclusively (required; Data API and auth). Avoid direct `psql` or other hosts.

1. Create Supabase account and project

- Go to `https://supabase.com` and sign up
- Create a new project (choose region and DB password)

2. Obtain credentials

- From Project Settings → API, copy:
  - Project URL → use as `SUPABASE_URL`
  - Service Role key → use as `SUPABASE_SECRET_KEY`
- Add them to your `.env` as shown above

3. Install Supabase CLI

- Global install: `npm i -g supabase`
- Or use NPX per command: `npx supabase <command>`

4. Link the local repo to your hosted project

```bash
# Either (global CLI):
supabase link --project-ref <your-project-ref>

# Or (NPX):
npx supabase link --project-ref <your-project-ref>
```

5. Apply schema and seed via reset

- Migrations live in `supabase/migrations/*.sql`
- Seeds live in `supabase/seeds/` (dump file with necessary data)

```bash
# WARNING: This truncates the linked project's database
supabase db reset --linked

# Or with NPX
npx supabase db reset --linked
```

Note: Do NOT link to a production project with important data; reset will erase tables.

## Dataset and Ingestion

- Use the official raw NYC Taxi Trip dataset `train.zip` (trip-level CSVs).
- This repo does not include the dataset. Download it and extract CSV locally.

CSV Upload

- Endpoint: `POST /api/v1/ingress`
- Form field name: `tripData` (single file)
- Max file size: 200 MB (see Multer config)

Expected CSV columns (header row, then rows):

```
id,vendor_id,pickup_datetime,dropoff_datetime,passenger_count,
pickup_longitude,pickup_latitude,dropoff_longitude,dropoff_latitude,
store_and_fwd_flag,trip_duration
```

Processing steps (see `src/services/ingress.service.ts`):

- Parse lines, coerce types, ISO normalize timestamps
- Collect unique `vendor_id` values for upsert into `vendors`
- Upsert trips with conflict on `id`

Derived fields (computed at the database level):

- `suspicious_trip` — flag for duration inconsistency
- `trip_min_distance` — minimum viable trip distance
- `trip_speed` — derived speed metric based on duration and distance

## API Overview

- Health: `GET /health`
- Home: `GET /` (EJS view)
- Trips API base: `/api/v1/trips`
  - `GET /` → list trips (filters can be extended)
  - `GET /map` → map-ready data
  - `GET /stats` → summary stats
  - `GET /vendors` → list vendors
- Ingress: `POST /api/v1/ingress` → upload CSV (field: `tripData`)

Implementation references:

- App bootstrap: `src/index.ts`, `src/app.ts`
- Routes: `src/routes/*.ts`
- Controllers/Services: `src/controllers/*.ts`, `src/services/*.ts`
- Views/Static: `src/views`, `src/public`

## Data Structures and Algorithms Notes

- Sets for de-duplication:
  - In `src/services/ingress.service.ts`, a `Set<number>` is used to collect unique `vendor_id` values while reading CSV rows, preventing duplicate vendor upserts.
  - In the frontend vendor filter/select control, a `Set` is used to avoid repopulating existing vendor IDs in the options list. This ensures stable, de-duplicated UI state when new data is ingested.

## Testing

```bash
npm test
```

Jest tests live in `src/test`.

## Logging and Observability

- Winston-based logger (`src/utils/logger.ts`)
- Health endpoint exposes uptime and environment info

## Deliverables Checklist

- Codebase with clear structure (this repo)
- Database schema/migrations (`supabase/migrations`)
- Technical report (PDF) placeholder: `[Insert technical report PDF link here]`
- Video walkthrough placeholder: `[Insert video link here]`

## Troubleshooting

- Missing Supabase env → server will throw on start; set `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- 404s on assets → ensure `npm run build` so `dist/public` is generated.
- CSV rejected → check field name `tripData` and file size limit.
