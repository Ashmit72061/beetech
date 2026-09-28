# Honey Chain Demo Runbook

## Demo Scope

These steps describe the isolated, seeded Docker demo. It demonstrates persisted workflow records, role enforcement, public traceability, a simulated hash-chain ledger, and local telemetry ingestion. It does not demonstrate production payments, identity verification, device lifecycle management, or externally anchored records.

## Startup and Reset

From the repository root, start or resume the demo:

```bash
./start.sh
```

The script preserves data by default, waits for health, sends a telemetry cycle, and prints every presentation URL. For a confirmed clean reset use `./start.sh --reset`; use `--yes` only for intentional non-interactive resets.

To reset the deterministic demo state without removing containers, sign in as the admin and select **Reset deterministic demo data** on the dashboard. To discard the isolated demo database completely:

```bash
docker compose down -v
docker compose up --build -d
```

## Demo Accounts

All seeded accounts use the shared demo-only password: `honey123`.

| Role | Email |
| --- | --- |
| Beekeeper | `beekeeper@honeychain.in` |
| Manufacturer | `manufacturer@honeychain.in` |
| Lab | `lab@honeychain.in` |
| Consumer | `consumer@honeychain.in` |
| Admin | `admin@honeychain.in` |

Known seeded trace ID: `HC-BK102-B260906-03-000347`.

Public verification page: `http://localhost:3001/verify?trace=HC-BK102-B260906-03-000347`

QR PNG endpoint: `http://localhost:3001/api/qr/HC-BK102-B260906-03-000347`

## Three-Minute Judge Sequence

Reset first if a prior demonstration changed inventory or audit-request state. Use a private browser window, or sign out between roles.

1. **0:00-0:30, public proof:** Open the verification URL above. Show the real QR on the bottle, source-to-bottle timeline, laboratory certificate, and local PoA integrity indicator. Expand a block proof to show its height, previous block, event commitment, validator, and attestation.
2. **0:25-0:50, beekeeper:** Sign in as `beekeeper@honeychain.in`. Open the dashboard and show the harvest/raw-listing actions plus Hive conditions. Point out the fresh simulator readings and intentionally stale Hive 15.
3. **0:50-1:20, manufacturer:** Sign in as `manufacturer@honeychain.in`. In the Golden path, generate three bottle QR identities from an approved run. Show the returned QR previews, open one bottle chain, then open the printable label sheet. Open Marketplace and show raw and packaged inventory.
4. **1:15-1:35, lab:** Sign in as `lab@honeychain.in`. Show the laboratory-review form and explain that only an approved batch can be packaged by the manufacturer.
5. **1:35-1:55, consumer:** Sign in as `consumer@honeychain.in`. Show the marketplace and the audit request experience. Do not place an order unless you plan to reset after the demo.
6. **1:55-2:20, admin:** Sign in as `admin@honeychain.in`. Show the seeded pending request for the known trace and select **Approve 7 days**.
7. **2:20-2:45, approved provenance:** Sign back in as `consumer@honeychain.in`, reopen the known trace's audit access, and show the protected data is now available to that requester. Explain that public trace data remains separate from this time-limited, user-specific approval.
8. **2:45-3:00, operational check:** Open the health endpoint and show its successful JSON response. State that the ledger is a verifiable local proof-of-authority blockchain with one demo authority, not a public chain.

## Telemetry Simulator

With the demo running, send one cycle:

```bash
npm run simulate:telemetry -- --once
```

Run continuously at the default interval:

```bash
npm run simulate:telemetry
```

The simulator uses local demo defaults, writes Hives 08 and 12, and deliberately leaves Hive 15 without a new reading. Do not reuse its local default credential outside the demo.

## Health Checks

```bash
docker compose ps
curl --fail http://localhost:3001/api/health
curl --fail -o /dev/null http://localhost:3001/api/qr/HC-BK102-B260906-03-000347
```

The health endpoint returns `{"status":"ok","database":"ok"}` when both the application and its database query are healthy. If Compose reports the app as unavailable, inspect service output with `docker compose logs app` and `docker compose logs migrate`.

## Recovery

- If the app starts before the database is ready, wait for the migration service to complete, then run `docker compose up -d` again.
- If the demo data is changed unexpectedly, use the administrator reset control. It is available only in the isolated demo environment.
- If the app or health check is still failing, run `docker compose ps`, inspect the app and migration logs, and recreate only the demo environment with `docker compose down -v` followed by the fresh-start command.
- If telemetry is rejected, confirm the local demo is running and execute the simulator command unchanged. Device-to-hive credential bindings are enforced; do not substitute an arbitrary hive or device identity.
