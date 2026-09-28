import { createHash, createHmac, timingSafeEqual } from "crypto";

export function canonicalize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Ledger values must be finite JSON numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value !== "object") throw new TypeError("Ledger values must be valid JSON.");
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function createLedgerHash(previousHash: string | null, payload: unknown) {
  return createHash("sha256").update(`${previousHash ?? "GENESIS"}\n${canonicalize(payload)}`).digest("hex");
}

export const hashCanonicalValue = (value: unknown) => createHash("sha256").update(canonicalize(value)).digest("hex");

export type BlockHeader = {
  height: number;
  receiptHash: string;
  eventHash: string;
  previousHash: string | null;
  validatorId: string;
  createdAt: string;
};

export function createBlockHash(header: BlockHeader) {
  return createHash("sha256").update(`HONEY_CHAIN_BLOCK_V1\n${canonicalize(header)}`).digest("hex");
}

export function localValidator() {
  return {
    id: process.env.LOCAL_BLOCKCHAIN_VALIDATOR_ID || "HC-POA-VALIDATOR-01",
    secret: process.env.LOCAL_BLOCKCHAIN_VALIDATOR_SECRET || "honey-chain-local-validator-demo-secret",
  };
}

export function createValidatorSignature(blockHash: string, secret = localValidator().secret) {
  return createHmac("sha256", secret).update(`HONEY_CHAIN_POA_V1\n${blockHash}`).digest("hex");
}

export function verifyValidatorSignature(blockHash: string, signature: string, secret = localValidator().secret) {
  const expected = Buffer.from(createValidatorSignature(blockHash, secret), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
