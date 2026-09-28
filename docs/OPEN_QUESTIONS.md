# Open Questions for Production

## Purpose

The items below are deliberate product, legal, and operational decisions deferred from the demonstration. The current demo behavior is sufficient for a controlled walkthrough; each item needs an owner and policy before production use.

| Area | Implemented demo behavior | Production decision required |
| --- | --- | --- |
| Legal identity and KYC | Seeded organizations and users are trusted records. | Define onboarding, legal-entity verification, beneficial-owner checks, verification evidence, and revalidation. |
| Marketplace settlement and payment | Orders become `CONFIRMED`; no money moves. | Select payment rails, tax/invoicing, escrow or settlement timing, refunds, disputes, and reconciliation. |
| Custody acceptance | A raw-material order appends a custody-transfer event. | Define sender/receiver acceptance, evidence of seal condition, partial receipt, rejection, and transfer-of-risk rules. |
| Quantity conversion, blending, and splitting | A processing run uses one batch; packaging enforces aggregate bottle weight against recorded output. | Model calibrated loss, multiple inputs, blends, splits, repackaging, and policy-owned mass-balance tolerances. |
| Certificate files and signatures | Certificate metadata and a content hash are stored; file URL is optional. | Define durable file retention, signed source documents, signer identity, revocation, versioning, and laboratory accreditation evidence. |
| Provenance visibility | Public traces expose curated summaries; approved requests expose stored protected event data for seven days. | Classify every field as public, partner-only, regulator-only, or private; set consent, redaction, retention, and disclosure rules. |
| Audit approval policy and expiry | An admin can approve a request for seven days or deny it. | Define approvers, delegation, evidence requirements, purpose limitation, renewal, revocation, notification, and audit trail policy. |
| Chain anchoring | Receipts and local PoA blocks form append-only SHA-256 chains with one configured demo authority. | Choose distributed validators or an external chain, authority governance, anchoring cadence, proof storage, cost, and verification UX. |
| Device provisioning and rotation | Local demo device identities are predictably bound to three hives. | Define manufacturing identity, enrollment, attestation, per-device secrets or certificates, rotation, revocation, and inventory management. |
| Offline conflict policy | Telemetry retries are idempotent; stale readings display as offline. | Define clock trust, queued/offline data ordering, duplicate/conflicting readings, correction records, and operator escalation. |
| Localization scope | Demo text and currency presentation target one English/INR walkthrough. | Decide languages, scripts, regional units and dates, accessibility review, translation ownership, and legal-copy localization. |
| Notifications | The demo has no notification delivery. | Select in-app, email, SMS, messaging, or webhook channels; define consent, templates, delivery tracking, and escalation. |
| Production hosting and secrets | Compose uses an isolated local database and demo settings. | Choose managed hosting, database, backups, observability, network controls, secret manager, rotation, incident response, and disaster recovery. |

None of these questions blocks the current demo. They do block treating the demo's records, approvals, orders, QR data, or credentials as production-grade evidence or operations.
