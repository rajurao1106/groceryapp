"use client";

import Link from "next/link";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useOrdersDemo, type OrderStatus } from "@/components/orders-demo-provider";
import { useProductCatalog } from "@/components/product-catalog-provider";
import { useDeliveryPartnersDemo } from "@/components/delivery-partners-demo-provider";

function formatAmount(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function orderStatusTone(status: OrderStatus) {
  if (status === "Delivered") return "bg-[#eaf6ed] text-[#32814c]";
  if (status === "Cancelled") return "bg-[#fff0ee] text-[#ce6659]";
  if (["Pending", "Confirmed"].includes(status)) return "bg-[#fff4e5] text-[#b7792d]";
  if (["Assigned", "Out for delivery"].includes(status)) return "bg-[#edf3ff] text-[#5277b3]";
  return "bg-[#f1f2f3] text-[#727d76]";
}

const avatarTones = [
  "bg-[#eeeafa] text-[#7965b8]",
  "bg-[#fff0e7] text-[#c77b48]",
  "bg-[#e7f4eb] text-[#3e8855]",
  "bg-[#e9f1fa] text-[#527ba9]",
];

export default function Home() {
  const { orders } = useOrdersDemo();
  const { products } = useProductCatalog();
  const { partners } = useDeliveryPartnersDemo();
  const paidOrders = orders.filter((order) => order.paymentStatus === "Paid");
  const revenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);
  const activeDeliveries = orders.filter((order) => ["Assigned", "Out for delivery"].includes(order.status));
  const recentOrders = [...orders].sort((first, second) => first.minutesAgo - second.minutesAgo).slice(0, 4);
  const lowStockProducts = products
    .filter((product) => product.status !== "Draft" && product.stock <= 10)
    .sort((first, second) => first.stock - second.stock);
  const stockAlerts = lowStockProducts.slice(0, 3);
  const statusGroups: { label: string; statuses: OrderStatus[]; color: string }[] = [
    { label: "Needs action", statuses: ["Pending", "Confirmed"], color: "bg-[#dfa847]" },
    { label: "Preparing", statuses: ["Preparing", "Packed"], color: "bg-[#6c9bca]" },
    { label: "On the way", statuses: ["Assigned", "Out for delivery"], color: "bg-[#9380cc]" },
    { label: "Delivered", statuses: ["Delivered"], color: "bg-[#69aa7b]" },
    { label: "Cancelled", statuses: ["Cancelled"], color: "bg-[#d77d70]" },
  ];
  const statusCounts = statusGroups.map((group) => ({ ...group, count: orders.filter((order) => group.statuses.includes(order.status)).length }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((group) => group.count));
  const deliveryOrders = new Map<string, (typeof activeDeliveries)[number]>();
  activeDeliveries.forEach((order) => {
    if (order.deliveryPartner) deliveryOrders.set(order.deliveryPartner, order);
  });
  const activePartners = partners.filter((partner) => partner.status === "On delivery");
  const metrics = [
    { label: "Paid order value", value: formatAmount(revenue), note: `${paidOrders.length} paid orders`, icon: "rupee", tone: "bg-[#e9f5ed] text-[#22834c]" },
    { label: "Total orders", value: String(orders.length), note: "Saved demo orders", icon: "orders", tone: "bg-[#f0edfb] text-[#7761bc]" },
    { label: "Average paid order", value: formatAmount(paidOrders.length ? revenue / paidOrders.length : 0), note: "Paid value ÷ paid orders", icon: "trend", tone: "bg-[#eaf2fb] text-[#4b81bc]" },
    { label: "Active deliveries", value: String(activeDeliveries.length), note: `${activePartners.length} partners on delivery`, icon: "delivery", tone: "bg-[#fff2e6] text-[#d4873b]" },
  ];

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Dashboard" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Dashboard" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <section className="mb-[26px] flex items-center justify-between gap-5 max-[640px]:items-start">
            <div>
              <p className="text-[9px] font-bold tracking-[1.05px] text-[#89948d]">SUNDAY, OCTOBER 4, 2026</p>
              <h1 className="mb-1.5 mt-2 text-[29px] font-bold tracking-[-1.05px] text-[#17211d] max-[640px]:max-w-[240px] max-[640px]:text-[23px]">Good morning, Rohan <span className="text-[19px] text-[#eab84e]">✳</span></h1>
              <p className="m-0 text-xs text-[#818b85] max-[640px]:max-w-[250px] max-[640px]:text-[11px]">Here&apos;s what&apos;s happening with your store today.</p>
            </div>
            <Link className="inline-flex h-[38px] shrink-0 items-center gap-2 rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[11px] font-semibold text-[#59655e] no-underline hover:bg-[#f8faf8] max-[640px]:size-[38px] max-[640px]:overflow-hidden max-[640px]:px-2.5 max-[640px]:text-transparent" href="/reports" title="View reports">
              <AdminIcon name="reports" size={17} />View reports
            </Link>
          </section>

          <section className="grid grid-cols-4 gap-[15px] max-[1200px]:gap-2.5 max-[980px]:grid-cols-2 max-[640px]:gap-[9px]" aria-label="Store overview">
            {metrics.map((metric) => (
              <article className="min-w-0 rounded-[11px] border border-[#edf0ee] bg-white p-[17px] shadow-[0_2px_7px_rgba(27,42,33,0.02)] max-[1200px]:p-3.5 max-[640px]:p-3" key={metric.label}>
                <span className={`grid size-[34px] place-items-center rounded-[9px] ${metric.tone}`}><AdminIcon name={metric.icon} size={20} /></span>
                <p className="mb-1.5 mt-3.5 text-[10px] font-medium text-[#78837c]">{metric.label}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-[23px] font-bold tracking-[-0.8px] text-[#1c2821] max-[1200px]:text-xl max-[640px]:text-[19px]">{metric.value}</strong>
                  <span className="rounded-full bg-[#f1f3f1] px-1.5 py-1 text-[8px] font-bold text-[#78837c]">Demo</span>
                </div>
                <p className="mb-0 mt-[7px] text-[9px] text-[#a0a9a3] max-[640px]:text-[8px]">{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="mt-4 grid grid-cols-[minmax(0,1.75fr)_minmax(290px,1fr)] gap-[15px] max-[1200px]:grid-cols-[minmax(0,1.45fr)_minmax(270px,1fr)] max-[980px]:grid-cols-1 max-[640px]:gap-[9px]">
            <article className="min-w-0 rounded-[11px] border border-[#edf0ee] bg-white p-[18px] shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
              <div className="flex items-center justify-between gap-2.5">
                <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">ORDER SNAPSHOT</p><h2 className="mb-0 mt-1.5 text-sm font-bold text-[#202b25]">Orders by status</h2></div>
                <span className="rounded-full bg-[#f1f3f1] px-2 py-1 text-[8px] font-semibold text-[#78837c]">All demo orders</span>
              </div>
              <div className="mt-5 space-y-3">
                {statusCounts.map((group) => (
                  <div className="grid grid-cols-[85px_minmax(0,1fr)_22px] items-center gap-2 text-[9px]" key={group.label}>
                    <span className="truncate text-[#78837c]">{group.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[#f1f3f1]">
                      <span className={`block h-full rounded-full ${group.color}`} style={{ width: `${(group.count / maxStatusCount) * 100}%` }} />
                    </span>
                    <strong className="text-right text-[#39453e]">{group.count}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="min-w-0 rounded-[11px] border border-[#edf0ee] bg-white p-[18px] shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
              <div className="flex items-center justify-between gap-2">
                <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">NEEDS ATTENTION</p><h2 className="mb-0 mt-1.5 flex items-center gap-2 text-sm font-bold text-[#202b25]">Low stock alerts <span className="grid size-[19px] place-items-center rounded-md bg-[#fff2e7] text-[10px] text-[#d57e2f]">{lowStockProducts.length}</span></h2></div>
                <Link className="inline-flex items-center gap-1 text-[9px] font-bold text-[#318052] no-underline" href="/inventory">View inventory <AdminIcon name="arrow" size={15} /></Link>
              </div>
              <div className="mt-[13px]">
                {stockAlerts.map((item) => (
                  <div className="flex items-center gap-2.5 border-b border-[#f0f2f0] py-3 last:border-0" key={item.name}>
                    <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-[#f4f6f4] text-lg">{item.image}</span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="truncate text-[10px] font-semibold text-[#303b35]">{item.name}</strong><small className="text-[9px] text-[#9aa39d]">{item.packSize} · {item.category}</small></span>
                    <span className="flex items-baseline gap-[3px] text-[9px] text-[#929b95]"><strong className={`text-[13px] ${item.stock < 5 ? "text-[#d25d51]" : "text-[#cb8339]"}`}>{item.stock}</strong>left</span>
                  </div>
                ))}
              </div>
              {lowStockProducts.length > 0
                ? <div className="mt-1 flex items-center gap-[7px] rounded-md bg-[#fff7ed] p-[9px] text-[9px] text-[#b97531]"><AdminIcon name="alert" size={16} />{lowStockProducts.length} products need restocking soon</div>
                : <p className="mt-1 rounded-md bg-[#eef8f1] p-[9px] text-[9px] text-[#338052]">No low-stock products.</p>}
            </article>
          </section>

          <section className="mt-4 grid grid-cols-[minmax(0,1.75fr)_minmax(290px,1fr)] gap-[15px] max-[1200px]:grid-cols-[minmax(0,1.45fr)_minmax(270px,1fr)] max-[980px]:grid-cols-1 max-[640px]:gap-[9px]">
            <article className="min-w-0 overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
              <div className="flex items-center justify-between gap-2.5 px-[18px] pb-[15px] pt-[18px]">
                <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">LIVE UPDATES</p><h2 className="mb-0 mt-1.5 flex items-center gap-2 text-sm font-bold text-[#202b25]">Recent orders <span className="inline-flex items-center gap-[5px] rounded-full bg-[#eef8f1] px-[7px] py-1 text-[8px] font-bold text-[#338052]"><i className="size-[7px] rounded-full bg-[#42a36a]" />LIVE</span></h2></div>
                <Link className="inline-flex items-center gap-1 text-[9px] font-bold text-[#318052] no-underline" href="/orders">View all orders <AdminIcon name="arrow" size={15} /></Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[660px] border-collapse text-left">
                  <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.55px] text-[#929c95]"><tr>{["ORDER", "CUSTOMER", "TIME", "ITEMS", "AMOUNT", "STATUS"].map((header) => <th className="px-[9px] py-2.5 first:pl-[18px] last:pr-[18px]" key={header}>{header}</th>)}</tr></thead>
                  <tbody>{recentOrders.map((order, index) => (
                    <tr className="border-b border-[#f0f2f0] last:border-0" key={order.id}>
                      <td className="px-[9px] py-2.5 pl-[18px] text-[9px] font-bold text-[#313e36]">{order.id}</td>
                      <td className="px-[9px] py-2.5 text-[9px] text-[#4b5750]"><span className="inline-flex items-center gap-[7px]"><i className={`grid size-[25px] place-items-center rounded-full text-[8px] font-bold not-italic ${avatarTones[index % avatarTones.length]}`}>{order.initials}</i>{order.customer}</span></td>
                      <td className="px-[9px] py-2.5 text-[9px] text-[#8e9992]">{order.time}</td>
                      <td className="px-[9px] py-2.5 text-[9px] text-[#8e9992]">{order.itemCount} items</td>
                      <td className="px-[9px] py-2.5 text-[9px] font-bold text-[#313e36]">{formatAmount(order.amount)}</td>
                      <td className="px-[9px] py-2.5 pr-[18px]"><span className={`inline-flex rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${orderStatusTone(order.status)}`}>{order.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </article>

            <article className="min-w-0 rounded-[11px] border border-[#edf0ee] bg-white p-[18px] pb-0 shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
              <div className="flex items-center justify-between gap-2"><div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">ON THE MOVE</p><h2 className="mb-0 mt-1.5 text-sm font-bold text-[#202b25]">Delivery activity</h2></div><span className="inline-flex items-center gap-[7px] rounded-full border border-[#e6f1e9] px-2 py-[5px] text-[9px] text-[#43875a]"><i className="size-[7px] rounded-full bg-[#42a36a]" />Live</span></div>
              <div className="mt-[15px] flex items-center gap-[11px] rounded-lg bg-[#f7faf8] p-[11px]">
                <span className="grid size-[34px] place-items-center rounded-[9px] bg-[#e9f5ed] text-[#318352]"><AdminIcon name="delivery" size={20} /></span>
                <div className="flex flex-col gap-[3px]"><strong className="text-[15px]">{activeDeliveries.length}</strong><small className="text-[8px] text-[#919b94]">active deliveries</small></div>
                <span className="mx-1 h-[27px] w-px bg-[#e5ebe7]" />
                <div className="flex flex-col gap-[3px]"><strong className="text-[15px]">{partners.filter((partner) => ["Available", "On delivery"].includes(partner.status)).length}</strong><small className="text-[8px] text-[#919b94]">partners online</small></div>
              </div>
              <div className="mt-[5px]">
                {activePartners.length > 0 ? activePartners.slice(0, 3).map((partner, index) => {
                  const order = deliveryOrders.get(partner.name);
                  return (
                  <div className="flex items-center gap-2 border-b border-[#f0f2f0] py-2.5 last:border-0" key={partner.id}>
                    <span className={`grid size-[29px] place-items-center rounded-full text-[8px] font-bold ${avatarTones[index % avatarTones.length]}`}>{partner.initials}</span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-[9px] font-semibold text-[#39453e]">{partner.name}</strong><small className="text-[8px] text-[#929c95]">{order ? <>Delivering <b className="font-semibold text-[#66736b]">{order.id}</b></> : "On delivery"}</small></span>
                    {order && <span className="text-[8px] text-[#728078]">{order.status}</span>}
                  </div>
                  );
                }) : <p className="py-4 text-[9px] text-[#929c95]">No partners currently on delivery.</p>}
              </div>
              <div className="-mx-[18px] flex items-center gap-1.5 border-t border-[#edf0ee] px-[18px] py-3 text-[9px] text-[#7e8982]"><AdminIcon name="check" size={15} /><span>Partner status</span><strong className="ml-auto text-[10px] text-[#303c34]">From orders</strong></div>
            </article>
          </section>
          <footer className="flex justify-between gap-2.5 px-0.5 pb-1 pt-[18px] text-[9px] text-[#a0a9a3] max-[640px]:flex-col"><span>Greenmart Admin <span className="px-1">·</span> Dashboard preview</span><span>Sample data for UI preview only</span></footer>
        </div>
      </main>
    </div>
  );
}
