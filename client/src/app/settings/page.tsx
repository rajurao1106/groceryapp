"use client";

import { useState, type FormEvent } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";

const initialStore = {
  name: "Greenmart Grocery",
  phone: "+91 98765 00000",
  email: "hello@greenmart.example",
  address: "12, 100 Feet Road, Indiranagar, Bengaluru, Karnataka",
  openingHours: "7:00 AM – 11:00 PM",
};

function Toggle({ checked, onChange, label }: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18834b]/30 disabled:cursor-not-allowed" type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}>
      <span className={`absolute inset-0 rounded-full transition-colors ${checked ? "bg-[#18834b]" : "bg-[#cbd3ce]"}`} />
      <span className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-all ${checked ? "left-[19px]" : "left-[3px]"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [store, setStore] = useLocalStorageState("greenmart:demo:settings:store:v1", initialStore);
  const [deliveryRadius, setDeliveryRadius] = useLocalStorageState("greenmart:demo:settings:delivery-radius:v1", "5");
  const [minimumOrder, setMinimumOrder] = useLocalStorageState("greenmart:demo:settings:minimum-order:v1", "99");
  const [prepTime, setPrepTime] = useLocalStorageState("greenmart:demo:settings:prep-time:v1", "15");
  const [acceptOrders, setAcceptOrders] = useLocalStorageState("greenmart:demo:settings:accept-orders:v1", true);
  const [autoAssign, setAutoAssign] = useLocalStorageState("greenmart:demo:settings:auto-assign:v1", false);
  const [newOrderAlerts, setNewOrderAlerts] = useLocalStorageState("greenmart:demo:settings:new-order-alerts:v1", true);
  const [lowStockAlerts, setLowStockAlerts] = useLocalStorageState("greenmart:demo:settings:low-stock-alerts:v1", true);
  const [dailySummary, setDailySummary] = useLocalStorageState("greenmart:demo:settings:daily-summary:v1", false);
  const [notice, setNotice] = useState("");

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStore({
      name: String(data.get("storeName")).trim(),
      phone: String(data.get("phone")).trim(),
      email: String(data.get("email")).trim(),
      address: String(data.get("address")).trim(),
      openingHours: String(data.get("openingHours")).trim(),
    });
    setNotice("Settings saved in this browser's local storage.");
    window.setTimeout(() => setNotice(""), 3200);
  }

  const inputClass = "mt-1.5 h-9 w-full rounded-md border border-[#e4eae6] bg-white px-2.5 text-[10px] font-normal text-[#354139] outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10";
  const labelClass = "flex min-w-0 flex-col text-[9px] font-semibold text-[#536057]";

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Settings" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Settings" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px]">
            <p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">STORE CONFIGURATION</p>
            <h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Settings</h1>
            <p className="m-0 text-[11px] text-[#818b85]">Manage your store profile, order preferences and admin notifications.</p>
          </div>
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#e9edea] bg-white px-3 py-2.5 text-[8px] leading-[1.5] text-[#89948d]"><AdminIcon name="alert" size={15} /><span>Settings persist in this browser&apos;s local storage. Saving does not update the storefront or backend, and these values are not shared with other devices.</span></div>

          <form className="space-y-4" onSubmit={saveSettings}>
            <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="flex items-center gap-2.5 border-b border-[#edf0ee] px-[17px] py-3.5">
                <span className="grid size-8 place-items-center rounded-lg bg-[#eaf5ee] text-[#22834c]"><AdminIcon name="dashboard" size={16} /></span>
                <div><h2 className="m-0 text-[11px] font-bold text-[#334038]">Store profile</h2><p className="mb-0 mt-1 text-[8px] text-[#89948d]">Business information shown to customers.</p></div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-[17px] max-[600px]:grid-cols-1 max-[600px]:p-3.5">
                <label className={labelClass}>Store name<input className={inputClass} name="storeName" defaultValue={store.name} required maxLength={80} /></label>
                <label className={labelClass}>Contact phone<input className={inputClass} name="phone" type="tel" defaultValue={store.phone} required pattern="[+]?[0-9 ()-]{10,18}" /></label>
                <label className={labelClass}>Support email<input className={inputClass} name="email" type="email" defaultValue={store.email} required /></label>
                <label className={labelClass}>Opening hours<input className={inputClass} name="openingHours" defaultValue={store.openingHours} required maxLength={80} /></label>
                <label className={`${labelClass} col-span-2 max-[600px]:col-span-1`}>Store address<input className={inputClass} name="address" defaultValue={store.address} required maxLength={180} /></label>
              </div>
            </section>

            <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="flex items-center gap-2.5 border-b border-[#edf0ee] px-[17px] py-3.5">
                <span className="grid size-8 place-items-center rounded-lg bg-[#eaf2fb] text-[#4b81bc]"><AdminIcon name="delivery" size={16} /></span>
                <div><h2 className="m-0 text-[11px] font-bold text-[#334038]">Orders &amp; delivery</h2><p className="mb-0 mt-1 text-[8px] text-[#89948d]">Demo defaults for accepting and fulfilling orders.</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3.5 p-[17px] max-[760px]:grid-cols-2 max-[600px]:grid-cols-1 max-[600px]:p-3.5">
                <label className={labelClass}>Delivery radius<select className={inputClass} value={deliveryRadius} onChange={(event) => setDeliveryRadius(event.target.value)}><option value="2">Up to 2 km</option><option value="5">Up to 5 km</option><option value="8">Up to 8 km</option><option value="10">Up to 10 km</option></select></label>
                <label className={labelClass}>Minimum order value<input className={inputClass} type="number" min="0" step="1" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} /></label>
                <label className={labelClass}>Preparation time<select className={inputClass} value={prepTime} onChange={(event) => setPrepTime(event.target.value)}><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option></select></label>
              </div>
              <div className="divide-y divide-[#f0f2f0] border-t border-[#edf0ee]">
                <div className="flex items-center justify-between gap-4 px-[17px] py-3.5 max-[640px]:px-3.5"><span><strong className="block text-[9px] font-semibold text-[#39453e]">Accept new orders</strong><small className="mt-1 block text-[8px] text-[#89948d]">Pause incoming orders when the store is closed or busy.</small></span><Toggle checked={acceptOrders} onChange={() => setAcceptOrders((value) => !value)} label="Accept new orders" /></div>
                <div className="flex items-center justify-between gap-4 px-[17px] py-3.5 max-[640px]:px-3.5"><span><strong className="block text-[9px] font-semibold text-[#39453e]">Auto-assign delivery partners</strong><small className="mt-1 block text-[8px] text-[#89948d]">Assignment rules require a connected delivery service.</small></span><Toggle checked={autoAssign} onChange={() => setAutoAssign((value) => !value)} label="Auto-assign delivery partners" /></div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
              <div className="flex items-center gap-2.5 border-b border-[#edf0ee] px-[17px] py-3.5">
                <span className="grid size-8 place-items-center rounded-lg bg-[#fff2e6] text-[#d4873b]"><AdminIcon name="bell" size={16} /></span>
                <div><h2 className="m-0 text-[11px] font-bold text-[#334038]">Notifications</h2><p className="mb-0 mt-1 text-[8px] text-[#89948d]">Choose which admin alerts you want to receive.</p></div>
              </div>
              <div className="divide-y divide-[#f0f2f0]">
                <div className="flex items-center justify-between gap-4 px-[17px] py-3.5 max-[640px]:px-3.5"><span><strong className="block text-[9px] font-semibold text-[#39453e]">New order alerts</strong><small className="mt-1 block text-[8px] text-[#89948d]">Notify when a customer places an order.</small></span><Toggle checked={newOrderAlerts} onChange={() => setNewOrderAlerts((value) => !value)} label="New order alerts" /></div>
                <div className="flex items-center justify-between gap-4 px-[17px] py-3.5 max-[640px]:px-3.5"><span><strong className="block text-[9px] font-semibold text-[#39453e]">Low-stock alerts</strong><small className="mt-1 block text-[8px] text-[#89948d]">Notify when a product reaches its low-stock threshold.</small></span><Toggle checked={lowStockAlerts} onChange={() => setLowStockAlerts((value) => !value)} label="Low-stock alerts" /></div>
                <div className="flex items-center justify-between gap-4 px-[17px] py-3.5 max-[640px]:px-3.5"><span><strong className="block text-[9px] font-semibold text-[#39453e]">Daily summary</strong><small className="mt-1 block text-[8px] text-[#89948d]">Send a demo end-of-day orders and sales summary.</small></span><Toggle checked={dailySummary} onChange={() => setDailySummary((value) => !value)} label="Daily summary" /></div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-2 pb-2">
              <button className="h-[38px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[10px] font-bold text-[#59655e]" type="reset" onClick={() => {
                setStore(initialStore);
                setDeliveryRadius("5");
                setMinimumOrder("99");
                setPrepTime("15");
                setAcceptOrders(true);
                setAutoAssign(false);
                setNewOrderAlerts(true);
                setLowStockAlerts(true);
                setDailySummary(false);
              }}>Reset</button>
              <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e]" type="submit"><AdminIcon name="check" size={15} />Save settings</button>
            </div>
          </form>
        </div>
      </main>
      {notice && <div className="fixed bottom-5 right-5 z-40 rounded-lg bg-[#1d3325] px-4 py-3 text-[10px] font-semibold text-white shadow-lg max-[640px]:bottom-3 max-[640px]:left-3 max-[640px]:right-3" role="status">{notice}</div>}
    </div>
  );
}
