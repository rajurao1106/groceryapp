"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOrdersDemo } from "@/components/orders-demo-provider";
import { useProductCatalog } from "@/components/product-catalog-provider";

type AdminNavItem = {
  name: string;
  icon: string;
  href?: string;
  count?: string;
};

const navGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "WORKSPACE",
    items: [
      { name: "Dashboard", icon: "dashboard", href: "/" },
      { name: "Orders", icon: "orders", href: "/orders" },
      { name: "Products", icon: "products", href: "/products" },
      { name: "Inventory", icon: "inventory", href: "/inventory" },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { name: "Delivery partners", icon: "delivery", href: "/delivery-partners" },
      { name: "Customers", icon: "customers", href: "/customers" },
      { name: "Reports", icon: "reports", href: "/reports" },
      { name: "Settings", icon: "settings", href: "/settings" },
      { name: "Staff & Access", icon: "access", href: "/staff-access" },
    ],
  },
];

export function AdminIcon({ name, size = 19 }: { name: string; size?: number }) {
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
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></svg>;
    case "orders":
    case "receipt":
      return <svg {...common}><path d="M7 3.75h10A2.25 2.25 0 0 1 19.25 6v15l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5L4.25 21V6A2.25 2.25 0 0 1 6.5 3.75Z" /><path d="M8 9h8M8 13h8M8 17h3" /></svg>;
    case "products":
    case "inventory":
    case "box":
      return <svg {...common}><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" /></svg>;
    case "delivery":
      return <svg {...common}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></svg>;
    case "customers":
      return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8M21 20v-1.5a4 4 0 0 0-3-3.87" /></svg>;
    case "reports":
      return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4L7.1 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" transform="translate(-1 -1)" /></svg>;
    case "access":
      return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="4" /><path d="M17 8h5M19.5 5.5v5" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "trend":
      return <svg {...common}><path d="m3 16 6-6 4 4 8-8M15 6h6v6" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "rupee":
      return <svg {...common}><path d="M6 4h12M6 8h12M6 4c6 0 8 2 8 5s-2 5-8 5l8 6" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "alert":
      return <svg {...common}><path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16h.01" /></svg>;
    case "download":
      return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "close":
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>;
    case "edit":
      return <svg {...common}><path d="m15 5 4 4M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" /></svg>;
    case "trash":
      return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>;
    case "draft":
      return <svg {...common}><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>;
    case "reserved":
      return <svg {...common}><path d="M5 7h14M5 12h14M5 17h14" /><circle cx="3" cy="7" r=".5" fill="currentColor" /><circle cx="3" cy="12" r=".5" fill="currentColor" /><circle cx="3" cy="17" r=".5" fill="currentColor" /></svg>;
    case "pin":
      return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "phone":
      return <svg {...common}><path d="M5 3h4l2 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2C9.6 20.4 3.6 14.4 3 5a2 2 0 0 1 2-2Z" /></svg>;
    case "more":
      return <svg {...common}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
    default:
      return null;
  }
}

export function AdminSidebar({ activePage }: { activePage: string }) {
  const { orders } = useOrdersDemo();
  const openOrderCount = orders.filter((order) => ["Pending", "Confirmed"].includes(order.status)).length;

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-[#e9edea] bg-white px-4 py-[26px] sm:flex max-[980px]:w-[72px] max-[980px]:items-center max-[980px]:px-[9px] max-[980px]:py-5 max-[640px]:hidden">
      <Link className="flex items-center gap-2.5 px-2 text-[#17211d] no-underline max-[980px]:p-0" href="/" aria-label="Greenmart admin home">
        <span className="grid size-[39px] shrink-0 place-items-center rounded-xl bg-[#e8f5ed] text-[#17834b]">
          <svg className="size-8" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <path d="M18 30c-6.7-4.1-9.5-9.3-8.4-15.5 5.2.2 8.3 2.4 9.4 6.5 1.3-6.6 5.1-10.3 11.4-11.2.8 8.6-1.8 14.8-7.8 18.6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 29V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="flex min-w-0 flex-col max-[980px]:hidden">
          <strong className="text-[19px] font-bold tracking-[-0.8px]">greenmart</strong>
          <small className="mt-0.5 text-[9px] font-bold tracking-[1.25px] text-[#8c9690]">ADMIN CONSOLE</small>
        </span>
      </Link>

      {/* <div className="my-[31px] flex items-center gap-2.5 rounded-[10px] border border-[#e9edea] p-2.5 max-[980px]:my-[25px] max-[980px]:justify-center max-[980px]:border-0 max-[980px]:p-0">
        <span className="grid size-[35px] shrink-0 place-items-center rounded-[9px] bg-[#e5f3e9] text-base font-bold text-[#287345]">G</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 max-[980px]:hidden">
          <small className="text-[9px] font-bold tracking-[0.8px] text-[#929b96]">YOUR STORE</small>
          <strong className="truncate text-[11px] font-semibold">Greenmart Grocery</strong>
        </span>
        <span className="text-lg text-[#8d9791] max-[980px]:hidden">⌄</span>
      </div> */}

      <nav className="flex pt-5 flex-col gap-7 max-[980px]:w-full max-[980px]:gap-5" aria-label="Admin navigation">
        {navGroups.map((group) => (
          <div className="max-[980px]:flex max-[980px]:flex-col max-[980px]:items-center" key={group.label}>
            <p className="mb-2 ml-2.5 text-[9px] font-bold tracking-[1.15px] text-[#a1a9a4] max-[980px]:hidden">{group.label}</p>
            {group.items.map((item) => {
              const active = item.name === activePage;
              const classes = `my-[3px] flex h-[42px] items-center gap-3 rounded-lg px-[11px] text-xs font-medium no-underline transition-colors max-[980px]:w-12 max-[980px]:justify-center max-[980px]:px-0 ${
                active
                  ? "bg-[#eaf5ee] font-bold text-[#147744]"
                  : "text-[#6d7872] hover:bg-[#f1f7f3]"
              }`;
              const content = (
                <>
                  <AdminIcon name={item.icon} />
                  <span className="max-[980px]:hidden">{item.name}</span>
                  {item.name === "Orders" && openOrderCount > 0 && <span className="ml-auto rounded-full bg-[#edf0ee] px-[7px] py-[3px] text-[10px] font-semibold text-[#69746e] max-[980px]:hidden">{openOrderCount}</span>}
                  {!item.href && <span className="ml-auto rounded-full bg-[#edf0ee] px-1.5 py-[3px] text-[9px] text-[#98a19c] max-[980px]:hidden">Soon</span>}
                </>
              );
              return item.href ? (
                <Link className={classes} key={item.name} href={item.href} aria-current={active ? "page" : undefined} title={item.name}>
                  {content}
                </Link>
              ) : (
                <span className={classes} key={item.name} aria-disabled="true" title={`${item.name} page coming soon`}>
                  {content}
                </span>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto max-[980px]:hidden">
        <div className="mb-3.5 flex gap-2.5 rounded-[10px] border border-[#edf0ee] px-[11px] py-[13px]">
          <span className="grid size-[23px] shrink-0 place-items-center rounded-full bg-[#eff5f1] text-[13px] font-bold text-[#17834b]">?</span>
          <div>
            <strong className="text-[11px]">Need a hand?</strong>
            <p className="my-1 text-[10px] text-[#8b958f]">We&apos;re here to help.</p>
            <a className="text-[10px] font-bold text-[#17834b] no-underline" href="mailto:support@greenmart.example">Contact support</a>
          </div>
        </div>
        <button className="flex w-full items-center gap-[9px] border-0 border-t border-[#edf0ee] bg-transparent px-[3px] pt-3.5 text-left" type="button">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#d9ece0] text-[11px] font-bold text-[#276a42]">RK</span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <strong className="text-[11px] font-semibold">Rohan Kumar</strong>
            <small className="text-[10px] text-[#89938d]">Store owner</small>
          </span>
          <span className="tracking-[2px] text-[#8b958f]">•••</span>
        </button>
      </div>
    </aside>
  );
}

export function AdminTopbar({ title }: { title: string }) {
  const [mobileMenuFor, setMobileMenuFor] = useState<string | null>(null);
  const mobileMenuOpen = mobileMenuFor === title;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { orders } = useOrdersDemo();
  const { products } = useProductCatalog();
  const needsAction = orders.filter((order) => ["Pending", "Confirmed"].includes(order.status));
  const lowStockProducts = products.filter((product) => product.status !== "Draft" && product.stock <= 10);
  const notificationCount = needsAction.length + lowStockProducts.length;
  const quickLinks = navGroups[0].items.filter((item): item is AdminNavItem & { href: string } => Boolean(item.href));

  useEffect(() => {
    function closeOverlays(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuFor(null);
        setNotificationsOpen(false);
      }
    }
    window.addEventListener("keydown", closeOverlays);
    return () => window.removeEventListener("keydown", closeOverlays);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e9edea] bg-white/95 px-[38px] shadow-[0_2px_12px_rgba(27,42,33,0.025)] backdrop-blur-md max-[1200px]:px-[26px] max-[640px]:h-[58px] max-[640px]:px-[17px]">
        <div className="flex items-center gap-[9px] text-[11px] text-[#929b96]">
          <span>Workspace</span><AdminIcon name="chevron" size={14} /><strong className="font-semibold text-[#38443d]">{title}</strong>
        </div>
        <div className="flex items-center gap-[17px] max-[640px]:gap-2.5">
          <div className="flex items-center gap-[7px] rounded-full bg-[#fff7e9] px-2.5 py-1.5 text-[10px] font-semibold text-[#8e652b] max-[640px]:text-[9px]">
            <span className="size-[7px] rounded-full bg-[#e5a23b]" />            {title === "Products" || title === "Inventory" ? "Live catalog" : "Demo data"}
          </div>
          <div className="relative">
            <button
              className={`relative grid size-[36px] place-items-center rounded-xl border bg-white text-[#626e67] transition-colors hover:bg-[#f6faf7] ${notificationsOpen ? "border-[#bddac6]" : "border-[#e9edea]"}`}
              type="button"
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} to review` : ""}`}
              aria-expanded={notificationsOpen}
              aria-controls="admin-notifications"
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <AdminIcon name="bell" />
              {notificationCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-white bg-[#d85f51] px-1 text-[8px] font-bold leading-none text-white">{notificationCount}</span>}
            </button>
            {notificationsOpen && (
              <section id="admin-notifications" className="absolute right-0 top-[45px] z-40 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#e7ece8] bg-white shadow-[0_16px_44px_rgba(19,39,27,0.14)]" aria-label="Admin notifications">
                <div className="flex items-center justify-between border-b border-[#edf0ee] px-4 py-3">
                  <div><h2 className="m-0 text-[12px] font-bold text-[#26332b]">Needs your attention</h2><p className="mb-0 mt-1 text-[9px] text-[#89948d]">{notificationCount} items from your demo data</p></div>
                  <button className="grid size-8 place-items-center rounded-lg text-[#79847d] hover:bg-[#f5f7f5]" type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}><AdminIcon name="close" size={16} /></button>
                </div>
                <div className="max-h-[min(360px,60vh)] overflow-y-auto p-2">
                  {needsAction.map((order) => (
                    <Link className="flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 no-underline hover:bg-[#f6faf7]" href="/orders" key={order.id} onClick={() => setNotificationsOpen(false)}>
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff3e5] text-[#c17a32]"><AdminIcon name="receipt" size={15} /></span>
                      <span className="min-w-0 flex-1"><strong className="block text-[10px] font-semibold text-[#344138]">{order.id} needs review</strong><small className="mt-1 block truncate text-[9px] text-[#89948d]">{order.customer} · {order.status}</small></span>
                      <AdminIcon name="chevron" size={14} />
                    </Link>
                  ))}
                  {lowStockProducts.map((product) => (
                    <Link className="flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 no-underline hover:bg-[#f6faf7]" href="/inventory" key={product.id} onClick={() => setNotificationsOpen(false)}>
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff5e9] text-[#c17a32]"><AdminIcon name="alert" size={15} /></span>
                      <span className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-semibold text-[#344138]">Low stock: {product.name}</strong><small className="mt-1 block text-[9px] text-[#89948d]">{product.stock} units left</small></span>
                      <AdminIcon name="chevron" size={14} />
                    </Link>
                  ))}
                  {notificationCount === 0 && <p className="m-0 px-2.5 py-5 text-center text-[10px] text-[#89948d]">You&apos;re all caught up.</p>}
                </div>
                <Link className="block border-t border-[#edf0ee] px-4 py-2.5 text-center text-[9px] font-bold text-[#18834b] no-underline hover:bg-[#f6faf7]" href="/orders" onClick={() => setNotificationsOpen(false)}>Review orders</Link>
              </section>
            )}
          </div>
          <span className="h-[25px] w-px bg-[#e9edea] max-[640px]:hidden" />
          <span className="grid size-8 place-items-center rounded-full bg-[#d9ece0] text-[11px] font-bold text-[#276a42]">RK</span>
        </div>
      </header>
      {mobileMenuOpen && (
        <>
          <button className="fixed inset-0 z-30 bg-[#142019]/25 backdrop-blur-[2px] sm:hidden" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuFor(null)} />
          <nav id="mobile-admin-navigation" className="fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 max-h-[min(65vh,520px)] overflow-y-auto rounded-2xl border border-[#e7ece8] bg-white p-3 shadow-[0_16px_44px_rgba(19,39,27,0.18)] sm:hidden" aria-label="Mobile admin navigation">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[11px] font-bold text-[#29372e]">All pages</span>
              <button className="grid size-8 place-items-center rounded-lg text-[#79847d] hover:bg-[#f5f7f5]" type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuFor(null)}><AdminIcon name="close" size={16} /></button>
            </div>
            {navGroups.map((group) => (
              <div className="pb-2" key={group.label}>
                <p className="mb-1 px-2 text-[8px] font-bold tracking-[1.15px] text-[#a1a9a4]">{group.label}</p>
                {group.items.map((item) => {
                  const active = item.name === title;
                  return item.href ? (
                    <Link
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-[11px] font-medium no-underline transition-colors ${active ? "bg-[#eaf5ee] font-bold text-[#147744]" : "text-[#6d7872] hover:bg-[#f1f7f3]"}`}
                      key={item.name}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileMenuFor(null)}
                    >
                      <AdminIcon name={item.icon} />
                      <span>{item.name}</span>
                      {active && <span className="ml-auto size-1.5 rounded-full bg-[#18834b]" />}
                    </Link>
                  ) : null;
                })}
              </div>
            ))}
          </nav>
        </>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#e6ebe7] bg-white/95 px-1 pt-1.5 shadow-[0_-6px_24px_rgba(25,45,32,0.07)] backdrop-blur-lg pb-[calc(6px+env(safe-area-inset-bottom))] sm:hidden" aria-label="Quick admin navigation">
        {quickLinks.map((item) => {
          const active = item.name === title;
          return (
            <Link
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[8px] font-semibold no-underline transition-colors ${active ? "text-[#147744]" : "text-[#89948d]"}`}
              href={item.href}
              key={item.name}
              aria-current={active ? "page" : undefined}
            >
              <span className={`grid size-8 place-items-center rounded-xl transition-colors ${active ? "bg-[#eaf5ee]" : ""}`}><AdminIcon name={item.icon} size={18} /></span>
              <span className="max-w-full truncate">{item.name}</span>
            </Link>
          );
        })}
        <button
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[8px] font-semibold transition-colors ${mobileMenuOpen ? "text-[#147744]" : "text-[#89948d]"}`}
          type="button"
          aria-label={mobileMenuOpen ? "Close all pages menu" : "Open all pages menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-admin-navigation"
          onClick={() => {
            setNotificationsOpen(false);
            setMobileMenuFor(mobileMenuOpen ? null : title);
          }}
        >
          <span className={`grid size-8 place-items-center rounded-xl transition-colors ${mobileMenuOpen ? "bg-[#eaf5ee]" : ""}`}><AdminIcon name={mobileMenuOpen ? "close" : "more"} size={18} /></span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
