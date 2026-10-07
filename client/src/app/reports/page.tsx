"use client";

import { useMemo, useState } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useOrdersDemo, type DemoOrder, type OrderStatus } from "@/components/orders-demo-provider";

const statusGroups: { label: string; statuses: OrderStatus[]; tone: string; bar: string }[] = [
  { label: "Needs action", statuses: ["Pending", "Confirmed"], tone: "text-[#c17a32]", bar: "bg-[#dfa847]" },
  { label: "Preparing", statuses: ["Preparing", "Packed"], tone: "text-[#4b81bc]", bar: "bg-[#6c9bca]" },
  { label: "On the way", statuses: ["Assigned", "Out for delivery"], tone: "text-[#7761bc]", bar: "bg-[#9380cc]" },
  { label: "Delivered", statuses: ["Delivered"], tone: "text-[#32814c]", bar: "bg-[#69aa7b]" },
  { label: "Cancelled", statuses: ["Cancelled"], tone: "text-[#ce6659]", bar: "bg-[#d77d70]" },
];

function formatAmount(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function csvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadOrdersCsv(orders: DemoOrder[]) {
  const rows = [
    ["Order ID", "Customer", "Phone", "Time", "Items", "Amount (INR)", "Payment method", "Payment status", "Order status", "Delivery partner"],
    ...orders.map((order) => [
      order.id,
      order.customer,
      order.phone,
      order.time,
      order.itemCount,
      order.amount.toFixed(2),
      order.paymentMethod,
      order.paymentStatus,
      order.status,
      order.deliveryPartner ?? "",
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvValue).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "greenmart-demo-orders.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { orders } = useOrdersDemo();
  const [range, setRange] = useState<"today" | "all">("today");

  const metrics = useMemo(() => {
    const completed = orders.filter((order) => order.status === "Delivered");
    const paid = orders.filter((order) => order.paymentStatus === "Paid");
    const revenue = paid.reduce((sum, order) => sum + order.amount, 0);
    const grossOrderValue = orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + order.amount, 0);
    const products = new Map<string, { quantity: number; revenue: number }>();
    for (const order of orders) {
      if (order.status === "Cancelled") continue;
      for (const item of order.items) {
        const current = products.get(item.name) ?? { quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.quantity * item.price;
        products.set(item.name, current);
      }
    }
    const topProducts = [...products.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5);
    const statuses = statusGroups.map((group) => ({
      ...group,
      count: orders.filter((order) => group.statuses.includes(order.status)).length,
    }));
    const paymentMethods = (["UPI", "Card", "Cash on delivery"] as const).map((method) => ({
      method,
      count: orders.filter((order) => order.paymentMethod === method).length,
      paid: orders.filter((order) => order.paymentMethod === method && order.paymentStatus === "Paid").reduce((sum, order) => sum + order.amount, 0),
    }));
    return {
      totalOrders: orders.length,
      completedOrders: completed.length,
      paidOrders: paid.length,
      revenue,
      grossOrderValue,
      averagePaidOrder: paid.length ? revenue / paid.length : 0,
      completionRate: orders.length ? (completed.length / orders.length) * 100 : 0,
      statuses,
      paymentMethods,
      topProducts,
      highestProductQuantity: topProducts[0]?.quantity ?? 0,
    };
  }, [orders]);

  const metricCards = [
    { label: "Total orders", value: metrics.totalOrders, helper: "In current demo snapshot", icon: "receipt", tone: "bg-[#eaf2fb] text-[#4b81bc]" },
    { label: "Paid order value", value: formatAmount(metrics.revenue), helper: `${metrics.paidOrders} paid orders`, icon: "rupee", tone: "bg-[#e9f5ed] text-[#22834c]" },
    { label: "Average paid order", value: formatAmount(metrics.averagePaidOrder), helper: "Paid value ÷ paid orders", icon: "trend", tone: "bg-[#f0edfb] text-[#7761bc]" },
    { label: "Completion rate", value: `${metrics.completionRate.toFixed(0)}%`, helper: `${metrics.completedOrders} delivered orders`, icon: "check", tone: "bg-[#fff2e6] text-[#d4873b]" },
  ];

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Reports" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Reports" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px] flex items-center justify-between gap-[18px] max-[640px]:items-start max-[640px]:flex-col">
            <div><p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">BUSINESS INSIGHTS</p><h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Reports</h1><p className="m-0 text-[11px] text-[#818b85]">A snapshot of orders, sales and product performance.</p></div>
            <div className="flex items-center gap-2 max-[640px]:w-full">
              <label className="flex h-[38px] items-center gap-2 rounded-lg border border-[#e2e8e4] bg-white px-[11px] text-[9px] text-[#69756e] max-[640px]:flex-1"><span>Date range</span><select className="border-0 bg-transparent text-[9px] font-semibold text-[#39453e] outline-none" value={range} onChange={(event) => setRange(event.target.value as "today" | "all")} aria-label="Report date range"><option value="today">Today (demo)</option><option value="all">All demo orders</option></select></label>
              <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e] max-[640px]:flex-1" type="button" onClick={() => downloadOrdersCsv(orders)}><AdminIcon name="download" size={15} />Export CSV</button>
            </div>
          </div>

          <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#e9edea] bg-white px-3 py-2.5 text-[8px] leading-[1.5] text-[#89948d]"><AdminIcon name="alert" size={15} /><span>Demo snapshot only. Orders do not contain calendar dates, so “Today” and “All demo orders” currently show the same seeded sample; live date-based reporting needs the backend.</span></div>

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Reports summary">
            {metricCards.map((card) => <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5" key={card.label}><span className={`row-span-2 grid size-9 place-items-center self-center rounded-[9px] ${card.tone}`}><AdminIcon name={card.icon} /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">{card.label}</span><strong className={`text-xl font-bold max-[640px]:text-[15px] ${card.label.includes("value") || card.label.includes("Average") ? "text-[16px]" : ""}`}>{card.value}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">{card.helper}</small></article>)}
          </section>

          <section className="mb-[17px] grid grid-cols-[1.25fr_1fr] gap-[13px] max-[900px]:grid-cols-1">
            <article className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#edf0ee] px-[17px] py-3.5"><div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">ORDER VALUE</p><h2 className="mb-0 mt-1.5 text-[13px] font-bold text-[#334038]">Sales by order</h2></div><span className="text-[8px] text-[#929c95]">Excludes cancelled orders</span></div>
              <div className="space-y-3 px-[17px] py-[15px]">
                {orders.filter((order) => order.status !== "Cancelled").sort((a, b) => b.minutesAgo - a.minutesAgo).map((order) => {
                  const width = metrics.grossOrderValue > 0 ? (order.amount / metrics.grossOrderValue) * 100 : 0;
                  return <div className="grid grid-cols-[75px_1fr_72px] items-center gap-2.5 max-[480px]:grid-cols-[60px_1fr_64px]" key={order.id}><span className="font-mono text-[8px] text-[#89948d]">{order.id}</span><div className="h-2 overflow-hidden rounded-full bg-[#f0f3f0]"><div className="h-full rounded-full bg-[#5ba675]" style={{ width: `${width}%` }} /></div><span className="text-right text-[8px] font-semibold text-[#536057]">{formatAmount(order.amount)}</span></div>;
                })}
                {orders.every((order) => order.status === "Cancelled") && <p className="m-0 py-8 text-center text-[9px] text-[#89948d]">No non-cancelled orders in this sample.</p>}
              </div>
              <div className="flex justify-between border-t border-[#edf0ee] px-[17px] py-3 text-[8px] text-[#89948d]"><span>Non-cancelled order value</span><strong className="text-[9px] text-[#354139]">{formatAmount(metrics.grossOrderValue)}</strong></div>
            </article>

            <article className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="border-b border-[#edf0ee] px-[17px] py-3.5"><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">FULFILMENT</p><h2 className="mb-0 mt-1.5 text-[13px] font-bold text-[#334038]">Orders by status</h2></div>
              <div className="space-y-[13px] px-[17px] py-[15px]">
                {metrics.statuses.map((item) => <div className="space-y-1.5" key={item.label}><div className="flex items-center justify-between text-[8px]"><span className={`font-semibold ${item.tone}`}>{item.label}</span><strong className="text-[#536057]">{item.count}<span className="ml-1 font-normal text-[#a0a9a3]">/ {metrics.totalOrders}</span></strong></div><div className="h-1.5 overflow-hidden rounded-full bg-[#f0f3f0]"><div className={`h-full rounded-full ${item.bar}`} style={{ width: `${metrics.totalOrders ? (item.count / metrics.totalOrders) * 100 : 0}%` }} /></div></div>)}
              </div>
            </article>
          </section>

          <section className="grid grid-cols-2 gap-[13px] max-[900px]:grid-cols-1">
            <article className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="border-b border-[#edf0ee] px-[17px] py-3.5"><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">PRODUCT PERFORMANCE</p><h2 className="mb-0 mt-1.5 text-[13px] font-bold text-[#334038]">Top products by units</h2></div>
              <div className="divide-y divide-[#f0f2f0]">
                {metrics.topProducts.map((product, index) => <div className="flex items-center gap-2.5 px-[17px] py-[10px]" key={product.name}><span className="grid size-[25px] shrink-0 place-items-center rounded-md bg-[#f3f6f3] text-[8px] font-bold text-[#78837c]">{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-[9px] font-semibold text-[#354139]">{product.name}</strong><small className="text-[8px] text-[#99a29c]">Item revenue {formatAmount(product.revenue)}</small></span><strong className="whitespace-nowrap text-[9px] text-[#354139]">{product.quantity} units</strong></div>)}
                {metrics.topProducts.length === 0 && <p className="m-0 py-8 text-center text-[9px] text-[#89948d]">No product sales in this sample.</p>}
              </div>
            </article>

            <article className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="border-b border-[#edf0ee] px-[17px] py-3.5"><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">PAYMENT MIX</p><h2 className="mb-0 mt-1.5 text-[13px] font-bold text-[#334038]">Orders by payment method</h2></div>
              <div className="divide-y divide-[#f0f2f0]">
                {metrics.paymentMethods.map((payment) => <div className="flex items-center gap-2.5 px-[17px] py-[12px]" key={payment.method}><span className="grid size-[29px] shrink-0 place-items-center rounded-lg bg-[#f3f6f3] text-[#78837c]"><AdminIcon name={payment.method === "Cash on delivery" ? "delivery" : payment.method === "Card" ? "receipt" : "rupee"} size={15} /></span><span className="min-w-0 flex-1"><strong className="block text-[9px] font-semibold text-[#354139]">{payment.method}</strong><small className="text-[8px] text-[#99a29c]">{payment.count} orders</small></span><strong className="whitespace-nowrap text-[9px] text-[#354139]">{formatAmount(payment.paid)}<small className="ml-1 font-normal text-[#99a29c]">paid</small></strong></div>)}
              </div>
              <div className="flex justify-between border-t border-[#edf0ee] px-[17px] py-3 text-[8px] text-[#89948d]"><span>Average paid order value</span><strong className="text-[9px] text-[#354139]">{formatAmount(metrics.averagePaidOrder)}</strong></div>
            </article>
          </section>

          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">Reports use the same browser-local demo orders as the Orders and Customers pages. Export contains those demo orders only.</p>
        </div>
      </main>
    </div>
  );
}
