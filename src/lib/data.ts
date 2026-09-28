export type Role = "beekeeper" | "manufacturer" | "lab" | "consumer" | "admin";

export type ListingCategory =
  | "Hive/Colony Asset"
  | "Raw Honey Batch"
  | "Packaged Honey";

export type Listing = {
  id: string;
  category: ListingCategory;
  name: string;
  seller: string;
  location: string;
  price: number;
  unit: string;
  available: string;
  floral: string;
  rating: number;
  description: string;
  traceLabel: string;
  status: string;
  accent: string;
};

export const TRACE_ID = "HC-BK102-B260906-03-000347";
export const BATCH_ID = "HC-BK102-B260906-03";

export const demoAccounts: Array<{
  role: Role;
  title: string;
  email: string;
  person: string;
  organisation: string;
}> = [
  {
    role: "beekeeper",
    title: "Beekeeper",
    email: "beekeeper@honeychain.in",
    person: "Asha Devi",
    organisation: "Aravali Madhu Sakhi FPO",
  },
  {
    role: "manufacturer",
    title: "Manufacturer",
    email: "manufacturer@honeychain.in",
    person: "Rohan Mehta",
    organisation: "Madhur Foods",
  },
  {
    role: "lab",
    title: "Laboratory",
    email: "lab@honeychain.in",
    person: "Dr. Neha Kulkarni",
    organisation: "Bharat Quality Labs",
  },
  {
    role: "consumer",
    title: "Consumer",
    email: "consumer@honeychain.in",
    person: "Kavya Nair",
    organisation: "Independent buyer",
  },
  {
    role: "admin",
    title: "Administrator",
    email: "admin@honeychain.in",
    person: "Vikram Singh",
    organisation: "Honey Chain Governance Cell",
  },
];

export const roleMeta: Record<
  Role,
  { label: string; person: string; org: string; initials: string }
> = {
  beekeeper: {
    label: "Beekeeper",
    person: "Asha Devi",
    org: "Aravali Madhu Sakhi FPO",
    initials: "AD",
  },
  manufacturer: {
    label: "Manufacturer",
    person: "Rohan Mehta",
    org: "Madhur Foods",
    initials: "RM",
  },
  lab: {
    label: "Laboratory",
    person: "Dr. Neha Kulkarni",
    org: "Bharat Quality Labs",
    initials: "NK",
  },
  consumer: {
    label: "Consumer",
    person: "Kavya Nair",
    org: "Independent buyer",
    initials: "KN",
  },
  admin: {
    label: "Administrator",
    person: "Vikram Singh",
    org: "Honey Chain Governance Cell",
    initials: "VS",
  },
};

export const navByRole: Record<Role, string[]> = {
  beekeeper: [
    "Overview",
    "Apiaries & Hives",
    "Harvests & Batches",
    "Marketplace",
    "Smart Insights",
    "Traceability",
    "Sync Queue",
  ],
  manufacturer: [
    "Overview",
    "Procure",
    "Inputs",
    "Processing",
    "Lab Tests",
    "Packaging",
    "Marketplace",
    "Traceability",
  ],
  lab: ["Work queue", "Specimens", "Test results", "Certificates", "Approved batches"],
  consumer: ["Marketplace", "My orders", "Saved products", "Verify bottle"],
  admin: [
    "Command centre",
    "Organisations",
    "Users & roles",
    "Access requests",
    "Anomalies",
    "Audit ledger",
    "Blockchain proof",
  ],
};

export const listings: Listing[] = [
  {
    id: "HC-ASSET-RJ-BK102-H08",
    category: "Hive/Colony Asset",
    name: "Apis cerana colony · Hive 08",
    seller: "Aravali Madhu Sakhi FPO",
    location: "Dausa, Rajasthan",
    price: 6800,
    unit: "per colony",
    available: "1 registered colony",
    floral: "Mustard & wild neem",
    rating: 4.9,
    description:
      "A queen-right eight-frame colony with recent health inspection, feeding history and ownership record.",
    traceLabel: "Asset ownership history",
    status: "Health checked",
    accent: "#d89a24",
  },
  {
    id: BATCH_ID,
    category: "Raw Honey Batch",
    name: "Wild forest raw honey",
    seller: "Aravali Madhu Sakhi FPO",
    location: "Rajgarh, Rajasthan",
    price: 385,
    unit: "per kg",
    available: "186 kg available",
    floral: "Wild neem & acacia",
    rating: 4.8,
    description:
      "Single-apiary September harvest with sealed food-grade drums and a complete custody-ready batch record.",
    traceLabel: "Material lineage",
    status: "Lab tested",
    accent: "#b97321",
  },
  {
    id: "HC-MF221-P260912-02",
    category: "Packaged Honey",
    name: "Wild Forest Honey",
    seller: "Madhur Foods",
    location: "Jaipur, Rajasthan",
    price: 449,
    unit: "500 g jar",
    available: "420 jars available",
    floral: "Wild neem & acacia",
    rating: 4.9,
    description:
      "Slow-filtered forest honey with independently reviewed quality results and bottle-level provenance.",
    traceLabel: "Bottle-to-source lineage",
    status: "Traceability complete",
    accent: "#e3ad38",
  },
  {
    id: "HC-MF117-P260829-01",
    category: "Packaged Honey",
    name: "Himalayan Multi-flora Honey",
    seller: "Pahadi Ras Foods",
    location: "Haldwani, Uttarakhand",
    price: 525,
    unit: "500 g jar",
    available: "168 jars available",
    floral: "Rhododendron & clover",
    rating: 4.7,
    description:
      "Aromatic mountain honey collected across smallholder apiaries and packed in a verified lot.",
    traceLabel: "Bottle-to-source lineage",
    status: "Traceability complete",
    accent: "#c98c2f",
  },
  {
    id: "HC-BK228-B260902-01",
    category: "Raw Honey Batch",
    name: "Litchi blossom raw honey",
    seller: "Vaishali Bee Collective",
    location: "Muzaffarpur, Bihar",
    price: 410,
    unit: "per kg",
    available: "94 kg available",
    floral: "Litchi blossom",
    rating: 4.8,
    description:
      "Light, fragrant monofloral honey harvested at peak litchi bloom and stored in sealed drums.",
    traceLabel: "Material lineage",
    status: "Batch approved",
    accent: "#edbe52",
  },
  {
    id: "HC-ASSET-UP-BK311-H17",
    category: "Hive/Colony Asset",
    name: "Apis mellifera colony · Hive 17",
    seller: "Ganga Apiary Cooperative",
    location: "Saharanpur, Uttar Pradesh",
    price: 7450,
    unit: "per colony",
    available: "1 registered colony",
    floral: "Eucalyptus belt",
    rating: 4.6,
    description:
      "Ten-frame production colony with a young marked queen and six months of inspection records.",
    traceLabel: "Asset ownership history",
    status: "Health checked",
    accent: "#a8651f",
  },
];

export const traceTimeline = [
  {
    title: "Harvest recorded",
    date: "06 Sep 2026 · 07:42",
    detail: "Wild forest forage · Rajgarh apiary cluster",
    actor: "Aravali Madhu Sakhi FPO",
  },
  {
    title: "Batch sealed",
    date: "06 Sep 2026 · 11:18",
    detail: `${BATCH_ID} created from Hives 08, 12 and 15`,
    actor: "Asha Devi",
  },
  {
    title: "Custody received",
    date: "08 Sep 2026 · 15:36",
    detail: "Seal integrity confirmed at Jaipur processing unit",
    actor: "Madhur Foods",
  },
  {
    title: "Quality approved",
    date: "10 Sep 2026 · 17:05",
    detail: "Moisture 17.4% · Adulteration screen: Not detected",
    actor: "Bharat Quality Labs",
  },
  {
    title: "Bottled and secured",
    date: "12 Sep 2026 · 09:24",
    detail: "Bottle 000347 · Tamper-evident proof anchored",
    actor: "Madhur Foods",
  },
];

export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
