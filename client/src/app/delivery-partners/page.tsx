"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useDeliveryPartnersDemo, type PartnerStatus, type DeliveryPartner } from "@/components/delivery-partners-demo-provider";

const filters = ["All partners", "Available", "On delivery", "Offline", "Pending review"] as const;

function statusStyles(status: PartnerStatus) {
  if (status === "Available") return "bg-[#eaf6ed] text-[#32814c]";
  if (status === "On delivery") return "bg-[#eaf2fb] text-[#4b81bc]";
  if (status === "Pending review") return "bg-[#fff3e5] text-[#c17a32]";
  return "bg-[#f1f3f1] text-[#7b8680]";
}

function PartnerModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#142019]/45 p-5 max-[640px]:items-end max-[640px]:p-2" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="max-h-[calc(100vh-40px)] w-full max-w-[560px] overflow-y-auto rounded-[13px] border border-[#e9edea] bg-white shadow-[0_20px_70px_rgba(12,27,17,0.2)] max-[640px]:max-h-[calc(100vh-16px)]" role="dialog" aria-modal="true" aria-labelledby="partner-modal-title">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-[22px] py-5 max-[640px]:px-[15px]">
          <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">PARTNER ONBOARDING</p><h2 className="mb-1.5 mt-1.5 text-[19px] font-bold text-[#1b2820]" id="partner-modal-title">Add delivery partner</h2><p className="m-0 text-[10px] text-[#89948d]">Add a demo profile. Document verification comes later.</p></div>
          <button className="grid size-[31px] shrink-0 place-items-center rounded-md border border-[#edf0ee] bg-white text-[#79847d] hover:bg-[#f8faf8]" type="button" onClick={onClose} aria-label="Close dialog"><AdminIcon name="close" /></button>
        </div>
        <form className="px-[22px] pb-5 pt-[18px] max-[640px]:px-[15px]" onSubmit={onSave}>
          <div className="grid grid-cols-2 gap-[13px] max-[480px]:grid-cols-1">
            <label className="col-span-2 flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057] max-[480px]:col-span-1">Full name *<input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="name" placeholder="e.g. Aman Sharma" required autoFocus /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]">Phone number *<input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="phone" type="tel" pattern="[+]?[0-9 ()-]{10,18}" placeholder="+91 98765 43210" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]">Delivery zone *<input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="zone" placeholder="e.g. Indiranagar" required /></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]">Vehicle type *<select className="h-9 rounded-md border border-[#e4eae6] bg-white px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="vehicle" defaultValue="Motorcycle"><option>Motorcycle</option><option>Scooter</option><option>Bicycle</option><option>Electric vehicle</option></select></label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057]">Initial status<select className="h-9 rounded-md border border-[#e4eae6] bg-white px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="status" defaultValue="Pending review"><option>Pending review</option><option>Available</option><option>Offline</option></select></label>
          </div>
          <p className="mt-3 rounded-md bg-[#f7f9f7] p-2.5 text-[8px] leading-[1.6] text-[#89948d]">This demo form does not collect identity, licence or vehicle documents. Add secure document verification when the backend is implemented.</p>
          <div className="mt-[17px] flex justify-end gap-2 border-t border-[#edf0ee] pt-[15px]">
            <button className="h-[38px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[10px] font-bold text-[#59655e]" type="button" onClick={onClose}>Cancel</button>
            <button className="h-[38px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e]" type="submit">Add partner</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function DeliveryPartnersPage() {
  const { partners, setPartners } = useDeliveryPartnersDemo();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All partners");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const visiblePartners = useMemo(() => {
    const query = search.trim().toLowerCase();
    return partners.filter((partner) => {
      const matchesSearch = !query || [partner.name, partner.phone, partner.zone, partner.vehicle].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (activeFilter === "All partners" || partner.status === activeFilter);
    });
  }, [activeFilter, partners, search]);

  function savePartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const partner: DeliveryPartner = {
      id: Date.now(),
      name,
      phone: String(data.get("phone")).trim(),
      initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join(""),
      zone: String(data.get("zone")).trim(),
      vehicle: String(data.get("vehicle")),
      status: String(data.get("status")) as PartnerStatus,
      deliveries: 0,
      rating: null,
      joined: "Today",
    };
    setPartners((current) => [partner, ...current]);
    setModalOpen(false);
    setNotice(`${partner.name} added to demo partners.`);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function toggleAvailability(partnerId: number) {
    const partner = partners.find((item) => item.id === partnerId);
    if (!partner || !["Available", "Offline"].includes(partner.status)) return;
    const status = partner.status === "Available" ? "Offline" : "Available";
    setPartners((current) => current.map((item) => item.id === partnerId ? { ...item, status } : item));
    setNotice(`${partner.name} marked ${status.toLowerCase()}. Demo state only.`);
    window.setTimeout(() => setNotice(""), 3200);
  }

  const availableCount = partners.filter((partner) => partner.status === "Available").length;
  const onDeliveryCount = partners.filter((partner) => partner.status === "On delivery").length;
  const pendingCount = partners.filter((partner) => partner.status === "Pending review").length;
  const totalDeliveries = partners.reduce((sum, partner) => sum + partner.deliveries, 0);
  const filterCount = (filter: (typeof filters)[number]) => filter === "All partners" ? partners.length : partners.filter((partner) => partner.status === filter).length;

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Delivery partners" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Delivery partners" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px] flex items-center justify-between gap-[18px] max-[640px]:items-start max-[640px]:flex-col">
            <div><p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">LAST-MILE OPERATIONS</p><h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Delivery partners</h1><p className="m-0 text-[11px] text-[#818b85]">Manage your delivery team, availability and service areas.</p></div>
            <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e] max-[640px]:w-full max-[640px]:justify-center" type="button" onClick={() => setModalOpen(true)}><AdminIcon name="plus" size={17} />Add partner</button>
          </div>

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Delivery partner summary">
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#eaf2fb] text-[#4b81bc]"><AdminIcon name="customers" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Total partners</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{partners.length}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">In your demo roster</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#e9f5ed] text-[#22834c]"><AdminIcon name="check" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Available now</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{availableCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Ready for assignment</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#eaf2fb] text-[#4b81bc]"><AdminIcon name="delivery" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">On delivery</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{onDeliveryCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Currently fulfilling orders</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#fff2e6] text-[#d4873b]"><AdminIcon name="alert" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c] max-[640px]:text-[8px]">Pending review</span><strong className="text-xl font-bold max-[640px]:text-[17px]">{pendingCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">{totalDeliveries} completed demo deliveries</small></article>
          </section>

          {pendingCount > 0 && <section className="mb-[17px] flex items-center gap-2.5 rounded-lg border border-[#f3e6d5] bg-[#fffaf3] p-3" aria-label="Onboarding reminder"><span className="text-[#d4873b]"><AdminIcon name="alert" size={16} /></span><p className="m-0 flex flex-1 flex-col gap-1"><strong className="text-[9px] text-[#574632]">{pendingCount} partner{pendingCount === 1 ? "" : "s"} awaiting review</strong><small className="text-[8px] text-[#9a8871]">Review documents and verify onboarding before assigning orders.</small></p><span className="text-[8px] font-semibold text-[#a86b25]">Demo only</span></section>}

          <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
            <div className="flex gap-[15px] overflow-x-auto border-b border-[#edf0ee] px-[15px]" aria-label="Filter delivery partners">
              {filters.map((filter) => <button className={`relative inline-flex h-12 shrink-0 items-center gap-[7px] border-0 bg-transparent px-1 text-[9px] font-semibold ${activeFilter === filter ? "text-[#147744] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-[#18834b]" : "text-[#77827b]"}`} key={filter} type="button" onClick={() => setActiveFilter(filter)} aria-pressed={activeFilter === filter}>{filter}<span className={`rounded-full px-1.5 py-[3px] text-[8px] ${activeFilter === filter ? "bg-[#eaf5ee] text-[#26794a]" : "bg-[#f0f2f0] text-[#7f8982]"}`}>{filterCount(filter)}</span></button>)}
            </div>
            <div className="flex flex-wrap items-center gap-3 p-[15px] max-[640px]:gap-2 max-[640px]:p-3">
              <label className="flex h-9 w-[300px] max-w-full items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[#8c9790] focus-within:border-[#8bb99a] focus-within:ring-2 focus-within:ring-[#18834b]/10"><AdminIcon name="search" size={17} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#354139] outline-none placeholder:text-[#a0a9a3]" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone or delivery zone..." aria-label="Search delivery partners" /></label>
              <span className="ml-auto text-[8px] text-[#929c95] max-[640px]:ml-0">Showing {visiblePartners.length} of {partners.length} demo partners</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.5px] text-[#929c95]"><tr>{["PARTNER", "SERVICE AREA", "VEHICLE", "DELIVERIES", "RATING", "STATUS", "AVAILABILITY"].map((heading) => <th className="px-2.5 py-3 first:pl-[17px] last:pr-[17px]" key={heading}>{heading}</th>)}</tr></thead>
                <tbody>
                  {visiblePartners.map((partner) => <tr className="border-b border-[#f0f2f0] last:border-0" key={partner.id}>
                    <td className="px-2.5 py-[9px] pl-[17px]"><div className="flex min-w-[190px] items-center gap-[9px]"><span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[9px] font-bold text-[#4b81bc]">{partner.initials}</span><span className="flex flex-col gap-1"><strong className="text-[9px] font-bold text-[#354139]">{partner.name}</strong><small className="text-[8px] text-[#99a29c]">{partner.phone} · Joined {partner.joined}</small></span></div></td>
                    <td className="px-2.5 text-[9px] text-[#59655e]">{partner.zone}</td>
                    <td className="px-2.5 text-[9px] text-[#59655e]">{partner.vehicle}</td>
                    <td className="px-2.5 text-[9px] font-semibold text-[#4d5c52]">{partner.deliveries}</td>
                    <td className="px-2.5 text-[9px] text-[#59655e]">{partner.rating === null ? <span className="text-[#a4aca7]">New partner</span> : <span className="inline-flex items-center gap-1"><span className="text-[#dfa847]">★</span>{partner.rating.toFixed(1)}</span>}</td>
                    <td className="px-2.5"><span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${statusStyles(partner.status)}`}>{partner.status}</span></td>
                    <td className="px-2.5 pr-[17px]"><button className={`relative h-[22px] w-[38px] rounded-full transition ${partner.status === "Available" ? "bg-[#18834b]" : "bg-[#cbd3ce]"} disabled:cursor-not-allowed disabled:opacity-50`} type="button" onClick={() => toggleAvailability(partner.id)} disabled={!["Available", "Offline"].includes(partner.status)} aria-label={`Set ${partner.name} ${partner.status === "Available" ? "offline" : "available"}`} aria-pressed={partner.status === "Available"} title={partner.status === "On delivery" ? "Availability cannot be changed during an active delivery" : partner.status === "Pending review" ? "Approve onboarding before making this partner available" : "Toggle partner availability"}><span className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-all ${partner.status === "Available" ? "left-[19px]" : "left-[3px]"}`} /></button></td>
                  </tr>)}
                  {visiblePartners.length === 0 && <tr><td className="h-[210px] text-center" colSpan={7}><AdminIcon name="search" size={22} /><strong className="my-2 block text-[11px] text-[#39453e]">No partners found</strong><small className="text-[9px] text-[#89948d]">Try another search or choose a different status.</small><button className="mt-2 block w-full border-0 bg-transparent text-[9px] font-bold text-[#217847]" type="button" onClick={() => { setSearch(""); setActiveFilter("All partners"); }}>Clear filters</button></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">Demo partner roster · Changes persist in this browser&apos;s local storage, not a shared backend. Real onboarding and document verification will be added with the backend.</p>
        </div>
      </main>
      {notice && <div className="fixed bottom-5 right-5 z-40 rounded-lg bg-[#1d3325] px-4 py-3 text-[10px] font-semibold text-white shadow-lg max-[640px]:bottom-3 max-[640px]:left-3 max-[640px]:right-3" role="status">{notice}</div>}
      {modalOpen && <PartnerModal onClose={() => setModalOpen(false)} onSave={savePartner} />}
    </div>
  );
}
