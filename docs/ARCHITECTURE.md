# Honey Chain Architecture

## Scope

Honey Chain is a Next.js 16 demonstration of traceable honey workflows. It persists demo data in PostgreSQL through Prisma and exposes both role-protected operations and public bottle verification. The implementation is suitable for a controlled demo, not production certification, payments, or a public blockchain.

## Application and Data

- **Next.js:** App Router pages provide the public landing, marketplace, verification, login, and dashboard experiences. Route handlers under `src/app/api` implement the server API.
- **PostgreSQL and Prisma:** Prisma models cover organizations, users, sessions, hives, telemetry, batches, processing runs, lab tests, certificates, bottles, marketplace records, audit requests, provenance events, and ledger receipts. Checked-in migrations initialize the database; `prisma/seed.ts` creates deterministic demo data.
- **Opaque sessions:** Successful login creates a random token in the `hc_session` HTTP-only, same-site cookie. PostgreSQL stores only its SHA-256 hash, expiry, and user relationship. Sessions last 14 days, refresh `lastSeenAt` on use, and are removed when expired, inactive, or signed out.

## Roles and Boundaries

Authorization is enforced in the route handlers, not only in the dashboard UI.

| Role | Implemented demo permissions |
| --- | --- |
| Beekeeper | Record its organization's harvests and publish its raw-batch listings; view telemetry for its organization's hives. |
| Manufacturer | Procure raw-batch listings, start processing from quantities it procured, request a lab test, package lab-approved material, and publish bottles it produced. |
| Lab | Review tests assigned to its laboratory, approve or reject a batch, and issue a record-backed certificate on approval. |
| Consumer | Save marketplace listings, buy packaged-honey listings, submit audit-access requests, and view its approved protected provenance. |
| Admin | View all hives' telemetry and decide audit-access requests. In demo mode only, reset the isolated database. |

The marketplace API lists active inventory publicly. Saving a listing requires a session. Ordering is performed through the workflow API: manufacturers may buy raw batches, consumers may buy packaged honey, users cannot buy their own listing, and inventory is decremented transactionally. Orders are recorded as confirmed demo orders; no payment, settlement, shipment, or legal transfer is implemented.

## Workflow and Ledger

`/api/workflow` validates typed actions with Zod and executes each accepted action in a database transaction. The demo workflow is harvest, raw listing, manufacturer procurement, processing, lab request/review, packaging, packaged listing, and consumer order. Packaging requires a laboratory-approved batch and prevents packaging more grams than the run's available output.

Each provenance-bearing workflow action writes a `ProvenanceEvent`, a `LedgerReceipt`, and a `LedgerBlock` in one database transaction. Receipt hashes are SHA-256 values over canonical JSON and the preceding receipt hash, beginning with `GENESIS`. Each explicit block commits the receipt hash and event hash, links to the preceding block, and carries an HMAC-SHA256 attestation from the configured local proof-of-authority validator. A PostgreSQL advisory transaction lock serializes receipt and block height assignment.

Verification checks contiguous receipt sequences and block heights, both previous-hash links, canonical event binding, event commitments, block hashes, validator identity, and validator signatures. Blocks and receipts are append-only through PostgreSQL triggers. This is a self-contained local PoA blockchain for demonstration: it has one configured authority and no independent validator network, external timestamp authority, public-chain anchoring, or immutability guarantee against a privileged database operator.

## Traceability and Public APIs

A bottle has a unique trace ID. `GET /api/trace/:traceId` returns the public bottle, batch, processing, event, certificate, and integrity view. `GET /api/receipts/:hash` returns a receipt and integrity result; `GET /api/certificates/:number` returns certificate metadata.

`GET /api/qr/:traceId` returns a high-error-correction PNG QR code containing the configured public verification URL, `verify?trace=<traceId>`. `GET /api/qr/batch/:batchId` returns a QR manifest, and `/labels?batch=<batchId>` renders a printable label sheet. The endpoint uses the configured public origin rather than the request Host header. It returns 404 for an unknown trace and 503 when no valid public origin is configured.

Packaging accepts one to 24 bottles per demo transaction, validates aggregate mass balance, allocates monotonically increasing six-digit serials within the batch, and creates one bottle, provenance event, receipt, and block per identity. The public trace includes shared batch events plus only the selected processing run and bottle-specific events, preventing sibling bottle data from leaking into the journey.

Public trace output exposes event summaries and certificate metadata. Event `protectedData`, such as the buyer details attached to an order, is not exposed there. A consumer may submit an audit request; an admin approval grants that requester protected-event access for seven days. The exact public/protected data classification is a production policy decision.

## IoT Telemetry

`POST /api/telemetry` accepts a validated reading only when the bearer credential is bound to both its device ID and hive ID. Readings are idempotent on caller-provided `idempotencyKey`; an accepted retry returns the original telemetry ID. Timestamps are limited to the prior 90 days and no more than five minutes in the future.

The local simulator posts readings for Hives 08 and 12 and intentionally omits Hive 15 to show stale-device behavior. `GET /api/telemetry` is limited to beekeeper and admin sessions; beekeepers are scoped to their organization. Dashboard insights use deterministic thresholds, explicitly not machine-learning predictions.

## Docker Topology

Docker Compose runs three services:

1. `db`: PostgreSQL 16 with a named, isolated demo volume and a readiness check.
2. `migrate`: a one-shot image stage that applies Prisma migrations and runs the deterministic seed after the database is healthy.
3. `app`: the non-root Next.js standalone runtime, started only after migration and seeding finish successfully.

The application container talks to PostgreSQL over the Compose network. The app's host port is configurable through the documented local port setting. The demo reset endpoint is enabled only when demo mode is true and is protected by the administrator role.

## Data Flow

1. A role signs in; the server stores a hashed opaque session and returns its cookie.
2. A beekeeper records a batch and publishes it as raw inventory; the action appends an event and receipt.
3. A manufacturer orders that inventory, then starts processing and requests laboratory review; each workflow transition remains transactionally recorded.
4. The lab records the result and, on approval, creates certificate metadata and updates the batch status.
5. The manufacturer packages a uniquely traceable bottle, publishes it, and a consumer order records a terminal-sale event.
6. A public user scans or opens the QR URL. The server resolves the bottle lineage and validates the receipt chain before returning the trace view.
7. Separately, a bound device or local simulator sends telemetry. The server stores the reading idempotently; authorized dashboards render recent readings and deterministic flags.
