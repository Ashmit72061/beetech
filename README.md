# Honey Chain

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Demo runbook](docs/DEMO_RUNBOOK.md)
- [Open production questions](docs/OPEN_QUESTIONS.md)

## One-Command Presentation Demo

The launcher validates Docker, builds the production app, starts PostgreSQL, applies migrations, adds any missing seed records, waits for application health, sends a fresh telemetry cycle, and prints the judge-ready URLs.

```bash
./start.sh
```

Normal startup preserves demo state. Use `./start.sh --reset` for an interactive clean reset, or `./start.sh --reset --yes` in non-interactive use. Other options are `--no-build`, `--no-telemetry`, and `--timeout SECONDS`.

For QR scanning from a separate phone, start with a reachable LAN or HTTPS origin, for example `PUBLIC_APP_ORIGIN=http://192.168.1.20:3001 ./start.sh`. The generated QR always uses this configured origin; never use an untrusted request Host header.

Open [http://localhost:3001](http://localhost:3001). Health, including a database query, is available at [http://localhost:3001/api/health](http://localhost:3001/api/health). Set `APP_PORT` to change the host port.

For Docker-backed browser tests, use `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 PLAYWRIGHT_WORKERS=1 npm run test:e2e`. The suite resets only this named demo database through the administrator-only demo endpoint.

The demo database is intentionally isolated from any local `honey_chain` instance:

- Database URL: `postgresql://honey_chain:honey_chain_demo@localhost:55432/honey_chain_demo?schema=public`
- PostgreSQL host port: `55432`
- Database: `honey_chain_demo`
- Password: `honey_chain_demo`
- Demo login password for every seeded account: `honey123`

Seeded accounts are `beekeeper@honeychain.in`, `manufacturer@honeychain.in`, `lab@honeychain.in`, `consumer@honeychain.in`, and `admin@honeychain.in`.

The presentation seed contains three regional source batches, seven bottle identities, three quality certificates, one rejection/remediation/retest story, and a local proof-of-authority block for every provenance event. The canonical bottle is `HC-BK102-B260906-03-000347`; its printable batch sheet is at `/labels?batch=HC-BK102-B260906-03`.

The named `honey_chain_demo_data` volume persists data between restarts. To intentionally discard only the Docker demo database, run:

```bash
docker compose down -v
```

IoT ingestion requires a device credential bound to a specific hive. Compose creates only predictable demo bindings for `demo-08`, `demo-12`, and `demo-15`; production must set `IOT_DEVICE_BINDINGS` with unique secrets.

## Local Development

Copy the documented isolated database configuration, then start the database and application separately:

```bash
cp .env.example .env
docker compose up -d db
npm ci
npm run prisma:generate
npm run db:setup
npm run dev
```

Run checks with:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment Notes

The production image uses Node 22, a non-root user, and Next.js `output: "standalone"`. Compose credentials are demo-only defaults; use deployment-specific secret injection, `PUBLIC_APP_ORIGIN`, a non-demo `DEMO_MODE` value, and a managed PostgreSQL database in production. Apply migrations before rolling application replicas, and do not run the demo seed against a production database.
