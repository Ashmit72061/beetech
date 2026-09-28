# Honey Chain Agent Handoff

## Start Here

- Run the complete presentation stack with `./start.sh`.
- Preserve state by default. Use `./start.sh --reset` only when a clean deterministic demo is intentional.
- Run checks with `npm run lint`, `npm run typecheck`, and `DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public PUBLIC_APP_ORIGIN=http://localhost:3001 DEMO_MODE=true npm run build`.
- Run browser tests with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 PLAYWRIGHT_WORKERS=1 npm run test:e2e`.

## Architecture Map

- `prisma/schema.prisma`: persisted domain, receipts, and local PoA blocks.
- `prisma/seed.ts`: additive deterministic presentation dataset. Explicit reset truncates first.
- `src/lib/workflow.ts`: atomic event, receipt, and block append logic.
- `src/lib/domain/ledger.ts`: canonical JSON, SHA-256 block/receipt hashes, and validator attestations.
- `src/lib/trace.ts`: whole-chain validation and bottle-scoped public lineage.
- `src/app/api/workflow/route.ts`: role-enforced operational mutations and multi-bottle packaging.
- `src/app/api/qr`: individual QR PNG and batch manifest endpoints.
- `src/app/verify/page.tsx`: public bottle chain explorer.
- `src/app/labels/page.tsx`: printable per-batch QR labels.
- `docs/DEMO_RUNBOOK.md`: judge sequence and recovery.

## Ledger Invariants

- Every `ProvenanceEvent` has exactly one `LedgerReceipt` and one `LedgerBlock`.
- Receipt sequences and block heights are contiguous and globally serialized under advisory lock `817263`.
- Corrections append a new event; never update or delete events, receipts, or blocks.
- Public bottle traces include shared batch events and only the selected run/bottle events.
- Protected order data remains in `ProvenanceEvent.protectedData`; blocks contain commitments only.
- `LOCAL_BLOCKCHAIN_VALIDATOR_ID` and `LOCAL_BLOCKCHAIN_VALIDATOR_SECRET` must match between migration/seed and app services.
- Call the implementation a local proof-of-authority blockchain, not a public or decentralized chain.

## Stable Demo IDs

- Canonical bottle: `HC-BK102-B260906-03-000347`
- Canonical batch: `HC-BK102-B260906-03`
- Lab certificate: `BQL-26-0910-884`
- Demo password: `honey123`
