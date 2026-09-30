# Rwanda Utility Alerts

Alerts residents of Rwanda about **planned electricity and water interruptions** in the districts and sectors they follow.
Outage information is collected from the official announcements published by
[REG](https://www.reg.rw/customer-service/power-outages/) (Rwanda Energy Group, electricity) and
[WASAC Group](https://www.wasac.rw/en/public-information/announcements) (water).

> Rwanda Utility Alerts is independent and is not operated by REG or WASAC.

## Components

| Path | What it is | Stack |
| --- | --- | --- |
| `apps/mobile` | Resident app (Android / iOS) | Expo SDK 53, React Native, React Navigation |
| `apps/api` | REST API, notification matching, push delivery | NestJS 11, TypeORM, PostgreSQL, BullMQ (Redis) |
| `services/data-collector` | Scrapes REG and WASAC announcements and ingests them | Python 3.13, httpx, BeautifulSoup |
| `apps/web` | Operations console for administrators | Next.js 15 |

```
REG / WASAC websites ──► data-collector ──► API ──► PostgreSQL
                                             │
                                             ├──► BullMQ job ──► match followed areas ──► Expo push ──► phones
                                             └──► mobile app / admin console
```

## How accuracy is kept

- **Only official sources.** Outages come from REG's power-outage table and WASAC's announcements; every outage links back to
  its source, and the app always shows the source name.
- **Rwanda's real administrative map.** The API seeds all 5 provinces, 30 districts and 416 sectors
  (`apps/api/src/locations/rwanda-administrative-divisions.ts`) so residents can follow any district or sector.
- **Kigali time everywhere.** Rwanda uses CAT (UTC+2, no daylight saving). The collector attaches `+02:00` to every time it
  parses, the API runs with `TZ=Africa/Kigali`, and the app formats times in Kigali time regardless of the phone's settings.
- **Real dates.** The year written by REG ("29th September 2026") is used; when a date has no year it is inferred from today's
  date, including across the December/January boundary.
- **No invented data.** WASAC notices give a date but no hours, so they are shown as "All day" and never given a made-up end
  time. Announcements without a date are skipped.
- **Area matching that follows the hierarchy.** REG/WASAC area names are matched to official sectors (tolerating Kinyarwanda
  r/l spellings such as *Nyakariro*/*Nyakaliro*). Following a district alerts you about every sector in it; following a sector
  also alerts you when the whole district is affected. If an area name is not an official sector (e.g. a neighbourhood), the
  whole district is alerted rather than silently missing the people who live there; the exact wording from the source is kept.
- **Status from the published times.** "In progress" / "Scheduled" / "Ended" is computed from the start and end times, and an
  outage without a published end time stops being shown as in progress after 24 hours.

## Running the backend

### Option A: everything in Docker (recommended, stays running)

Requires Docker Desktop to be running. PostgreSQL, Redis, the API and the collector (every 30 minutes) start
together and restart automatically:

```bash
cp .env.example apps/api/.env                            # set JWT_SECRET and COLLECTOR_API_KEY
cp services/data-collector/.env.example services/data-collector/.env   # same COLLECTOR_API_KEY
docker compose --profile full up -d --build
curl http://localhost:3000/health                        # {"status":"ok","database":"up","redis":"up",...}
cd apps/api && npm run smoke-test                        # 52 end-to-end checks against the running API
```

Logs: `docker logs -f utility-alerts-api` and `docker logs -f utility-alerts-collector`.

### Admin account

```bash
cd apps/api && npm run create-admin -- 0788123456 "a-strong-password" Aline Uwase
```

### Connecting the app to the API

| Where the app runs | `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` |
| --- | --- |
| Android emulator | `http://10.0.2.2:3000` |
| Physical phone (same Wi-Fi as the PC) | `http://<PC Wi-Fi IP>:3000`, e.g. `http://10.12.73.126:3000` (check with `ipconfig`; it can change) |

"Could not reach the Rwanda Utility Alerts server" means the app cannot open that URL: check that
`http://<that address>:3000/health` loads in the phone's browser.

### Option B: API and collector on your machine

Requirements: Node.js 22, Python 3.13, PostgreSQL and Redis (`docker compose up -d` starts only those two).

```bash
cp .env.example apps/api/.env          # then set JWT_SECRET and COLLECTOR_API_KEY
docker compose up -d                   # PostgreSQL on 5433, Redis on 6379

# API  →  http://localhost:3000   (seeds utilities and Rwanda's locations on start)
cd apps/api && npm install && npm run start:dev

# Collector (use the same COLLECTOR_API_KEY as the API)
cd services/data-collector
cp .env.example .env
pip install -r requirements.txt
python -m src.main                     # one run
python -m src.main --every 30          # every 30 minutes

# Mobile app
cd apps/mobile && npm install
echo "EXPO_PUBLIC_API_URL=http://10.0.2.2:3000" > .env   # Android emulator; use your PC's LAN IP on a phone
npx expo run:android

# Admin console  →  http://localhost:3001
cd apps/web && npm install && npx next dev -p 3001
```

Push notifications need a development or production build on a physical phone (Expo Go and emulators cannot receive them).
Set `EXPO_PUBLIC_EAS_PROJECT_ID` when building with EAS.

## Tests

```bash
cd apps/api && npm test                          # unit tests
cd apps/mobile && npm run typecheck && npm test
cd services/data-collector && python -m pytest
cd apps/web && npm run typecheck
```

## Main API endpoints

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/health` (database + Redis status) | public |
| POST | `/auth/register`, `/auth/login` | public (rate limited) |
| GET / PATCH | `/users/me`, PATCH `/users/me/password` | user |
| GET | `/outages/upcoming`, `/outages/active`, `/outages/:id` | public |
| GET / POST / DELETE | `/subscriptions` | user |
| GET / POST / PATCH | `/reports` | user |
| GET, PATCH `/:id/read` | `/notifications` | user |
| POST / DELETE | `/devices` | user |
| GET | `/locations`, `/locations/district/:district`, `/utilities` | public |
| POST | `/outages`, PATCH `/outages/:id/status`, `/locations`, `/utilities` | admin |
| GET | `/admin/*`, PATCH `/reports/:id/status` | admin |
| POST | `/outages/internal/collector`, `/data-sources/internal/report` | collector API key |

Background jobs in the API: outage statuses move to `active` when an outage starts and `completed` when it ends
(every 5 minutes), and alerts are queued in Redis and pushed through Expo.

## Support lines shown in the app

REG customer care **2727** (toll-free) · WASAC customer care **3535** (toll-free) · Emergency (Rwanda National Police) **112**.
