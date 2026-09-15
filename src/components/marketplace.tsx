"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";
import { Listing, ListingCategory, listings, money, roleMeta } from "@/lib/data";
import { Field, Modal, Status, Toast, useToast } from "@/components/ui";
import {
  accountKey,
  categoryAuditLabel,
  CUSTOM_LISTINGS_KEY,
  MarketplaceOrder,
  tr,
  useLocale,
  useSession,
  useStoredData,
  writeJson,
} from "@/lib/storage";

const categories: Array<"All" | ListingCategory> = [
  "All",
  "Hive/Colony Asset",
  "Raw Honey Batch",
  "Packaged Honey",
];
const noListings: Listing[] = [];
const noIds: string[] = [];
const noOrders: MarketplaceOrder[] = [];

function ProductArt({ listing }: { listing: Listing }) {
  const type =
    listing.category === "Hive/Colony Asset"
      ? "HIVE"
      : listing.category === "Raw Honey Batch"
        ? "BATCH"
        : "BOTTLE";
  return (
    <div className="product-art" style={{ "--art": listing.accent } as React.CSSProperties}>
      <div className={`product-shape shape-${type.toLowerCase()}`}>
        <span>{type}</span>
        <strong>{listing.id.split("-").at(-1)}</strong>
      </div>
      <div className="art-hex art-hex-one" />
      <div className="art-hex art-hex-two" />
    </div>
  );
}

export function Marketplace({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const session = useSession();
  const { locale } = useLocale();
  const customListings = useStoredData(CUSTOM_LISTINGS_KEY, noListings);
  const allListings = [...listings, ...customListings];
  const savedKey = session ? accountKey(session, "saved-listings") : "";
  const ordersKey = session ? accountKey(session, "orders") : "";
  const saved = useStoredData(savedKey, noIds);
  const orders = useStoredData(ordersKey, noOrders);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Featured");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [ordering, setOrdering] = useState<Listing | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [orderReference, setOrderReference] = useState("");
  const [quantity, setQuantity] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const toast = useToast();

  let visible = allListings.filter((listing) => {
    const categoryMatches = category === "All" || listing.category === category;
    const haystack = `${listing.name} ${listing.location} ${listing.seller} ${listing.floral}`.toLowerCase();
    return categoryMatches && haystack.includes(deferredQuery.toLowerCase());
  });
  if (sort === "Price: low to high") visible = [...visible].sort((a, b) => a.price - b.price);
  if (sort === "Top rated") visible = [...visible].sort((a, b) => b.rating - a.rating);

  function beginOrder(listing: Listing) {
    if (!session) {
      router.push("/login?next=/marketplace");
      return;
    }
    setSelected(null);
    setOrdering(listing);
    setConfirmed(false);
    setQuantity(1);
  }

  function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ordering) return;
    const reference = `HC-ORD-${Date.now().toString().slice(-6)}`;
    if (!session) return;
    const order: MarketplaceOrder = {
      id: reference,
      category: ordering.category,
      listingId: ordering.id,
      item: ordering.name,
      buyerEmail: session.email,
      buyerRole: session.activeRole,
      buyerOrganisation: session.activeRole === session.accountRole ? session.organisation : roleMeta[session.activeRole].org,
      seller: ordering.seller,
      quantity,
      total: ordering.price * quantity,
      timestamp: new Date().toISOString(),
      auditEvent: categoryAuditLabel(ordering.category),
      status: "Confirmed",
    };
    writeJson(ordersKey, [order, ...orders]);
    setOrderReference(reference);
    setConfirmed(true);
    toast.show("Order recorded and traceability event created");
  }

  function toggleSaved(id: string) {
    if (!session) {
      router.push("/login?next=/marketplace");
      return;
    }
    writeJson(savedKey, saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]);
  }

  return (
    <div className={`marketplace ${compact ? "marketplace-compact" : ""}`}>
      {!compact && (
        <div className="section-heading marketplace-heading">
          <div>
            <span className="eyebrow">{tr(locale, "Verified marketplace", "सत्यापित बाज़ार")}</span>
            <h1>{tr(locale, "Source with confidence", "भरोसे के साथ खरीदें")}</h1>
            <p>{tr(locale, "Registered colonies, traceable harvests and bottle-level verified honey.", "पंजीकृत कॉलोनी, खोज-योग्य कटाई और बोतल-स्तरीय सत्यापित शहद।")}</p>
          </div>
          <div className="market-stat">
            <strong>126</strong>
            <span>active verified listings</span>
          </div>
        </div>
      )}

      <div className="market-controls">
        <label className="search-control">
          <Search size={19} />
          <span className="sr-only">Search marketplace</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr(locale, "Search honey, floral source or location", "शहद, पुष्प स्रोत या स्थान खोजें")}
          />
        </label>
        <label className="select-control">
          <span className="sr-only">Sort listings</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option>Featured</option>
            <option>Price: low to high</option>
            <option>Top rated</option>
          </select>
          <ChevronDown size={16} />
        </label>
      </div>

      <div className="category-tabs" role="group" aria-label="Listing category">
        {categories.map((item) => (
          <button
            type="button"
            className={item === category ? "active" : ""}
            onClick={() => setCategory(item)}
            key={item}
          >
            {locale === "hi" ? ({ All: "सभी", "Hive/Colony Asset": "छत्ता/कॉलोनी संपत्ति", "Raw Honey Batch": "कच्चा शहद बैच", "Packaged Honey": "पैक किया शहद" } as Record<string, string>)[item] : item}
          </button>
        ))}
      </div>

      <div className="market-meta">
        <span>{visible.length} listings match your search</span>
        <span><ShieldCheck size={16} /> Every listing is identity checked</span>
      </div>

      <div className="product-grid">
        {visible.map((listing) => (
          <article className="product-card" key={listing.id}>
            <div className="product-visual">
              <ProductArt listing={listing} />
              <button
                className={`save-button ${saved.includes(listing.id) ? "saved" : ""}`}
                type="button"
                onClick={() => toggleSaved(listing.id)}
                aria-label={saved.includes(listing.id) ? `Remove ${listing.name} from saved products` : `Save ${listing.name}`}
              >
                <Heart size={18} fill={saved.includes(listing.id) ? "currentColor" : "none"} />
              </button>
              <span className="product-category">{listing.category}</span>
            </div>
            <div className="product-body">
              <div className="product-status-row">
                <Status>{listing.status}</Status>
                <span className="rating"><Star size={14} fill="currentColor" /> {listing.rating}</span>
              </div>
              <h3>{listing.name}</h3>
              <p className="seller">by {listing.seller}</p>
              <p className="location"><MapPin size={15} /> {listing.location}</p>
              <div className="trace-type">
                <span>{listing.category === "Hive/Colony Asset" ? "Ownership" : "Lineage"}</span>
                <strong>{listing.traceLabel}</strong>
              </div>
              <div className="product-foot">
                <div><strong>{money(listing.price)}</strong><span>{listing.unit}</span></div>
                <button className="button button-small button-dark" type="button" onClick={() => setSelected(listing)}>
                  {tr(locale, "View listing", "लिस्टिंग देखें")} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty-state">
          <Search size={28} />
          <h3>No listings found</h3>
          <p>Try another category, location or floral source.</p>
          <button className="text-button" type="button" onClick={() => { setCategory("All"); setQuery(""); }}>
            Clear filters
          </button>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || tr(locale, "Listing details", "लिस्टिंग विवरण")}
        eyebrow={selected?.category}
        wide
      >
        {selected && (
          <div className="listing-detail">
            <ProductArt listing={selected} />
            <div>
              <div className="detail-id">{selected.id}</div>
              <p className="detail-copy">{selected.description}</p>
              <dl className="detail-list">
                <div><dt>Seller</dt><dd>{selected.seller}</dd></div>
                <div><dt>Source</dt><dd>{selected.location}</dd></div>
                <div><dt>Floral profile</dt><dd>{selected.floral}</dd></div>
                <div><dt>Availability</dt><dd>{selected.available}</dd></div>
                <div><dt>Traceability</dt><dd>{selected.traceLabel}</dd></div>
              </dl>
              <div className="modal-actions spread">
                <div className="listing-price"><strong>{money(selected.price)}</strong><span>{selected.unit}</span></div>
                <button className="button button-primary" type="button" onClick={() => beginOrder(selected)}>
                  {tr(locale, "Place order", "ऑर्डर करें")} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(ordering)}
        onClose={() => setOrdering(null)}
        title={confirmed ? tr(locale, "Order confirmed", "ऑर्डर की पुष्टि हुई") : tr(locale, "Confirm your order", "अपने ऑर्डर की पुष्टि करें")}
        eyebrow={confirmed ? "Traceability updated" : ordering?.category}
      >
        {ordering && !confirmed && (
          <form onSubmit={placeOrder} className="form-stack">
            <div className="order-summary">
              <div>
                <strong>{ordering.name}</strong>
                <span>{ordering.seller}</span>
              </div>
              <strong>{money(ordering.price * quantity)}</strong>
            </div>
            <div className="form-grid">
              <Field label={tr(locale, "Quantity", "मात्रा")}>
                <input type="number" min="1" max="50" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
              </Field>
              <Field label={tr(locale, "Active buyer role", "सक्रिय खरीदार भूमिका")}>
                <input value={session ? roleMeta[session.activeRole].label : ""} readOnly />
              </Field>
            </div>
            <Field label={tr(locale, "Delivery contact", "डिलीवरी संपर्क")}>
              <input type="text" defaultValue="Kavya Nair" required />
            </Field>
            <Field label={tr(locale, "Delivery location", "डिलीवरी स्थान")} hint={tr(locale, "The seller will confirm availability and collection or delivery details.", "विक्रेता उपलब्धता और डिलीवरी विवरण की पुष्टि करेगा।")}>
              <input type="text" defaultValue="Indiranagar, Bengaluru, Karnataka" required />
            </Field>
            <div className="order-note"><ShieldCheck size={18} /><span>This order adds the correct ownership, custody or consumer-sale event to the product record.</span></div>
            <button className="button button-primary button-block" type="submit">{tr(locale, "Confirm order", "ऑर्डर की पुष्टि करें")} · {money(ordering.price * quantity)}</button>
          </form>
        )}
        {ordering && confirmed && (
          <div className="success-panel">
            <span className="success-icon"><Check size={30} /></span>
            <h3>{tr(locale, "Your order is recorded", "आपका ऑर्डर दर्ज हो गया है")}</h3>
            <p>{tr(locale, `${ordering.name} has been reserved. The seller will contact you with the next steps.`, `${ordering.name} आरक्षित है। विक्रेता अगले चरणों के लिए आपसे संपर्क करेगा।`)}</p>
            <div className="confirmation-code"><span>Order reference</span><strong>{orderReference}</strong></div>
            <button className="button button-dark button-block" type="button" onClick={() => setOrdering(null)}>
              {tr(locale, "Continue browsing", "खरीदारी जारी रखें")}
            </button>
          </div>
        )}
      </Modal>
      <Toast message={toast.message} />
    </div>
  );
}
