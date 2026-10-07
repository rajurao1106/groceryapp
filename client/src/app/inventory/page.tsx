"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useProductCatalog, type Product } from "@/components/product-catalog-provider";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";

type StockFilter = "All stock" | "Low stock" | "Out of stock" | "Expiring soon";
type AdjustmentType = "receive" | "correction";

const stockDetails: Record<string, { reserved: number; damaged: number; expiryDays?: number; batch?: string }> = {
  "FR-MNG-001": { reserved: 3, damaged: 0, expiryDays: 8, batch: "MNG-2409" },
  "DA-MLK-014": { reserved: 1, damaged: 0, expiryDays: 2, batch: "MLK-8812" },
  "BK-BRD-008": { reserved: 2, damaged: 0, expiryDays: 3, batch: "BRD-5104" },
  "VG-SPN-021": { reserved: 0, damaged: 0, expiryDays: 1, batch: "SPN-3210" },
  "PT-RCE-005": { reserved: 5, damaged: 1, batch: "RCE-7741" },
  "DA-EGG-009": { reserved: 2, damaged: 0, expiryDays: 6, batch: "EGG-1490" },
  "FR-LIM-017": { reserved: 1, damaged: 0, expiryDays: 7, batch: "LIM-6802" },
  "VG-CUC-032": { reserved: 4, damaged: 0, expiryDays: 5, batch: "CUC-2148" },
};

const initialMovements = [
  { product: "India Gate Basmati Rice", sku: "PT-RCE-005", change: "+12", reason: "Purchase received", time: "Today, 10:18 AM", tone: "positive" },
  { product: "Amul Taaza Milk", sku: "DA-MLK-014", change: "−3", reason: "Order fulfilment", time: "Today, 9:52 AM", tone: "negative" },
  { product: "Whole Wheat Bread", sku: "BK-BRD-008", change: "−2", reason: "Order fulfilment", time: "Today, 9:34 AM", tone: "negative" },
  { product: "Alphonso Mango", sku: "FR-MNG-001", change: "+24", reason: "Opening stock", time: "Today, 8:40 AM", tone: "positive" },
];

function InventoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "alert":
      return <svg {...common}><path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16h.01" /></svg>;
    case "box":
      return <svg {...common}><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" /></svg>;
    case "reserved":
      return <svg {...common}><path d="M5 7h14M5 12h14M5 17h14" /><circle cx="3" cy="7" r=".5" fill="currentColor" /><circle cx="3" cy="12" r=".5" fill="currentColor" /><circle cx="3" cy="17" r=".5" fill="currentColor" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "close":
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    default:
      return null;
  }
}

function formatExpiry(days?: number) {
  if (days === undefined) return "—";
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function stockState(available: number): "healthy" | "low" | "empty" {
  if (available <= 0) return "empty";
  if (available <= 10) return "low";
  return "healthy";
}

function StockBadge({ available }: { available: number }) {
  const state = stockState(available);
  const label = state === "empty" ? "Out of stock" : state === "low" ? "Low stock" : "In stock";
  const tone = state === "empty" ? "bg-[#fff0ee] text-[#ce6659]" : state === "low" ? "bg-[#fff3e5] text-[#c17a32]" : "bg-[#eaf6ed] text-[#32814c]";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${tone}`}>{label}</span>;
}

export default function InventoryPage() {
  const { products, adjustStock } = useProductCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [filter, setFilter] = useState<StockFilter>("All stock");
  const [sort, setSort] = useState("attention");
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("receive");
  const [adjustmentError, setAdjustmentError] = useState("");
  const [movements, setMovements] = useLocalStorageState("greenmart:demo:inventory-movements:v1", initialMovements);

  const inventoryRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const detail = stockDetails[product.sku] ?? { reserved: 0, damaged: 0 };
      const reserved = Math.min(detail.reserved, product.stock);
      const available = Math.max(0, product.stock - reserved - detail.damaged);
      const expiringSoon = detail.expiryDays !== undefined && detail.expiryDays <= 7;
      const matchesQuery = !query || [product.name, product.brand, product.sku].some((value) => value.toLowerCase().includes(query));
      const matchesCategory = category === "All categories" || product.category === category;
      const matchesFilter =
        filter === "All stock" ||
        (filter === "Low stock" && available > 0 && available <= 10) ||
        (filter === "Out of stock" && available === 0) ||
        (filter === "Expiring soon" && expiringSoon);
      return matchesQuery && matchesCategory && matchesFilter;
    });

    return [...filtered].sort((first, second) => {
      const firstDetail = stockDetails[first.sku] ?? { reserved: 0, damaged: 0 };
      const secondDetail = stockDetails[second.sku] ?? { reserved: 0, damaged: 0 };
      const firstAvailable = Math.max(0, first.stock - Math.min(firstDetail.reserved, first.stock) - firstDetail.damaged);
      const secondAvailable = Math.max(0, second.stock - Math.min(secondDetail.reserved, second.stock) - secondDetail.damaged);
      if (sort === "name") return first.name.localeCompare(second.name);
      if (sort === "quantity-low") return firstAvailable - secondAvailable;
      if (sort === "quantity-high") return secondAvailable - firstAvailable;
      return Number(secondAvailable <= 10) - Number(firstAvailable <= 10) || first.name.localeCompare(second.name);
    });
  }, [category, filter, products, search, sort]);

  const stockSummary = useMemo(() => {
    const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
    const reservedUnits = products.reduce((sum, product) => {
      const detail = stockDetails[product.sku] ?? { reserved: 0, damaged: 0 };
      return sum + Math.min(detail.reserved, product.stock);
    }, 0);
    const damagedUnits = products.reduce((sum, product) => sum + (stockDetails[product.sku]?.damaged ?? 0), 0);
    const availableUnits = Math.max(0, totalUnits - reservedUnits - damagedUnits);
    const lowStockCount = products.filter((product) => {
      const detail = stockDetails[product.sku] ?? { reserved: 0, damaged: 0 };
      const available = Math.max(0, product.stock - Math.min(detail.reserved, product.stock) - detail.damaged);
      return available > 0 && available <= 10;
    }).length;
    const expiringCount = products.filter((product) => {
      const days = stockDetails[product.sku]?.expiryDays;
      return days !== undefined && days <= 7 && product.stock > 0;
    }).length;
    return { totalUnits, reservedUnits, damagedUnits, availableUnits, lowStockCount, expiringCount };
  }, [products]);

  function openAdjustment(product: Product) {
    setAdjustingProduct(product);
    setAdjustmentType("receive");
    setAdjustmentError("");
  }

  function closeAdjustment() {
    setAdjustingProduct(null);
    setAdjustmentError("");
  }

  async function saveAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjustingProduct) return;
    const formData = new FormData(event.currentTarget);
    const quantity = Number(formData.get("quantity"));
    const reason = String(formData.get("reason") ?? "").trim();
    if (!Number.isInteger(quantity) || quantity < 0 || (adjustmentType === "receive" && quantity === 0) || !reason) {
      setAdjustmentError("Enter a valid whole-number quantity and choose a reason.");
      return;
    }

    const nextStock = adjustmentType === "receive" ? adjustingProduct.stock + quantity : quantity;
    const reserved = Math.min(stockDetails[adjustingProduct.sku]?.reserved ?? 0, adjustingProduct.stock);
    if (nextStock < reserved) {
      setAdjustmentError(`On-hand stock cannot be less than ${reserved} reserved units.`);
      return;
    }

    const change = nextStock - adjustingProduct.stock;
    try {
      await adjustStock(adjustingProduct.id, nextStock);
    } catch (cause) {
      setAdjustmentError(cause instanceof Error ? cause.message : "Unable to update stock.");
      return;
    }
    setMovements((current) => [{
      product: adjustingProduct.name,
      sku: adjustingProduct.sku,
      change: `${change > 0 ? "+" : ""}${change}`,
      reason,
      time: "Just now",
      tone: change >= 0 ? "positive" : "negative",
    }, ...current].slice(0, 8));
    closeAdjustment();
  }

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Inventory" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Inventory" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px] flex items-center justify-between gap-[18px] max-[640px]:items-start max-[640px]:flex-col">
            <div>
              <p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">STOCK CONTROL</p>
              <h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Inventory</h1>
              <p className="m-0 text-[11px] text-[#818b85]">Track stock levels, reserved units and expiry alerts across your catalog.</p>
            </div>
            <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e] max-[640px]:w-full max-[640px]:justify-center" type="button" onClick={() => {
              const firstProduct = products.find((product) => product.status !== "Draft");
              if (firstProduct) openAdjustment(firstProduct);
            }}>
              <AdminIcon name="plus" size={16} />Adjust stock
            </button>
          </div>

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Inventory overview">
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#eaf2fb] text-[#4b81bc]"><InventoryIcon name="box" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Total on hand</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{stockSummary.totalUnits.toLocaleString("en-IN")}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">units across {products.length} products</small>
            </article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#e9f5ed] text-[#22834c]"><InventoryIcon name="check" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Available to sell</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{stockSummary.availableUnits.toLocaleString("en-IN")}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">after reservations &amp; damaged</small>
            </article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#f0edfb] text-[#7761bc]"><InventoryIcon name="reserved" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Reserved for orders</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{stockSummary.reservedUnits.toLocaleString("en-IN")}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">{stockSummary.damagedUnits} damaged units excluded</small>
            </article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#fff2e6] text-[#d4873b]"><InventoryIcon name="alert" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Needs attention</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{stockSummary.lowStockCount + stockSummary.expiringCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">{stockSummary.lowStockCount} low stock · {stockSummary.expiringCount} expiring</small>
            </article>
          </section>

          <section className="mb-[17px] grid grid-cols-2 gap-3 max-[760px]:grid-cols-1" aria-label="Inventory alerts">
            {stockSummary.lowStockCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-[#f3e6d5] bg-[#fffaf3] p-3">
                <span className="text-[#d4873b]"><InventoryIcon name="alert" size={16} /></span>
                <p className="m-0 flex flex-1 flex-col gap-1"><strong className="text-[9px] text-[#574632]">{stockSummary.lowStockCount} products are running low</strong><small className="text-[8px] text-[#9a8871]">Available stock is at or below 10 units.</small></p>
                <button className="border-0 bg-transparent text-[8px] font-bold text-[#a86b25]" type="button" onClick={() => setFilter("Low stock")}>Review low stock</button>
              </div>
            )}
            {stockSummary.expiringCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-lg border border-[#f0e4df] bg-[#fff8f5] p-3">
                <span className="text-[#c66a53]"><InventoryIcon name="clock" size={16} /></span>
                <p className="m-0 flex flex-1 flex-col gap-1"><strong className="text-[9px] text-[#57423d]">{stockSummary.expiringCount} batches expiring soon</strong><small className="text-[8px] text-[#99837d]">Review batch dates and rotate stock.</small></p>
                <button className="border-0 bg-transparent text-[8px] font-bold text-[#a85e48]" type="button" onClick={() => setFilter("Expiring soon")}>Review batches</button>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ee] px-[19px] py-[15px] max-[640px]:px-3">
              <div>
                <p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">STOCK OVERVIEW</p>
                <h2 className="mb-0 mt-1.5 text-[14px] font-bold text-[#334038]">Product inventory <span className="ml-1 rounded-full bg-[#f0f2f0] px-1.5 py-[3px] text-[8px] text-[#77827b]">{products.length}</span></h2>
              </div>
              <span className="flex items-center gap-1.5 text-[8px] text-[#849189] before:size-1.5 before:rounded-full before:bg-[#76b387]">Demo stock levels</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-[15px] max-[640px]:gap-2 max-[640px]:p-3">
              <label className="flex h-9 w-[270px] max-w-full items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[#8c9790] focus-within:border-[#8bb99a] focus-within:ring-2 focus-within:ring-[#18834b]/10">
                <InventoryIcon name="search" size={17} />
                <input className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#354139] outline-none placeholder:text-[#a0a9a3]"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product or SKU..."
                  aria-label="Search inventory by product or SKU"
                />
              </label>
              <label className="flex h-9 items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[9px] text-[#929c95]"><span>Category</span>
                <select className="max-w-[150px] border-0 bg-transparent text-[9px] font-semibold text-[#4e5a52] outline-none" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
                  <option>All categories</option>
                  {Array.from(new Set(products.map((product) => product.category))).sort().map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <div className="ml-auto flex items-center gap-[5px] whitespace-nowrap text-[9px] text-[#929c95] max-[1200px]:ml-0">
                <label htmlFor="inventory-sort">Sort:</label>
                <select className="max-w-36 border-0 bg-transparent text-[9px] font-semibold text-[#4e5a52] outline-none" id="inventory-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="attention">Needs attention</option>
                  <option value="name">Product name</option>
                  <option value="quantity-low">Available: low to high</option>
                  <option value="quantity-high">Available: high to low</option>
                </select>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-[#edf0ee] px-[15px] max-[640px]:px-3" aria-label="Filter inventory">
              {(["All stock", "Low stock", "Out of stock", "Expiring soon"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`relative inline-flex h-11 shrink-0 items-center gap-[7px] border-0 bg-transparent px-2 text-[9px] font-semibold ${filter === item ? "text-[#147744] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[#18834b]" : "text-[#77827b]"}`}
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                >
                  {item}
                  {item === "Low stock" && <span className="rounded-full bg-[#fff3e5] px-1.5 py-[3px] text-[8px] text-[#c17a32]">{stockSummary.lowStockCount}</span>}
                  {item === "Expiring soon" && <span className="rounded-full bg-[#fff0ee] px-1.5 py-[3px] text-[8px] text-[#c46a5d]">{stockSummary.expiringCount}</span>}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left">
                <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.5px] text-[#929c95]">
                  <tr>
                    {["PRODUCT", "SKU", "ON HAND", "RESERVED", "AVAILABLE", "STOCK LEVEL", "EXPIRY / BATCH", ""].map((item, index) => <th className="px-2.5 py-3 first:pl-[17px] last:pr-[15px]" key={`${item}-${index}`}>{item || <span className="sr-only">Actions</span>}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.map((product) => {
                    const detail = stockDetails[product.sku] ?? { reserved: 0, damaged: 0 };
                    const reserved = Math.min(detail.reserved, product.stock);
                    const available = Math.max(0, product.stock - reserved - detail.damaged);
                    const state = stockState(available);
                    const maxStock = Math.max(product.stock, 40);
                    const fillWidth = Math.min(100, maxStock > 0 ? (available / maxStock) * 100 : 0);
                    return (
                      <tr className="border-b border-[#f0f2f0] last:border-0" key={product.id}>
                        <td>
                          <div className="flex min-w-[185px] items-center gap-[9px] py-[7px]">
                            <span className="grid size-[38px] shrink-0 place-items-center rounded-lg bg-[#eef2ef] text-xl" role="img" aria-label={product.name}>{product.image}</span>
                            <span className="flex flex-col gap-1"><strong className="text-[9px] font-bold text-[#354139]">{product.name}</strong><small className="text-[8px] text-[#99a29c]">{product.brand} · {product.packSize}</small></span>
                          </div>
                        </td>
                        <td className="px-2.5 font-mono text-[8px] text-[#89948d]">{product.sku}</td>
                        <td className="px-2.5 text-[9px] text-[#4d5c52]">{product.stock}<small className="ml-1 text-[8px] text-[#9ba49e]">units</small></td>
                        <td className="px-2.5 text-[9px] text-[#89948d]">{reserved}<small className="ml-1 text-[8px] text-[#9ba49e]">units</small></td>
                        <td className={`px-2.5 text-[9px] font-bold ${state === "empty" ? "text-[#ce6659]" : state === "low" ? "text-[#c17a32]" : "text-[#4d5c52]"}`}>{available}<small className="ml-1 text-[8px] font-normal text-[#9ba49e]">units</small></td>
                        <td>
                          <div className="flex min-w-[115px] flex-col gap-1.5 px-2.5">
                            <div className="h-1.5 w-[90px] overflow-hidden rounded-full bg-[#edf0ee]"><i className={`block h-full rounded-full ${state === "empty" ? "bg-[#d66f62]" : state === "low" ? "bg-[#d89b53]" : "bg-[#69aa7b]"}`} style={{ width: `${fillWidth}%` }} /></div>
                            <StockBadge available={available} />
                          </div>
                        </td>
                        <td>
                          <span className={`flex flex-col gap-1 px-2.5 text-[9px] ${detail.expiryDays !== undefined && detail.expiryDays <= 3 ? "text-[#c46a5d]" : "text-[#56635a]"}`}>
                            <span>{formatExpiry(detail.expiryDays)}</span>
                            {detail.batch && <small className="font-mono text-[8px] text-[#9ba49e]">{detail.batch}</small>}
                          </span>
                        </td>
                        <td>
                          <button
                            className="inline-flex h-[29px] items-center gap-1 rounded-md border border-[#e5ebe7] bg-white px-2 text-[8px] font-bold text-[#59655e] hover:border-[#b9d5c2] hover:text-[#217847]"
                            type="button"
                            onClick={() => openAdjustment(product)}
                            aria-label={`Adjust stock for ${product.name}`}
                          >
                            <InventoryIcon name="plus" size={15} />
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {inventoryRows.length === 0 && (
                    <tr><td className="h-[210px] text-center" colSpan={8}>
                      <InventoryIcon name="search" size={22} />
                      <strong className="my-2 block text-[11px] text-[#39453e]">No inventory items found</strong>
                      <small className="text-[9px] text-[#89948d]">Change the search or filter to see other products.</small>
                      <button className="mt-2 block w-full border-0 bg-transparent text-[9px] font-bold text-[#217847]" type="button" onClick={() => { setSearch(""); setCategory("All categories"); setFilter("All stock"); }}>Clear filters</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2.5 border-t border-[#edf0ee] px-[17px] py-3 text-[9px] text-[#929c95]">
              <span>Showing <strong className="text-[#657169]">{inventoryRows.length ? 1 : 0}–{inventoryRows.length}</strong> of <strong className="text-[#657169]">{inventoryRows.length}</strong> demo products</span>
              <div className="flex gap-1.5"><button className="h-7 rounded-md border border-[#e7ebe8] bg-white px-[9px] text-[8px] text-[#929c95] opacity-65" type="button" disabled>Previous</button><button className="h-7 rounded-md border border-[#e7ebe8] bg-white px-[9px] text-[8px] text-[#929c95] opacity-65" type="button" disabled>Next</button></div>
            </div>
          </section>

          <section className="mt-[17px] overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
            <div className="flex items-center justify-between border-b border-[#edf0ee] px-[17px] py-3">
              <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">AUDIT TRAIL</p><h2 className="mb-0 mt-1.5 text-[14px] font-bold text-[#334038]">Recent stock activity</h2></div>
              <span className="text-[8px] text-[#929c95]">Latest {movements.length} movements</span>
            </div>
            <div className="divide-y divide-[#f0f2f0]">
              {movements.slice(0, 4).map((movement, index) => (
                <div className="flex items-center gap-2.5 px-[17px] py-[11px] max-[640px]:px-3" key={`${movement.sku}-${movement.time}-${index}`}>
                  <span className={`grid size-[29px] shrink-0 place-items-center rounded-lg ${movement.tone === "positive" ? "bg-[#eaf6ed] text-[#32814c]" : "bg-[#f3f4f3] text-[#8c9690]"}`}><InventoryIcon name={movement.tone === "positive" ? "plus" : "reserved"} size={15} /></span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="truncate text-[9px] font-bold text-[#354139]">{movement.product}</strong><small className="truncate text-[8px] text-[#99a29c]">{movement.sku} · {movement.reason}</small></span>
                  <strong className={`text-[9px] ${movement.tone === "positive" ? "text-[#32814c]" : "text-[#89948d]"}`}>{movement.change}</strong>
                  <span className="whitespace-nowrap text-[8px] text-[#99a29c]">{movement.time}</span>
                </div>
              ))}
            </div>
          </section>
          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">Demo inventory · Stock adjustments sync with Products and persist in this browser&apos;s local storage.</p>
        </div>
      </main>

      {adjustingProduct && (
        <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#142019]/45 p-5 max-[640px]:items-end max-[640px]:p-2" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAdjustment();
        }}>
          <section className="max-h-[calc(100vh-40px)] w-full max-w-[560px] overflow-y-auto rounded-[13px] border border-[#e9edea] bg-white shadow-[0_20px_70px_rgba(12,27,17,0.2)] max-[640px]:max-h-[calc(100vh-16px)]" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title">
            <div className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-[22px] py-5 max-[640px]:px-[15px]">
              <div>
                <p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">INVENTORY CONTROL</p>
                <h2 className="mb-1.5 mt-1.5 text-[19px] font-bold text-[#1b2820]" id="stock-modal-title">Adjust stock</h2>
                <p className="m-0 text-[10px] text-[#89948d]">{adjustingProduct.name} · {adjustingProduct.sku}</p>
              </div>
              <button className="grid size-[31px] shrink-0 place-items-center rounded-md border border-[#edf0ee] bg-white text-[#79847d] hover:bg-[#f8faf8]" type="button" onClick={closeAdjustment} aria-label="Close dialog">
                <AdminIcon name="close" />
              </button>
            </div>
            <form className="px-[22px] pb-5 pt-[18px] max-[640px]:px-[15px]" onSubmit={saveAdjustment}>
              <div className="mb-4 flex items-center gap-[11px] rounded-lg bg-[#f8faf8] p-3">
                <span className="grid size-[38px] place-items-center rounded-lg bg-white text-xl" role="img" aria-label={adjustingProduct.name}>{adjustingProduct.image}</span>
                <span className="flex flex-col gap-1"><small className="text-[8px] text-[#89948d]">Current on-hand stock</small><strong className="text-[11px] text-[#354139]">{adjustingProduct.stock} units</strong></span>
              </div>
              <fieldset className="mb-4 grid grid-cols-2 gap-2 border-0 p-0">
                <legend className="mb-2 text-[9px] font-semibold text-[#536057]">Adjustment type</legend>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 ${adjustmentType === "receive" ? "border-[#a7cdb2] bg-[#f2f8f4]" : "border-[#e8ece9]"}`}>
                  <input className="accent-[#18834b]" type="radio" name="adjustmentType" checked={adjustmentType === "receive"} onChange={() => setAdjustmentType("receive")} />
                  <span className="flex flex-col gap-1"><strong className="text-[9px] text-[#39453e]">Receive stock</strong><small className="text-[8px] text-[#89948d]">Add received units</small></span>
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 ${adjustmentType === "correction" ? "border-[#a7cdb2] bg-[#f2f8f4]" : "border-[#e8ece9]"}`}>
                  <input className="accent-[#18834b]" type="radio" name="adjustmentType" checked={adjustmentType === "correction"} onChange={() => setAdjustmentType("correction")} />
                  <span className="flex flex-col gap-1"><strong className="text-[9px] text-[#39453e]">Correct count</strong><small className="text-[8px] text-[#89948d]">Set physical on-hand count</small></span>
                </label>
              </fieldset>
              <div className="grid grid-cols-2 gap-[13px] max-[480px]:grid-cols-1">
                <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]">
                  <span>{adjustmentType === "receive" ? "Quantity received *" : "Counted on hand *"}</span>
                  <input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="quantity" type="number" min={adjustmentType === "receive" ? "1" : "0"} step="1" placeholder="Enter units" required autoFocus />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]">
                  <span>Reason *</span>
                  <select className="h-9 rounded-md border border-[#e4eae6] bg-white px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="reason" defaultValue="" required>
                    <option value="" disabled>Select reason</option>
                    {adjustmentType === "receive" ? (
                      <>
                        <option>Purchase received</option><option>Supplier return received</option><option>Opening stock</option>
                      </>
                    ) : (
                      <>
                        <option>Physical stock count</option><option>Damaged / expired write-off</option><option>Stock correction</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
              {adjustmentError && <p className="mt-3 rounded-md bg-[#fff1ef] p-[9px] text-[9px] text-[#bd554b]" role="alert">{adjustmentError}</p>}
              <div className="mt-[17px] flex justify-end gap-2 border-t border-[#edf0ee] pt-[15px]">
                <button className="h-[38px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[10px] font-bold text-[#59655e]" type="button" onClick={closeAdjustment}>Cancel</button>
                <button className="h-[38px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e]" type="submit">Save adjustment</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
