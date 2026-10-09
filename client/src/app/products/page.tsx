"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useProductCatalog, type Product, type ProductInput, type ProductStatus } from "@/components/product-catalog-provider";
import { AdminLoginGate } from "@/components/admin-login-gate";
import { deleteProductImage, uploadProductImage } from "@/lib/cloudinary-upload";

const categories = ["All products", "Fruits", "Vegetables", "Dairy", "Bakery", "Pantry"];
const statusFilters = ["All", "Active", "Draft", "Out of stock"] as const;

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function statusTone(status: ProductStatus) {
  if (status === "Active") return "bg-[#eaf6ed] text-[#32814c]";
  if (status === "Draft") return "bg-[#f1effa] text-[#7664ae]";
  return "bg-[#fff0ee] text-[#ce6659]";
}

function DeleteProductDialog({ product, onClose, onConfirm }: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#142019]/45 p-5" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="w-full max-w-[420px] rounded-[13px] border border-[#e9edea] bg-white p-5 shadow-[0_20px_70px_rgba(12,27,17,0.2)]" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" aria-describedby="delete-product-description">
        <span className="mb-3 grid size-9 place-items-center rounded-[9px] bg-[#fff0ee] text-[#ce6659]"><AdminIcon name="trash" size={17} /></span>
        <h2 className="m-0 text-[15px] font-bold text-[#1b2820]" id="delete-product-title">Delete this product?</h2>
        <p className="mb-0 mt-2 text-[10px] leading-[1.6] text-[#78837c]" id="delete-product-description"><strong className="text-[#39453e]">{product.name}</strong> will be removed from the shared catalog, Products, and Inventory. Existing demo order history will remain unchanged.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="h-[36px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[9px] font-bold text-[#59655e]" type="button" onClick={onClose}>Keep product</button>
          <button className="h-[36px] rounded-lg bg-[#c44e43] px-[13px] text-[9px] font-bold text-white hover:bg-[#aa4036]" type="button" onClick={onConfirm}>Delete product</button>
        </div>
      </section>
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: {
  product: Product | null;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>, image: { file: File | null; remove: boolean }) => Promise<string | null>;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const brand = String(data.get("brand") ?? "").trim();
    const packSize = String(data.get("packSize") ?? "").trim();
    const sku = String(data.get("sku") ?? "").trim();
    const price = Number(data.get("price"));
    const mrp = Number(data.get("mrp"));
    const stock = Number(data.get("stock"));
    if (!name || !brand || !packSize || !sku || !Number.isFinite(price) || !Number.isFinite(mrp) || !Number.isFinite(stock)) {
      setError("Please complete all required fields with valid numbers.");
      return;
    }
    if (price < 0 || mrp < price || stock < 0) {
      setError("Prices and stock cannot be negative, and MRP must be at least the selling price.");
      return;
    }
    setSaving(true);
    try {
      const saveError = await onSave(event, { file: selectedImage, remove: removeImage });
      setError(saveError ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#142019]/45 p-5 max-[640px]:items-end max-[640px]:p-2">
      <section className="max-h-[calc(100vh-40px)] w-full max-w-[620px] overflow-y-auto rounded-[13px] border border-[#e9edea] bg-white shadow-[0_20px_70px_rgba(12,27,17,0.2)] max-[640px]:max-h-[calc(100vh-16px)]" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-[22px] py-5 max-[640px]:px-[15px]">
          <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">{product ? "UPDATE YOUR CATALOG" : "GROW YOUR CATALOG"}</p><h2 className="mb-1.5 mt-1.5 text-[19px] font-bold tracking-[-0.5px] text-[#1b2820]" id="product-modal-title">{product ? "Edit product" : "Add a product"}</h2><p className="m-0 text-[10px] text-[#89948d]">Changes are saved to the shared store catalog.</p></div>
          <button className="grid size-[31px] shrink-0 place-items-center rounded-md border border-[#edf0ee] bg-white text-[#79847d] hover:bg-[#f8faf8]" type="button" onClick={onClose} aria-label="Close dialog"><AdminIcon name="close" /></button>
        </div>
        <form className="px-[22px] pb-5 pt-[18px] max-[640px]:px-[15px]" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-[13px] max-[480px]:grid-cols-1">
            <label className="col-span-2 flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057] max-[480px]:col-span-1"><span>Product name <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none placeholder:text-[#aab2ad] focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="name" defaultValue={product?.name ?? ""} placeholder="e.g. Fresh strawberries" required autoFocus /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>Brand <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="brand" defaultValue={product?.brand ?? ""} placeholder="Brand name" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>Category <b className="text-[#cf665a]">*</b></span><select className="h-9 rounded-md border border-[#e4eae6] bg-white px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="category" defaultValue={product?.category ?? "Fruits"}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>Pack size / unit <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="packSize" defaultValue={product?.packSize ?? ""} placeholder="e.g. 500 g" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>SKU / barcode <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 font-mono text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="sku" defaultValue={product?.sku ?? ""} placeholder="e.g. FR-BER-001" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>Selling price (₹) <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ""} placeholder="0.00" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>MRP (₹) <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="mrp" type="number" min="0" step="0.01" defaultValue={product?.mrp ?? ""} placeholder="0.00" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]"><span>Opening stock <b className="text-[#cf665a]">*</b></span><input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? ""} placeholder="0" required /></label>
            <div className="col-span-2 flex min-w-0 flex-col gap-2 text-[9px] font-semibold text-[#536057] max-[480px]:col-span-1">
              <span>Product photo</span>
              <div className="flex items-center gap-3">
                {product?.image && product.image.startsWith("https://") && !removeImage && !selectedImage
                  ? <Image className="size-12 rounded-lg border border-[#e4eae6] object-cover" src={product.image} alt={`${product.name} current product`} width={48} height={48} unoptimized />
                  : <span className="grid size-12 place-items-center rounded-lg bg-[#f3f5f3] text-2xl">{selectedImage ? "🖼️" : removeImage ? "—" : product?.image || "🛒"}</span>}
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-[#dbe4de] px-2.5 text-[9px] font-medium text-[#526057] hover:bg-[#f8faf8]">
                  <AdminIcon name="upload" size={16} />
                  {selectedImage ? selectedImage.name : "Choose image"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      setSelectedImage(event.target.files?.[0] ?? null);
                      setRemoveImage(false);
                    }}
                  />
                </label>
                {(product?.imagePublicId || selectedImage) && !removeImage && (
                  <button
                    className="text-[9px] font-semibold text-[#bd554b] underline"
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setRemoveImage(true);
                    }}
                  >
                    Remove image
                  </button>
                )}
              </div>
              <small className="text-[8px] font-normal text-[#89978e]">JPG, PNG, or WebP; max 5 MB. Stored securely in Cloudinary.</small>
            </div>
          </div>
          <label className="mt-[17px] flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#edf0ee] p-[11px]">
            <input className="peer sr-only" name="publish" type="checkbox" defaultChecked={product ? product.status === "Active" : true} />
            <span className="relative h-[18px] w-[31px] shrink-0 rounded-full bg-[#cbd3ce] transition peer-checked:bg-[#21824b] after:absolute after:left-[3px] after:top-[3px] after:size-3 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-[13px] peer-focus-visible:ring-2 peer-focus-visible:ring-[#18834b]/30" />
            <span className="flex flex-col gap-1"><strong className="text-[9px] text-[#38453d]">Publish product</strong><small className="text-[8px] text-[#929c95]">Make this product visible to customers when in stock.</small></span>
          </label>
          {error && <p className="mt-3 rounded-md bg-[#fff1ef] p-[9px] text-[9px] text-[#bd554b]" role="alert">{error}</p>}
          <div className="mt-[17px] flex justify-end gap-2 border-t border-[#edf0ee] pt-[15px]">
            <button className="h-[38px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[10px] font-bold text-[#59655e]" type="button" onClick={onClose}>Cancel</button>
            <button className="h-[38px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e] disabled:opacity-60" type="submit" disabled={saving}>{saving ? "Saving..." : product ? "Save changes" : "Add product"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  const { products, loading, error, reload, saveProduct: persistProduct, deleteProduct: removeProduct } = useProductCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All products");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [sort, setSort] = useState("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch = !query || [product.name, product.brand, product.category, product.sku].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (category === "All products" || product.category === category) && (status === "All" || product.status === status);
    });
    return filtered.sort((first, second) => {
      if (sort === "name") return first.name.localeCompare(second.name);
      if (sort === "price-low") return first.price - second.price;
      if (sort === "price-high") return second.price - first.price;
      return second.id - first.id;
    });
  }, [category, products, search, sort, status]);

  async function saveProduct(
    event: FormEvent<HTMLFormElement>,
    imageSelection: { file: File | null; remove: boolean },
  ): Promise<string | null> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const stock = Number(data.get("stock"));
    const price = Number(data.get("price"));
    const mrp = Number(data.get("mrp"));
    const sku = String(data.get("sku")).trim();
    const product: ProductInput = {
      name: String(data.get("name")).trim(),
      brand: String(data.get("brand")).trim(),
      category: String(data.get("category")),
      packSize: String(data.get("packSize")).trim(),
      sku,
      price,
      mrp,
      stock,
      status: data.get("publish") !== "on" ? "Draft" : stock === 0 ? "Out of stock" : "Active",
      image: editingProduct?.image ?? "🛒",
      imagePublicId: editingProduct?.imagePublicId ?? "",
      color: editingProduct?.color ?? "new",
    };

    let uploadedPublicId: string | null = null;
    if (imageSelection.remove) {
      product.image = "";
      product.imagePublicId = "";
    }
    try {
      if (imageSelection.file) {
        const uploaded = await uploadProductImage(imageSelection.file);
        product.image = uploaded.image;
        product.imagePublicId = uploaded.imagePublicId;
        uploadedPublicId = uploaded.imagePublicId;
      }
      await persistProduct(product, editingProduct?.id);
    } catch (cause) {
      if (uploadedPublicId) {
        try {
          await deleteProductImage(uploadedPublicId);
        } catch (cleanupCause) {
          const saveMessage = cause instanceof Error ? cause.message : "Unable to save product.";
          const cleanupMessage = cleanupCause instanceof Error ? cleanupCause.message : "Unable to clean up uploaded image.";
          throw new Error(`${saveMessage} The new Cloudinary image also needs cleanup: ${cleanupMessage}`);
        }
      }
      throw cause;
    }
    setModalOpen(false);
    setEditingProduct(null);
    return null;
  }

  function deleteProduct() {
    if (!deletingProduct) return;
    void removeProduct(deletingProduct.id)
      .then(() => setDeletingProduct(null))
      .catch((cause: unknown) => setMutationError(cause instanceof Error ? cause.message : "Unable to delete product."));
  }

  const [mutationError, setMutationError] = useState("");
  const statCards = [
    { label: "Total products", value: products.length, detail: "In your catalog", icon: "products", tone: "bg-[#eaf2fb] text-[#4b81bc]" },
    { label: "Active products", value: products.filter((product) => product.status === "Active").length, detail: "Visible to customers", icon: "check", tone: "bg-[#e9f5ed] text-[#22834c]" },
    { label: "Low stock", value: products.filter((product) => product.stock > 0 && product.stock <= 10).length, detail: "10 units or less", icon: "alert", tone: "bg-[#fff2e6] text-[#d4873b]" },
    { label: "Draft products", value: products.filter((product) => product.status === "Draft").length, detail: "Not published yet", icon: "draft", tone: "bg-[#f0edfb] text-[#7761bc]" },
  ];

  return (
    <AdminLoginGate onSessionChange={reload}>
    <div className="min-h-screen">
      <AdminSidebar activePage="Products" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Products" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          {error && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fff1ef] p-3 text-[10px] text-[#bd554b]" role="alert"><span>{error}</span><button className="font-bold underline" type="button" onClick={() => void reload()}>Retry</button></div>}
          {mutationError && <p className="mt-3 rounded-lg bg-[#fff1ef] p-3 text-[10px] text-[#bd554b]" role="alert">{mutationError}</p>}
          <div className="mb-[23px] flex items-center justify-between gap-[18px] max-[640px]:items-start max-[640px]:flex-col">
            <div><p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">CATALOG MANAGEMENT</p><h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Products &amp; Catalog</h1><p className="m-0 text-[11px] text-[#818b85]">Manage your products, categories and storefront availability.</p></div>
            <div className="flex items-center gap-[9px] max-[640px]:w-full">
              <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[10px] font-bold text-[#59655e] disabled:cursor-not-allowed disabled:opacity-70 max-[640px]:flex-1" type="button" disabled title="Bulk upload will be available later"><AdminIcon name="upload" size={16} />Bulk upload</button>
              <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e] max-[640px]:flex-1" type="button" onClick={() => { setEditingProduct(null); setModalOpen(true); }}><AdminIcon name="plus" size={17} />Add product</button>
            </div>
          </div>

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Catalog summary">
            {statCards.map((stat) => <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 shadow-[0_2px_7px_rgba(27,42,33,0.02)] max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5" key={stat.label}><span className={`row-span-2 grid size-9 place-items-center self-center rounded-[9px] ${stat.tone}`}><AdminIcon name={stat.icon} /></span><div className="flex items-baseline justify-between gap-2"><span className="whitespace-nowrap text-[9px] text-[#78837c] max-[640px]:text-[8px]">{stat.label}</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{stat.value}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">{stat.detail}</small></article>)}
          </section>

          <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
            <div className="flex gap-[19px] overflow-x-auto border-b border-[#edf0ee] px-[19px]">
              {categories.map((item) => {
                const count = item === "All products" ? products.length : products.filter((product) => product.category === item).length;
                const selected = category === item;
                return <button className={`relative inline-flex h-12 shrink-0 items-center gap-[7px] border-0 bg-transparent px-px text-[10px] font-semibold ${selected ? "text-[#147744] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#18834b]" : "text-[#77827b]"}`} key={item} type="button" onClick={() => setCategory(item)} aria-pressed={selected}>{item}<span className={`rounded-full px-1.5 py-[3px] text-[8px] ${selected ? "bg-[#eaf5ee] text-[#26794a]" : "bg-[#f0f2f0] text-[#7f8982]"}`}>{count}</span></button>;
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 p-[15px] max-[640px]:gap-2 max-[640px]:p-3">
              <label className="flex h-9 w-[300px] max-w-full items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[#8c9790] focus-within:border-[#8bb99a] focus-within:ring-2 focus-within:ring-[#18834b]/10"><AdminIcon name="search" size={17} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#354139] outline-none placeholder:text-[#a0a9a3]" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands or SKU..." aria-label="Search products, brands or SKU" /><kbd className="rounded border border-[#e8ece9] px-1 py-[3px] text-[8px] text-[#9ba49e]">⌘ K</kbd></label>
              <div className="flex items-center gap-1 overflow-x-auto" aria-label="Filter products by status">{statusFilters.map((item) => <button className={`h-[29px] shrink-0 rounded-md border px-2 text-[9px] font-semibold ${status === item ? "border-[#dcebe1] bg-[#f0f7f2] text-[#217847]" : "border-transparent bg-transparent text-[#7c8780]"}`} key={item} type="button" onClick={() => setStatus(item)} aria-pressed={status === item}>{item}</button>)}</div>
              <label className="ml-auto flex items-center gap-[5px] whitespace-nowrap text-[9px] text-[#929c95] max-[1200px]:ml-0">Sort:<select className="max-w-32 border-0 bg-transparent text-[9px] font-semibold text-[#4e5a52] outline-none" value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recently updated</option><option value="name">Product name</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.55px] text-[#929c95]"><tr><th className="w-[37px] pl-[17px]"><input className="accent-[#18834b]" type="checkbox" aria-label="Select all visible products" disabled /></th>{["PRODUCT", "CATEGORY", "SKU", "PRICE", "STOCK", "STATUS", ""].map((item, index) => <th className="px-2.5 py-3 last:pr-[15px]" key={`${item}-${index}`}>{item || <span className="sr-only">Actions</span>}</th>)}</tr></thead>
                <tbody>
                  {loading && <tr><td className="h-[120px] text-center text-[10px] text-[#89948d]" colSpan={8}>Loading shared catalog...</td></tr>}
                  {visibleProducts.map((product) => <tr className="border-b border-[#f0f2f0] last:border-0" key={product.id}>
                    <td className="pl-[17px]"><input className="accent-[#18834b]" type="checkbox" aria-label={`Select ${product.name}`} disabled /></td>
                    <td className="px-2.5 py-[7px]"><div className="flex min-w-[185px] items-center gap-[9px]"><span className={`grid size-[38px] shrink-0 place-items-center overflow-hidden rounded-lg text-xl ${product.color === "mango" ? "bg-[#fff4df]" : product.color === "milk" ? "bg-[#eaf4fc]" : product.color === "bread" ? "bg-[#fff0e5]" : product.color === "spinach" || product.color === "cucumber" ? "bg-[#eaf5eb]" : product.color === "rice" ? "bg-[#f3f0e6]" : product.color === "eggs" ? "bg-[#f8f1e5]" : product.color === "lime" ? "bg-[#f0f5df]" : "bg-[#eef2ef]"}`}>{product.image.startsWith("https://") ? <Image className="size-full object-cover" src={product.image} alt="" width={38} height={38} unoptimized /> : product.image}</span><span className="flex flex-col gap-1"><strong className="text-[9px] font-bold text-[#354139]">{product.name}</strong><small className="text-[8px] text-[#99a29c]">{product.brand} · {product.packSize}</small></span></div></td>
                    <td className="px-2.5"><span className="rounded bg-[#f3f5f3] px-1.5 py-1 text-[8px] text-[#69756d]">{product.category}</span></td>
                    <td className="px-2.5 font-mono text-[8px] text-[#89948d]">{product.sku}</td>
                    <td className="px-2.5"><span className="flex items-center gap-1.5"><strong className="text-[9px] text-[#344037]">{formatPrice(product.price)}</strong><del className="text-[8px] text-[#a4aca7]">{formatPrice(product.mrp)}</del></span></td>
                    <td className="px-2.5"><span className="flex items-baseline gap-[3px]"><strong className={`text-[9px] ${product.stock <= 10 ? "text-[#c57a37]" : "text-[#4d5c52]"}`}>{product.stock}</strong><small className="text-[8px] text-[#9ba49e]">units</small></span></td>
                    <td className="px-2.5"><span className={`inline-flex rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${statusTone(product.status)}`}>{product.status}</span></td>
                    <td className="pr-[15px]"><div className="flex items-center gap-1"><button className="grid size-[29px] place-items-center rounded-md text-[#89948d] hover:bg-[#f8faf8] hover:text-[#277c49]" type="button" onClick={() => { setEditingProduct(product); setModalOpen(true); }} aria-label={`Edit ${product.name}`}><AdminIcon name="edit" size={16} /></button><button className="grid size-[29px] place-items-center rounded-md text-[#a0a9a3] hover:bg-[#fff0ee] hover:text-[#c44e43]" type="button" onClick={() => setDeletingProduct(product)} aria-label={`Delete ${product.name}`} title={`Delete ${product.name}`}><AdminIcon name="trash" size={16} /></button></div></td>
                  </tr>)}
                  {!loading && !error && visibleProducts.length === 0 && <tr><td className="h-[210px] text-center" colSpan={8}><AdminIcon name="search" size={22} /><strong className="my-2 block text-[11px] text-[#39453e]">No products found</strong><small className="text-[9px] text-[#89948d]">Try another search or change the selected filters.</small><button className="mt-2 block w-full border-0 bg-transparent text-[9px] font-bold text-[#217847]" type="button" onClick={() => { setSearch(""); setCategory("All products"); setStatus("All"); }}>Clear filters</button></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2.5 border-t border-[#edf0ee] px-[17px] py-3 text-[9px] text-[#929c95]"><span>Showing <strong className="text-[#657169]">{visibleProducts.length ? 1 : 0}–{visibleProducts.length}</strong> of <strong className="text-[#657169]">{products.length}</strong> shared products</span><div className="flex gap-1.5"><button className="h-7 rounded-md border border-[#e7ebe8] bg-white px-[9px] text-[8px] text-[#929c95] opacity-65" disabled>Previous</button><button className="h-7 rounded-md border border-[#e7ebe8] bg-white px-[9px] text-[8px] text-[#929c95] opacity-65" disabled>Next</button></div></div>
          </section>
          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">Shared catalog · Changes are stored in PostgreSQL and visible to the customer app.</p>
        </div>
      </main>
      {modalOpen && <ProductModal product={editingProduct} onClose={() => { setModalOpen(false); setEditingProduct(null); }} onSave={saveProduct} />}
      {deletingProduct && <DeleteProductDialog product={deletingProduct} onClose={() => setDeletingProduct(null)} onConfirm={deleteProduct} />}
    </div>
    </AdminLoginGate>
  );
}
