export type LedgerIntegrity = {
  valid: boolean;
  checkedReceipts: number;
  checkedBlocks: number;
  chainHeight: number;
  chainHead: string | null;
  network: "Honey Chain Local PoA";
  consensus: "LOCAL_POA";
  validatorId: string;
  failure?: string;
};

export type PublicTrace = {
  traceId: string;
  integrity: LedgerIntegrity;
  bottle: {
    productName: string;
    netWeightGrams: number;
    packagedAt: string;
    bestBefore: string;
  };
  batch: {
    id: string;
    name: string;
    floralProfile: string;
    origin: string;
    harvestedAt: string;
    producer: string;
  };
  processing: { method: string; processor: string } | null;
  events: Array<{
    id: string;
    type: string;
    occurredAt: string;
    publicSummary: string;
    organization: string;
    receiptHash: string | null;
    block: {
      height: number;
      hash: string;
      previousHash: string | null;
      eventHash: string;
      validatorId: string;
      signature: string;
      consensus: string;
    } | null;
  }>;
  certificate: {
    number: string;
    issuedAt: string;
    signer: string;
    sha256: string;
    laboratory: string;
    moisturePct: string;
    pollenProfile: string;
    adulteration: string;
    status: string;
    notes: string | null;
  } | null;
};
