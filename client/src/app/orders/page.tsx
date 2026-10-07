"use client";

import { useMemo, useState } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useOrdersDemo, type DemoOrder, type OrderStatus } from "@/components/orders-demo-provider";
import { useDeliveryPartnersDemo } from "@/components/delivery-partners-demo-provider";

const orderFilters = ["All orders", "Needs action", "Preparing", "On the way", "Delivered", "Cancelled"] as const;

const statusOrder: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Packed",
  "Assigned",
  "Out for delivery",
  "Delivered",
];

function OrdersIcon({ name, size = 17 }: { name: string; size?: number }) {
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
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "rupee":
      return <svg {...common}><path d="M6 4h12M6 8h12M6 4c6 0 8 2 8 5s-2 5-8 5l8 6" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "delivery":
      return <svg {...common}><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "close":
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "pin":
      return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "phone":
      return <svg {...common}><path d="M5 3h4l2 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2C9.6 20.4 3.6 14.4 3 5a2 2 0 0 1 2-2Z" /></svg>;
    case "receipt":
      return <svg {...common}><path d="M7 3.75h10A2.25 2.25 0 0 1 19.25 6v15l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5L4.25 21V6A2.25 2.25 0 0 1 6.5 3.75Z" /><path d="M8 9h8M8 13h8M8 17h3" /></svg>;
    default:
      return null;
  }
}

function formatAmount(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone = status === "Delivered"
    ? "bg-[#eaf6ed] text-[#32814c]"
    : status === "Cancelled"
      ? "bg-[#fff0ee] text-[#ce6659]"
      : ["Pending", "Confirmed"].includes(status)
        ? "bg-[#fff3e5] text-[#c17a32]"
        : "bg-[#eaf2fb] text-[#4b81bc]";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${tone}`}>{status}</span>;
}

function paymentClass(status: DemoOrder["paymentStatus"]) {
  return status === "Paid" ? "bg-[#eaf6ed] text-[#32814c]" : status === "Refunded" ? "bg-[#f1effa] text-[#7664ae]" : "bg-[#f3f4f3] text-[#7b8680]";
}

function OrderDetails({ order, onClose, onStatusChange, availablePartners }: {
  order: DemoOrder;
  onClose: () => void;
  onStatusChange: (order: DemoOrder, nextStatus: OrderStatus, partnerId?: number) => void;
  availablePartners: { id: number; name: string; zone: string }[];
}) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(availablePartners[0]?.id ?? null);
  const currentIndex = statusOrder.indexOf(order.status);
  const canAdvance = currentIndex >= 0 && currentIndex < statusOrder.length - 1;
  const nextStatus = canAdvance ? statusOrder[currentIndex + 1] : null;
  const canCancel = ["Pending", "Confirmed", "Preparing", "Packed"].includes(order.status);

  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#142019]/45 p-5 max-[640px]:items-end max-[640px]:p-2" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="max-h-[calc(100vh-40px)] w-full max-w-[700px] overflow-y-auto rounded-[13px] border border-[#e9edea] bg-white shadow-[0_20px_70px_rgba(12,27,17,0.2)] max-[640px]:max-h-[calc(100vh-16px)]" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-[22px] py-5 max-[640px]:px-[15px]">
          <div>
            <p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">ORDER DETAILS</p>
            <h2 className="mb-1.5 mt-1.5 text-[19px] font-bold tracking-[-0.5px] text-[#1b2820]" id="order-detail-title">{order.id}</h2>
            <p className="m-0 text-[10px] text-[#89948d]">Placed today at {order.time} · Demo order</p>
          </div>
          <button className="grid size-[31px] shrink-0 place-items-center rounded-md border border-[#edf0ee] bg-white text-[#79847d] hover:bg-[#f8faf8]" type="button" onClick={onClose} aria-label="Close order details">
            <AdminIcon name="close" />
          </button>
        </div>

        <div className="space-y-4 px-[22px] py-[18px] max-[640px]:px-[15px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusPill status={order.status} />
            <span className={`inline-flex rounded-full px-[8px] py-[5px] text-[8px] font-semibold ${paymentClass(order.paymentStatus)}`}>{order.paymentStatus} · {order.paymentMethod}</span>
          </div>

          {order.status !== "Cancelled" && (
            <section className="grid grid-cols-6 gap-1 max-[600px]:grid-cols-3" aria-label="Order progress">
              {statusOrder.slice(1, 7).map((step, index) => {
                const stepIndex = statusOrder.indexOf(step);
                const done = currentIndex >= stepIndex;
                const current = currentIndex === stepIndex;
                return (
                  <div className={`flex min-w-0 flex-col items-center gap-1.5 text-center text-[8px] ${current ? "font-bold text-[#217847]" : done ? "text-[#5f7465]" : "text-[#9aa39d]"}`} key={step}>
                    <span className={`grid size-[23px] place-items-center rounded-full text-[8px] ${done ? "bg-[#eaf6ed] text-[#32814c]" : "bg-[#f1f3f1] text-[#929c95]"}`}>{done ? <OrdersIcon name="check" size={12} /> : index + 1}</span>
                    <span>{step}</span>
                  </div>
                );
              })}
            </section>
          )}

          <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
            <section className="rounded-lg border border-[#edf0ee] p-3.5">
              <h3 className="mb-3 mt-0 text-[10px] font-bold text-[#39453e]">Customer</h3>
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[9px] font-bold text-[#4b81bc]">{order.initials}</span>
                <span className="flex min-w-0 flex-col gap-1"><strong className="text-[9px] text-[#354139]">{order.customer}</strong><small className="flex items-center gap-1 text-[8px] text-[#89948d]"><OrdersIcon name="phone" size={12} />{order.phone}</small></span>
              </div>
              <div className="mt-3 flex items-start gap-1.5 border-t border-[#f0f2f0] pt-2.5 text-[8px] leading-[1.5] text-[#78837c]"><OrdersIcon name="pin" size={15} /><span>{order.address}</span></div>
            </section>
            <section className="rounded-lg border border-[#edf0ee] p-3.5">
              <h3 className="mb-3 mt-0 text-[10px] font-bold text-[#39453e]">Delivery</h3>
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e9f5ed] text-[#22834c]"><OrdersIcon name="delivery" size={16} /></span>
                <span className="flex min-w-0 flex-col gap-1"><strong className="text-[9px] text-[#354139]">{order.deliveryPartner ?? "Not assigned"}</strong><small className="text-[8px] text-[#89948d]">{order.deliveryPartner ? "Delivery partner assigned" : "Waiting for assignment"}</small></span>
              </div>
              {!order.deliveryPartner && ["Packed", "Assigned"].includes(order.status) && (
                <div className="mt-3 space-y-2">
                  {availablePartners.length > 0 ? (
                    <>
                      <label className="block text-[8px] font-semibold text-[#69756e]">
                        Available partners
                        <select
                          className="mt-1 h-8 w-full rounded-md border border-[#e2e8e4] bg-white px-2 text-[9px] font-normal"
                          value={selectedPartnerId ?? ""}
                          onChange={(event) => setSelectedPartnerId(Number(event.target.value))}
                        >
                          {availablePartners.map((partner) => <option value={partner.id} key={partner.id}>{partner.name} · {partner.zone}</option>)}
                        </select>
                      </label>
                      <button
                        className="h-[30px] rounded-md border border-[#dcebe1] bg-[#f4f9f5] px-2.5 text-[8px] font-bold text-[#217847] disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        disabled={!availablePartners.some((partner) => partner.id === selectedPartnerId)}
                        onClick={() => onStatusChange(order, "Assigned", selectedPartnerId ?? undefined)}
                      >
                        {order.status === "Packed" ? "Assign & mark assigned" : "Assign partner"}
                      </button>
                    </>
                  ) : (
                    <small className="block text-[8px] text-[#bf5c50]">No available partners. Update a partner&apos;s availability to assign this order.</small>
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="overflow-hidden rounded-lg border border-[#edf0ee]">
            <div className="flex items-center justify-between border-b border-[#edf0ee] px-3.5 py-3"><h3 className="m-0 text-[10px] font-bold text-[#39453e]">Items <span className="ml-1 rounded-full bg-[#f0f2f0] px-1.5 py-[3px] text-[8px] text-[#77827b]">{order.itemCount}</span></h3><span className="text-[8px] text-[#929c95]">Order summary</span></div>
            <div className="divide-y divide-[#f0f2f0] px-3.5">
              {order.items.map((item, index) => (
                <div className="flex items-center gap-2.5 py-2.5" key={`${item.name}-${index}`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#f4f6f4] text-lg">{item.image}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-[9px] text-[#354139]">{item.name}</strong><small className="text-[8px] text-[#89948d]">{item.packSize} · Qty {item.quantity}</small></span>
                  <strong className="text-[9px] text-[#354139]">{formatAmount(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#edf0ee] px-3.5 py-3 text-[9px] text-[#657169]"><span>Order total</span><strong className="text-[12px] text-[#1b2820]">{formatAmount(order.amount)}</strong></div>
          </section>

          {order.status === "Cancelled" && (
            <div className="rounded-lg border border-[#f3deda] bg-[#fff8f6] p-3 text-[9px] text-[#9c6258]">
              This demo order is cancelled. Payment status: <strong>{order.paymentStatus}</strong>.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[#edf0ee] px-[22px] py-[14px] max-[640px]:px-[15px]">
          {canCancel && (
            <button className="h-[36px] rounded-lg border border-[#f0d8d4] bg-white px-3 text-[9px] font-bold text-[#bf5c50]" type="button" onClick={() => onStatusChange(order, "Cancelled")}>
              Cancel order
            </button>
          )}
          <span className="flex-1" />
          <button className="h-[36px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[9px] font-bold text-[#59655e]" type="button" onClick={onClose}>Close</button>
          {nextStatus && nextStatus !== "Assigned" && (order.status !== "Assigned" || order.deliveryPartner) && (
            <button className="h-[36px] rounded-lg bg-[#18834b] px-[13px] text-[9px] font-bold text-white hover:bg-[#116d3e]" type="button" onClick={() => onStatusChange(order, nextStatus)}>
              Mark {nextStatus.toLowerCase()}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default function OrdersPage() {
  const { orders, setOrders } = useOrdersDemo();
  const { partners, setPartners } = useDeliveryPartnersDemo();
  const [activeFilter, setActiveFilter] = useState<(typeof orderFilters)[number]>("All orders");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const [notice, setNotice] = useState("");
  const availablePartners = partners.filter((partner) => partner.status === "Available");

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((order) => {
        const matchesSearch = !query || [order.id, order.customer, order.phone, order.address]
          .some((value) => value.toLowerCase().includes(query));
        const matchesFilter =
          activeFilter === "All orders" ||
          (activeFilter === "Needs action" && ["Pending", "Confirmed"].includes(order.status)) ||
          (activeFilter === "Preparing" && ["Preparing", "Packed"].includes(order.status)) ||
          (activeFilter === "On the way" && ["Assigned", "Out for delivery"].includes(order.status)) ||
          order.status === activeFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((first, second) => first.minutesAgo - second.minutesAgo);
  }, [activeFilter, orders, search]);

  const counts = useMemo(() => ({
    all: orders.length,
    needsAction: orders.filter((order) => ["Pending", "Confirmed"].includes(order.status)).length,
    preparing: orders.filter((order) => ["Preparing", "Packed"].includes(order.status)).length,
    onTheWay: orders.filter((order) => ["Assigned", "Out for delivery"].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === "Delivered").length,
    cancelled: orders.filter((order) => order.status === "Cancelled").length,
    revenue: orders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + order.amount, 0),
  }), [orders]);

  function updateOrderStatus(order: DemoOrder, nextStatus: OrderStatus, partnerId?: number) {
    const selectedPartner = partnerId === undefined ? undefined : availablePartners.find((partner) => partner.id === partnerId);
    if (nextStatus === "Assigned" && !order.deliveryPartner && !selectedPartner) {
      setNotice("Select an available delivery partner before assigning this order.");
      window.setTimeout(() => setNotice(""), 3200);
      return;
    }
    const deliveryPartner = selectedPartner?.name ?? order.deliveryPartner;
    setOrders((current) => current.map((item) => item.id !== order.id ? item : {
      ...item,
      status: nextStatus,
      deliveryPartner,
      paymentStatus: nextStatus === "Cancelled" && item.paymentStatus === "Paid" ? "Refunded" : item.paymentStatus,
    }));
    setSelectedOrder((current) => current?.id === order.id
      ? {
          ...current,
          status: nextStatus,
          deliveryPartner,
          paymentStatus: nextStatus === "Cancelled" && current.paymentStatus === "Paid" ? "Refunded" : current.paymentStatus,
        }
      : current);
    if (selectedPartner) {
        setPartners((current) => current.map((partner) => partner.id === selectedPartner.id
          ? { ...partner, status: "On delivery" }
          : partner));
    }
    setNotice(`${order.id} marked ${nextStatus.toLowerCase()}. Demo state only.`);
    window.setTimeout(() => setNotice(""), 3200);
  }

  const filterCount = (filter: (typeof orderFilters)[number]) => {
    switch (filter) {
      case "All orders": return counts.all;
      case "Needs action": return counts.needsAction;
      case "Preparing": return counts.preparing;
      case "On the way": return counts.onTheWay;
      case "Delivered": return counts.delivered;
      case "Cancelled": return counts.cancelled;
    }
  };

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Orders" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Orders" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px] flex items-center justify-between gap-[18px] max-[640px]:items-start max-[640px]:flex-col">
            <div>
              <p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">ORDER OPERATIONS</p>
              <h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Orders</h1>
              <p className="m-0 text-[11px] text-[#818b85]">Review, prepare and fulfil customer orders from one place.</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#e3eee6] bg-[#f5faf6] px-2.5 py-1.5 text-[8px] font-semibold text-[#44815a] before:size-1.5 before:rounded-full before:bg-[#76b387]">Demo orders</div>
          </div>

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Order summary">
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#eaf2fb] text-[#4b81bc]"><OrdersIcon name="receipt" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Total orders</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{counts.all}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">Demo orders today</small>
            </article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#fff2e6] text-[#d4873b]"><OrdersIcon name="clock" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Needs action</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{counts.needsAction}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">Awaiting confirmation</small>
            </article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#e9f5ed] text-[#22834c]"><OrdersIcon name="delivery" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">In progress</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{counts.preparing + counts.onTheWay}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">{counts.onTheWay} on the way</small>
            </article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5">
              <span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#f0edfb] text-[#7761bc]"><OrdersIcon name="rupee" /></span>
              <div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Paid order value</span><strong className="text-[15px] font-bold max-[640px]:text-[12px]">{formatAmount(counts.revenue)}</strong></div><small className="self-end text-[8px] text-[#9aa39d] max-[640px]:text-[7px]">Paid demo orders</small>
            </article>
          </section>

          <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
            <div className="flex gap-[13px] overflow-x-auto border-b border-[#edf0ee] px-[15px]" aria-label="Filter orders by status">
              {orderFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`relative inline-flex h-12 shrink-0 items-center gap-[7px] border-0 bg-transparent px-1 text-[9px] font-semibold ${activeFilter === filter ? "text-[#147744] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-[#18834b]" : "text-[#77827b]"}`}
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={activeFilter === filter}
                >
                  {filter}<span className={`rounded-full px-1.5 py-[3px] text-[8px] ${activeFilter === filter ? "bg-[#eaf5ee] text-[#26794a]" : "bg-[#f0f2f0] text-[#7f8982]"}`}>{filterCount(filter)}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 p-[15px] max-[640px]:gap-2 max-[640px]:p-3">
              <label className="flex h-9 w-[300px] max-w-full items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[#8c9790] focus-within:border-[#8bb99a] focus-within:ring-2 focus-within:ring-[#18834b]/10">
                <OrdersIcon name="search" size={17} />
                <input className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#354139] outline-none placeholder:text-[#a0a9a3]"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order ID, customer or address..."
                  aria-label="Search orders"
                />
              </label>
              <label className="flex h-9 items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[9px] text-[#929c95]"><span>Date</span>
                <select className="max-w-[150px] border-0 bg-transparent text-[9px] font-semibold text-[#4e5a52] outline-none" aria-label="Filter by order date" defaultValue="today">
                  <option value="today">Today</option>
                  <option value="week" disabled>This week (backend needed)</option>
                </select>
              </label>
              <button className="ml-auto h-9 rounded-md border border-[#e8ece9] bg-white px-2.5 text-[8px] text-[#929c95] opacity-70 max-[640px]:ml-0" type="button" disabled title="Live refresh will be connected to the backend later">
                <span>Updated just now</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.5px] text-[#929c95]">
                  <tr>
                    {["ORDER", "CUSTOMER", "ITEMS", "AMOUNT", "PAYMENT", "STATUS", "TIME", ""].map((item, index) => <th className="px-2.5 py-3 first:pl-[17px] last:pr-[15px]" key={`${item}-${index}`}>{item || <span className="sr-only">View</span>}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr className="border-b border-[#f0f2f0] last:border-0" key={order.id}>
                      <td className="whitespace-nowrap px-2.5 pl-[17px] font-mono text-[8px] font-semibold text-[#5d6a61]">{order.id}</td>
                      <td>
                        <span className="flex min-w-[150px] items-center gap-2.5 py-[7px]">
                          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[8px] font-bold text-[#4b81bc]">{order.initials}</span>
                          <span className="flex flex-col gap-1"><strong className="text-[9px] text-[#354139]">{order.customer}</strong><small className="text-[8px] text-[#99a29c]">{order.phone}</small></span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2.5 text-[8px] text-[#89948d]">{order.itemCount} items</td>
                      <td className="whitespace-nowrap px-2.5 text-[9px] font-bold text-[#354139]">{formatAmount(order.amount)}</td>
                      <td>
                        <span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${paymentClass(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td><StatusPill status={order.status} /></td>
                      <td className="whitespace-nowrap px-2.5 text-[8px] text-[#89948d]">{order.time}</td>
                      <td>
                        <button className="inline-flex h-[29px] items-center gap-1 rounded-md border border-[#e5ebe7] bg-white px-2 text-[8px] font-bold text-[#59655e] hover:border-[#b9d5c2] hover:text-[#217847]" type="button" onClick={() => setSelectedOrder(order)}>
                          View <OrdersIcon name="chevron" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleOrders.length === 0 && (
                    <tr><td className="h-[210px] text-center" colSpan={8}>
                      <OrdersIcon name="search" size={22} />
                      <strong className="my-2 block text-[11px] text-[#39453e]">No orders found</strong>
                      <small className="text-[9px] text-[#89948d]">Try another search or status filter.</small>
                      <button className="mt-2 block w-full border-0 bg-transparent text-[9px] font-bold text-[#217847]" type="button" onClick={() => { setSearch(""); setActiveFilter("All orders"); }}>Clear filters</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2.5 border-t border-[#edf0ee] px-[17px] py-3 text-[9px] text-[#929c95]">
              <span>Showing <strong className="text-[#657169]">{visibleOrders.length ? 1 : 0}–{visibleOrders.length}</strong> of <strong className="text-[#657169]">{visibleOrders.length}</strong> demo orders</span>
              <div className="flex gap-1.5"><button className="h-7 rounded-md border border-[#e7ebe8] bg-white px-[9px] text-[8px] text-[#929c95] opacity-65" type="button" disabled>Previous</button><button className="h-7 rounded-md border border-[#e7ebe8] bg-white px-[9px] text-[8px] text-[#929c95] opacity-65" type="button" disabled>Next</button></div>
            </div>
          </section>
          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">Demo orders · Changes are saved in this browser&apos;s local storage, not a shared backend.</p>
        </div>
      </main>

      {notice && <div className="fixed bottom-5 right-5 z-40 rounded-lg bg-[#1d3325] px-4 py-3 text-[10px] font-semibold text-white shadow-lg max-[640px]:bottom-3 max-[640px]:left-3 max-[640px]:right-3" role="status">{notice}</div>}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
          availablePartners={availablePartners}
        />
      )}
    </div>
  );
}
