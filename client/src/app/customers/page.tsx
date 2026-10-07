"use client";

import { useMemo, useState } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useOrdersDemo, type DemoOrder } from "@/components/orders-demo-provider";

type CustomerFilter = "All customers" | "Repeat customers" | "First order";
type Customer = {
  name: string;
  initials: string;
  phone: string;
  address: string;
  orderCount: number;
  totalPaid: number;
  latestOrder: DemoOrder;
};

const filters: CustomerFilter[] = ["All customers", "Repeat customers", "First order"];

function formatAmount(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function CustomerDetails({ customer, orders, onClose }: {
  customer: Customer;
  orders: DemoOrder[];
  onClose: () => void;
}) {
  const customerOrders = orders.filter((order) => order.phone === customer.phone).sort((a, b) => a.minutesAgo - b.minutesAgo);
  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#142019]/45 p-5 max-[640px]:items-end max-[640px]:p-2" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="max-h-[calc(100vh-40px)] w-full max-w-[620px] overflow-y-auto rounded-[13px] border border-[#e9edea] bg-white shadow-[0_20px_70px_rgba(12,27,17,0.2)] max-[640px]:max-h-[calc(100vh-16px)]" role="dialog" aria-modal="true" aria-labelledby="customer-details-title">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-[22px] py-5 max-[640px]:px-[15px]">
          <div className="flex items-center gap-3">
            <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[11px] font-bold text-[#4b81bc]">{customer.initials}</span>
            <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">CUSTOMER PROFILE</p><h2 className="mb-1 mt-1 text-[17px] font-bold text-[#1b2820]" id="customer-details-title">{customer.name}</h2><p className="m-0 text-[9px] text-[#89948d]">{customer.phone}</p></div>
          </div>
          <button className="grid size-[31px] shrink-0 place-items-center rounded-md border border-[#edf0ee] bg-white text-[#79847d] hover:bg-[#f8faf8]" type="button" onClick={onClose} aria-label="Close customer details"><AdminIcon name="close" /></button>
        </div>
        <div className="space-y-4 px-[22px] py-[18px] max-[640px]:px-[15px]">
          <section className="grid grid-cols-3 gap-2 max-[420px]:grid-cols-1">
            <div className="rounded-lg border border-[#edf0ee] p-3"><small className="text-[8px] text-[#89948d]">Orders</small><strong className="mt-1 block text-[15px] text-[#28372e]">{customer.orderCount}</strong></div>
            <div className="rounded-lg border border-[#edf0ee] p-3"><small className="text-[8px] text-[#89948d]">Paid total</small><strong className="mt-1 block text-[15px] text-[#28372e]">{formatAmount(customer.totalPaid)}</strong></div>
            <div className="rounded-lg border border-[#edf0ee] p-3"><small className="text-[8px] text-[#89948d]">Latest order</small><strong className="mt-1 block text-[12px] text-[#28372e]">{customer.latestOrder.id}</strong></div>
          </section>
          <section className="rounded-lg border border-[#edf0ee] p-3.5">
            <h3 className="mb-2 mt-0 text-[10px] font-bold text-[#39453e]">Delivery address</h3>
            <p className="m-0 flex items-start gap-1.5 text-[9px] leading-[1.6] text-[#78837c]"><AdminIcon name="pin" size={15} />{customer.address}</p>
          </section>
          <section className="overflow-hidden rounded-lg border border-[#edf0ee]">
            <div className="border-b border-[#edf0ee] px-3.5 py-3"><h3 className="m-0 text-[10px] font-bold text-[#39453e]">Order history <span className="ml-1 rounded-full bg-[#f0f2f0] px-1.5 py-[3px] text-[8px] text-[#77827b]">{customerOrders.length}</span></h3></div>
            <div className="divide-y divide-[#f0f2f0]">
              {customerOrders.map((order) => <div className="flex items-center gap-2.5 px-3.5 py-2.5" key={order.id}>
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#f4f6f4] text-[#6d7872]"><AdminIcon name="receipt" size={15} /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-[9px] text-[#354139]">{order.id} · {order.time}</strong><small className="text-[8px] text-[#89948d]">{order.itemCount} items · {order.status} · {order.paymentStatus}</small></span>
                <strong className="whitespace-nowrap text-[9px] text-[#354139]">{formatAmount(order.amount)}</strong>
              </div>)}
            </div>
          </section>
          <p className="m-0 text-[8px] text-[#9ca69f]">Demo customer data · Contact details and order history are not connected to a live service.</p>
        </div>
        <div className="flex justify-end border-t border-[#edf0ee] px-[22px] py-[14px] max-[640px]:px-[15px]"><button className="h-[36px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[9px] font-bold text-[#59655e]" type="button" onClick={onClose}>Close</button></div>
      </section>
    </div>
  );
}

export default function CustomersPage() {
  const { orders } = useOrdersDemo();
  const [activeFilter, setActiveFilter] = useState<CustomerFilter>("All customers");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const customers = useMemo(() => {
    const byPhone = new Map<string, Customer>();
    for (const order of orders) {
      const customer = byPhone.get(order.phone);
      if (customer) {
        customer.orderCount += 1;
        if (order.paymentStatus === "Paid") customer.totalPaid += order.amount;
        if (order.minutesAgo < customer.latestOrder.minutesAgo) {
          customer.latestOrder = order;
          customer.address = order.address;
        }
      } else {
        byPhone.set(order.phone, {
          name: order.customer,
          initials: order.initials,
          phone: order.phone,
          address: order.address,
          orderCount: 1,
          totalPaid: order.paymentStatus === "Paid" ? order.amount : 0,
          latestOrder: order,
        });
      }
    }
    return [...byPhone.values()].sort((a, b) => a.latestOrder.minutesAgo - b.latestOrder.minutesAgo);
  }, [orders]);

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !query || [customer.name, customer.phone, customer.address].some((value) => value.toLowerCase().includes(query));
      const matchesFilter = activeFilter === "All customers" || (activeFilter === "Repeat customers" ? customer.orderCount > 1 : customer.orderCount === 1);
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, customers, search]);

  const repeatCount = customers.filter((customer) => customer.orderCount > 1).length;
  const totalPaid = customers.reduce((sum, customer) => sum + customer.totalPaid, 0);
  const totalOrders = orders.length;

  function countFor(filter: CustomerFilter) {
    if (filter === "All customers") return customers.length;
    return customers.filter((customer) => filter === "Repeat customers" ? customer.orderCount > 1 : customer.orderCount === 1).length;
  }

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Customers" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Customers" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px]">
            <p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">CUSTOMER RELATIONSHIPS</p>
            <h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Customers</h1>
            <p className="m-0 text-[11px] text-[#818b85]">View customer profiles, purchase history and repeat-order activity.</p>
          </div>

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Customer summary">
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#eaf2fb] text-[#4b81bc]"><AdminIcon name="customers" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Total customers</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{customers.length}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">From demo orders</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#e9f5ed] text-[#22834c]"><AdminIcon name="check" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Repeat customers</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{repeatCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">More than one order</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#fff2e6] text-[#d4873b]"><AdminIcon name="receipt" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Demo orders</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{totalOrders}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Across all demo customers</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#f0edfb] text-[#7761bc]"><AdminIcon name="rupee" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Paid order value</span><strong className="text-[15px] font-bold max-[640px]:text-[12px]">{formatAmount(totalPaid)}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Excludes pending and refunded</small></article>
          </section>

          <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
            <div className="flex gap-[15px] overflow-x-auto border-b border-[#edf0ee] px-[15px]" aria-label="Filter customers">
              {filters.map((filter) => <button className={`relative inline-flex h-12 shrink-0 items-center gap-[7px] border-0 bg-transparent px-1 text-[9px] font-semibold ${activeFilter === filter ? "text-[#147744] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-[#18834b]" : "text-[#77827b]"}`} key={filter} type="button" onClick={() => setActiveFilter(filter)} aria-pressed={activeFilter === filter}>{filter}<span className={`rounded-full px-1.5 py-[3px] text-[8px] ${activeFilter === filter ? "bg-[#eaf5ee] text-[#26794a]" : "bg-[#f0f2f0] text-[#7f8982]"}`}>{countFor(filter)}</span></button>)}
            </div>
            <div className="flex flex-wrap items-center gap-3 p-[15px] max-[640px]:gap-2 max-[640px]:p-3">
              <label className="flex h-9 w-[330px] max-w-full items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[#8c9790] focus-within:border-[#8bb99a] focus-within:ring-2 focus-within:ring-[#18834b]/10"><AdminIcon name="search" size={17} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#354139] outline-none placeholder:text-[#a0a9a3]" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone or address..." aria-label="Search customers" /></label>
              <span className="ml-auto text-[8px] text-[#929c95] max-[640px]:ml-0">Showing {visibleCustomers.length} of {customers.length} demo customers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[870px] border-collapse text-left">
                <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.5px] text-[#929c95]"><tr>{["CUSTOMER", "ORDERS", "PAID TOTAL", "LAST ORDER", "LATEST STATUS", "CUSTOMER TYPE", ""].map((heading, index) => <th className="px-2.5 py-3 first:pl-[17px] last:pr-[17px]" key={`${heading}-${index}`}>{heading || <span className="sr-only">View customer</span>}</th>)}</tr></thead>
                <tbody>
                  {visibleCustomers.map((customer) => <tr className="border-b border-[#f0f2f0] last:border-0" key={customer.phone}>
                    <td className="px-2.5 py-[9px] pl-[17px]"><div className="flex min-w-[210px] items-center gap-[9px]"><span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[9px] font-bold text-[#4b81bc]">{customer.initials}</span><span className="flex flex-col gap-1"><strong className="text-[9px] font-bold text-[#354139]">{customer.name}</strong><small className="text-[8px] text-[#99a29c]">{customer.phone}</small></span></div></td>
                    <td className="px-2.5 text-[9px] font-semibold text-[#4d5c52]">{customer.orderCount}</td>
                    <td className="px-2.5 text-[9px] font-bold text-[#354139]">{formatAmount(customer.totalPaid)}</td>
                    <td className="px-2.5"><span className="flex flex-col gap-1"><strong className="font-mono text-[8px] text-[#5d6a61]">{customer.latestOrder.id}</strong><small className="text-[8px] text-[#99a29c]">Today, {customer.latestOrder.time}</small></span></td>
                    <td className="px-2.5"><span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${customer.latestOrder.status === "Delivered" ? "bg-[#eaf6ed] text-[#32814c]" : customer.latestOrder.status === "Cancelled" ? "bg-[#fff0ee] text-[#ce6659]" : "bg-[#eaf2fb] text-[#4b81bc]"}`}>{customer.latestOrder.status}</span></td>
                    <td className="px-2.5"><span className={`inline-flex rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${customer.orderCount > 1 ? "bg-[#f1effa] text-[#7664ae]" : "bg-[#f3f4f3] text-[#7b8680]"}`}>{customer.orderCount > 1 ? "Repeat" : "First order"}</span></td>
                    <td className="px-2.5 pr-[17px]"><button className="inline-flex h-[29px] items-center gap-1 rounded-md border border-[#e5ebe7] bg-white px-2 text-[8px] font-bold text-[#59655e] hover:border-[#b9d5c2] hover:text-[#217847]" type="button" onClick={() => setSelectedCustomer(customer)}>View <AdminIcon name="chevron" size={13} /></button></td>
                  </tr>)}
                  {visibleCustomers.length === 0 && <tr><td className="h-[210px] text-center" colSpan={7}><AdminIcon name="search" size={22} /><strong className="my-2 block text-[11px] text-[#39453e]">No customers found</strong><small className="text-[9px] text-[#89948d]">Try another search or choose a different customer filter.</small><button className="mt-2 block w-full border-0 bg-transparent text-[9px] font-bold text-[#217847]" type="button" onClick={() => { setSearch(""); setActiveFilter("All customers"); }}>Clear filters</button></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">Demo customers are derived from the Orders page and share its browser-local order data.</p>
        </div>
      </main>
      {selectedCustomer && <CustomerDetails customer={selectedCustomer} orders={orders} onClose={() => setSelectedCustomer(null)} />}
    </div>
  );
}
