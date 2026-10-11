"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminIcon, AdminSidebar, AdminTopbar } from "@/components/admin-chrome";
import { backendRequest } from "@/lib/backend-api";

type StaffRole = "Owner" | "Store manager" | "Catalog manager" | "Order manager";
type StaffStatus = "Active" | "Invitation pending" | "Suspended";
type StaffMember = {
  id: number;
  name: string;
  email: string;
  initials: string;
  role: StaffRole;
  status: StaffStatus;
  lastActive: string;
};

const staffRoles: StaffRole[] = ["Owner", "Store manager", "Catalog manager", "Order manager"];
const filters = ["All staff", "Active", "Invitation pending", "Suspended"] as const;
const rolePermissions: { role: StaffRole; description: string; permissions: string[]; tone: string }[] = [
  { role: "Owner", description: "Full access to all store operations and team access.", permissions: ["All pages", "Manage staff", "Store settings"], tone: "bg-[#f0edfb] text-[#7761bc]" },
  { role: "Store manager", description: "Manage day-to-day store operations and fulfilment.", permissions: ["Orders", "Inventory", "Delivery partners"], tone: "bg-[#eaf2fb] text-[#4b81bc]" },
  { role: "Catalog manager", description: "Manage the product catalog and stock details.", permissions: ["Products", "Inventory", "Reports"], tone: "bg-[#e9f5ed] text-[#22834c]" },
  { role: "Order manager", description: "Process orders and coordinate customer delivery.", permissions: ["Orders", "Customers", "Delivery partners"], tone: "bg-[#fff2e6] text-[#c17a32]" },
];

function statusTone(status: StaffStatus) {
  if (status === "Active") return "bg-[#eaf6ed] text-[#32814c]";
  if (status === "Invitation pending") return "bg-[#fff3e5] text-[#c17a32]";
  return "bg-[#f1f3f1] text-[#7b8680]";
}

function roleTone(role: StaffRole) {
  return rolePermissions.find((entry) => entry.role === role)?.tone ?? "bg-[#f1f3f1] text-[#7b8680]";
}

function InviteModal({ member, onClose, onInvite }: {
  member: StaffMember | null;
  onClose: () => void;
  onInvite: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#142019]/45 p-5 max-[640px]:items-end max-[640px]:p-2" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="max-h-[calc(100vh-40px)] w-full max-w-[520px] overflow-y-auto rounded-[13px] border border-[#e9edea] bg-white shadow-[0_20px_70px_rgba(12,27,17,0.2)] max-[640px]:max-h-[calc(100vh-16px)]" role="dialog" aria-modal="true" aria-labelledby="invite-staff-title">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf0ee] px-[22px] py-5 max-[640px]:px-[15px]">
          <div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">TEAM DIRECTORY</p><h2 className="mb-1.5 mt-1.5 text-[19px] font-bold text-[#1b2820]" id="invite-staff-title">{member ? "Edit staff member" : "Add staff member"}</h2><p className="m-0 text-[10px] text-[#89948d]">{member ? "Update the saved staff directory record." : "Add a staff directory record."}</p></div>
          <button className="grid size-[31px] shrink-0 place-items-center rounded-md border border-[#edf0ee] bg-white text-[#79847d] hover:bg-[#f8faf8]" type="button" onClick={onClose} aria-label="Close dialog"><AdminIcon name="close" /></button>
        </div>
        <form className="px-[22px] pb-5 pt-[18px] max-[640px]:px-[15px]" onSubmit={onInvite}>
          <div className="grid grid-cols-2 gap-[13px] max-[480px]:grid-cols-1">
            <label className="col-span-2 flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057] max-[480px]:col-span-1">Full name *<input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="name" placeholder="e.g. Asha Patel" defaultValue={member?.name ?? ""} required autoFocus maxLength={120} /></label>
            <label className="col-span-2 flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057] max-[480px]:col-span-1">Work email *<input className="h-9 rounded-md border border-[#e4eae6] px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" name="email" type="email" placeholder="name@example.com" defaultValue={member?.email ?? ""} required maxLength={254} /></label>
            <label className="col-span-2 flex min-w-0 flex-col gap-1.5 text-[9px] font-semibold text-[#536057] max-[480px]:col-span-1">Role<select className="h-9 rounded-md border border-[#e4eae6] bg-white px-2.5 text-[10px] font-normal outline-none focus:border-[#8bb99a]" name="role" defaultValue={member?.role ?? "Order manager"}>{staffRoles.filter((role) => role !== "Owner").map((role) => <option key={role}>{role}</option>)}</select></label>
          </div>
          <p className="mt-3 rounded-md bg-[#f7f9f7] p-2.5 text-[8px] leading-[1.6] text-[#89948d]">No email will be sent and access is not enforced. Connect authentication and server-side role checks before using this for real staff.</p>
          <div className="mt-[17px] flex justify-end gap-2 border-t border-[#edf0ee] pt-[15px]">
            <button className="h-[38px] rounded-lg border border-[#e2e8e4] bg-white px-[13px] text-[10px] font-bold text-[#59655e]" type="button" onClick={onClose}>Cancel</button>
            <button className="h-[38px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e]" type="submit">{member ? "Save changes" : "Add staff member"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function StaffAccessPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All staff");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      const response = await backendRequest<{ staff: StaffMember[] }>("/staff");
      setStaff(response.staff);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStaff(); }, 0);
    const interval = window.setInterval(() => { void loadStaff(); }, 30_000);
    window.addEventListener("focus", loadStaff);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("focus", loadStaff);
    };
  }, [loadStaff]);

  const visibleStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch = !query || [member.name, member.email, member.role].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (activeFilter === "All staff" || member.status === activeFilter);
    });
  }, [activeFilter, search, staff]);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim().toLowerCase();
    const duplicate = !editingMember && staff.some((member) => member.email.toLowerCase() === email);
    if (duplicate) {
      notify("A staff member with this email already exists.");
      return;
    }
    const role = String(data.get("role")) as StaffRole;
    const input = {
      name,
      email,
      initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join(""),
      role,
      status: editingMember?.status ?? "Invitation pending" as StaffStatus,
      lastActive: editingMember?.lastActive ?? "Directory record created",
    };
    try {
      if (editingMember) {
        const { staffMember } = await backendRequest<{ staffMember: StaffMember }>(`/staff/${editingMember.id}`, { method: "PUT", body: JSON.stringify(input) });
        setStaff((current) => current.map((member) => member.id === staffMember.id ? staffMember : member));
      } else {
        const { staffMember } = await backendRequest<{ staffMember: StaffMember }>("/staff", { method: "POST", body: JSON.stringify(input) });
        setStaff((current) => [staffMember, ...current]);
      }
      setInviteOpen(false);
      setEditingMember(null);
      notify(editingMember ? `${name} updated.` : `${name} added to the staff directory. No email was sent.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save staff record.");
    }
  }

  function toggleSuspension(member: StaffMember) {
    if (member.role === "Owner") return;
    if (member.status === "Invitation pending") {
      void backendRequest<void>(`/staff/${member.id}`, { method: "DELETE" }).then(() => {
        setStaff((current) => current.filter((item) => item.id !== member.id));
        notify(`Invitation record for ${member.name} deleted.`);
      }).catch((deleteError: unknown) => setError(deleteError instanceof Error ? deleteError.message : "Unable to delete staff record."));
      return;
    }
    const status: StaffStatus = member.status === "Suspended" ? "Active" : "Suspended";
    void backendRequest<{ staffMember: StaffMember }>(`/staff/${member.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...member, status, lastActive: status === "Active" ? "Active just now" : "Access paused just now" }),
    }).then(({ staffMember }) => {
      setStaff((current) => current.map((item) => item.id === staffMember.id ? staffMember : item));
      notify(`${member.name}'s directory status marked ${status.toLowerCase()}.`);
    }).catch((updateError: unknown) => setError(updateError instanceof Error ? updateError.message : "Unable to update staff record."));
  }

  const activeCount = staff.filter((member) => member.status === "Active").length;
  const pendingCount = staff.filter((member) => member.status === "Invitation pending").length;
  const suspendedCount = staff.filter((member) => member.status === "Suspended").length;
  const countFor = (filter: (typeof filters)[number]) => filter === "All staff" ? staff.length : staff.filter((member) => member.status === filter).length;

  return (
    <div className="min-h-screen">
      <AdminSidebar activePage="Staff & Access" />
      <main className="min-h-screen sm:ml-[252px] max-[980px]:sm:ml-[72px] max-[640px]:ml-0">
        <AdminTopbar title="Staff & Access" />
        <div className="mx-auto w-full max-w-[1520px] px-[38px] py-8 max-[1200px]:px-[26px] max-[640px]:px-[15px] max-[640px]:py-6">
          <div className="mb-[23px] flex items-center justify-between gap-[18px] max-[640px]:items-start max-[640px]:flex-col">
            <div><p className="m-0 text-[9px] font-bold tracking-[1.05px] text-[#89948d]">TEAM MANAGEMENT</p><h1 className="mb-1.5 mt-2 text-[27px] font-bold tracking-[-0.9px] max-[640px]:text-[23px]">Staff &amp; Access</h1><p className="m-0 text-[11px] text-[#818b85]">Manage admin team members and their operational roles.</p></div>
            <button className="inline-flex h-[38px] items-center gap-[7px] rounded-lg bg-[#18834b] px-[13px] text-[10px] font-bold text-white hover:bg-[#116d3e] max-[640px]:w-full max-[640px]:justify-center" type="button" onClick={() => { setEditingMember(null); setInviteOpen(true); }}><AdminIcon name="plus" size={16} />Add staff</button>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#e9edea] bg-white px-3 py-2.5 text-[8px] leading-[1.5] text-[#89948d]"><AdminIcon name="alert" size={15} /><span>Staff directory records are saved to the backend. Invitations do not send email, and roles/statuses do not grant, restrict, or suspend authenticated access.</span></div>
          {error && <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700" role="alert"><span>{error}</span><button className="font-bold underline" type="button" onClick={() => void loadStaff()}>Retry</button></div>}

          <section className="mb-[17px] grid grid-cols-4 gap-[13px] max-[980px]:grid-cols-2 max-[640px]:gap-2" aria-label="Team summary">
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#eaf2fb] text-[#4b81bc]"><AdminIcon name="customers" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c]">Team members</span><strong className="text-xl font-bold">{staff.length}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Including store owner</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#e9f5ed] text-[#22834c]"><AdminIcon name="check" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c]">Active</span><strong className="text-xl font-bold">{activeCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Demo active accounts</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#fff2e6] text-[#d4873b]"><AdminIcon name="clock" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c]">Invitations</span><strong className="text-xl font-bold">{pendingCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Pending demo invites</small></article>
            <article className="grid min-h-[91px] grid-cols-[37px_1fr] grid-rows-2 content-center gap-x-[11px] rounded-[10px] border border-[#edf0ee] bg-white p-3.5 max-[640px]:min-h-[80px] max-[640px]:gap-x-2 max-[640px]:p-2.5"><span className="row-span-2 grid size-9 place-items-center self-center rounded-[9px] bg-[#f1f3f1] text-[#7b8680]"><AdminIcon name="settings" /></span><div className="flex items-baseline justify-between gap-2"><span className="text-[9px] text-[#78837c]">Suspended</span><strong className="text-xl font-bold">{suspendedCount}</strong></div><small className="self-end text-[8px] text-[#9aa39d]">Demo access paused</small></article>
          </section>

          <section className="mb-[17px] overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ee] px-[17px] py-3.5"><div><p className="m-0 text-[8px] font-bold tracking-[1px] text-[#89948d]">ROLE OVERVIEW</p><h2 className="mb-0 mt-1.5 text-[13px] font-bold text-[#334038]">Access by role</h2></div><span className="text-[8px] text-[#929c95]">Example permissions · not enforced</span></div>
            <div className="grid grid-cols-4 gap-2.5 p-[15px] max-[1000px]:grid-cols-2 max-[520px]:grid-cols-1">
              {rolePermissions.map((entry) => <article className="rounded-lg border border-[#edf0ee] p-3" key={entry.role}><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${entry.tone}`}>{entry.role}</span><strong className="text-[10px] text-[#354139]">{staff.filter((member) => member.role === entry.role).length}</strong></div><p className="mb-2 mt-2.5 min-h-[28px] text-[8px] leading-[1.5] text-[#89948d]">{entry.description}</p><div className="flex flex-wrap gap-1">{entry.permissions.map((permission) => <span className="rounded bg-[#f4f6f4] px-1.5 py-1 text-[7px] text-[#69756e]" key={permission}>{permission}</span>)}</div></article>)}
            </div>
          </section>

          <section className="overflow-hidden rounded-[11px] border border-[#edf0ee] bg-white shadow-[0_2px_7px_rgba(27,42,33,0.02)]">
            <div className="flex gap-[13px] overflow-x-auto border-b border-[#edf0ee] px-[15px]" aria-label="Filter staff">
              {filters.map((filter) => <button className={`relative inline-flex h-12 shrink-0 items-center gap-[7px] border-0 bg-transparent px-1 text-[9px] font-semibold ${activeFilter === filter ? "text-[#147744] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-[#18834b]" : "text-[#77827b]"}`} key={filter} type="button" onClick={() => setActiveFilter(filter)} aria-pressed={activeFilter === filter}>{filter}<span className={`rounded-full px-1.5 py-[3px] text-[8px] ${activeFilter === filter ? "bg-[#eaf5ee] text-[#26794a]" : "bg-[#f0f2f0] text-[#7f8982]"}`}>{countFor(filter)}</span></button>)}
            </div>
            <div className="flex flex-wrap items-center gap-3 p-[15px] max-[640px]:gap-2 max-[640px]:p-3">
              <label className="flex h-9 w-[330px] max-w-full items-center gap-2 rounded-md border border-[#e8ece9] px-[9px] text-[#8c9790] focus-within:border-[#8bb99a] focus-within:ring-2 focus-within:ring-[#18834b]/10"><AdminIcon name="search" size={17} /><input className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#354139] outline-none placeholder:text-[#a0a9a3]" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or role..." aria-label="Search staff" /></label>
              <span className="ml-auto text-[8px] text-[#929c95] max-[640px]:ml-0">Showing {visibleStaff.length} of {staff.length} demo members</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead className="bg-[#f8f9f8] text-[8px] font-bold tracking-[0.5px] text-[#929c95]"><tr>{["TEAM MEMBER", "ROLE", "STATUS", "LAST ACTIVE", "ACCESS CONTROL"].map((heading) => <th className="px-2.5 py-3 first:pl-[17px] last:pr-[17px]" key={heading}>{heading}</th>)}</tr></thead>
                <tbody>
                  {visibleStaff.map((member) => <tr className="border-b border-[#f0f2f0] last:border-0" key={member.id}>
                    <td className="px-2.5 py-[9px] pl-[17px]"><div className="flex min-w-[220px] items-center gap-[9px]"><span className="grid size-[36px] shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[9px] font-bold text-[#4b81bc]">{member.initials}</span><span className="flex flex-col gap-1"><strong className="text-[9px] font-bold text-[#354139]">{member.name}{member.role === "Owner" && <span className="ml-1.5 rounded bg-[#f1effa] px-1 py-0.5 text-[7px] font-semibold text-[#7664ae]">YOU</span>}</strong><small className="text-[8px] text-[#99a29c]">{member.email}</small></span></div></td>
                    <td className="px-2.5"><span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${roleTone(member.role)}`}>{member.role}</span></td>
                    <td className="px-2.5"><span className={`inline-flex whitespace-nowrap rounded-full px-[7px] py-[5px] text-[8px] font-semibold ${statusTone(member.status)}`}>{member.status}</span></td>
                    <td className="whitespace-nowrap px-2.5 text-[8px] text-[#89948d]">{member.lastActive}</td>
                    <td className="px-2.5 pr-[17px]">{member.role === "Owner" ? <span className="text-[8px] text-[#a0a9a3]">Primary owner</span> : <div className="flex gap-1"><button className="h-[29px] rounded-md border border-[#e5ebe7] px-2 text-[8px] font-bold text-[#217847]" type="button" onClick={() => { setEditingMember(member); setInviteOpen(true); }}>Edit</button><button className={`h-[29px] rounded-md border px-2 text-[8px] font-bold ${member.status === "Suspended" ? "border-[#dcebe1] bg-[#f4f9f5] text-[#217847]" : "border-[#f0d8d4] bg-white text-[#bf5c50]"}`} type="button" onClick={() => toggleSuspension(member)}>{member.status === "Suspended" ? "Restore" : member.status === "Invitation pending" ? "Delete invite" : "Suspend"}</button><button className="h-[29px] rounded-md border border-[#f0d8d4] px-2 text-[8px] font-bold text-[#bf5c50]" type="button" onClick={() => { if (!window.confirm(`Delete ${member.name} from the directory?`)) return; void backendRequest<void>(`/staff/${member.id}`, { method: "DELETE" }).then(() => { setStaff((current) => current.filter((item) => item.id !== member.id)); notify("Staff record deleted."); }).catch((deleteError: unknown) => setError(deleteError instanceof Error ? deleteError.message : "Unable to delete staff record.")); }}>Delete</button></div>}</td>
                  </tr>)}
                  {loading && <tr><td className="h-[70px] text-center text-[9px] text-[#89948d]" colSpan={5}>Loading staff…</td></tr>}
                  {visibleStaff.length === 0 && <tr><td className="h-[190px] text-center" colSpan={5}><AdminIcon name="search" size={22} /><strong className="my-2 block text-[11px] text-[#39453e]">No staff found</strong><small className="text-[9px] text-[#89948d]">Try another search or status filter.</small><button className="mt-2 block w-full border-0 bg-transparent text-[9px] font-bold text-[#217847]" type="button" onClick={() => { setSearch(""); setActiveFilter("All staff"); }}>Clear filters</button></td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <p className="ml-px mt-3 text-[9px] text-[#9ca69f]">This is a staff directory, not staff authentication or authorization.</p>
        </div>
      </main>
      {notice && <div className="fixed bottom-5 right-5 z-40 rounded-lg bg-[#1d3325] px-4 py-3 text-[10px] font-semibold text-white shadow-lg max-[640px]:bottom-3 max-[640px]:left-3 max-[640px]:right-3" role="status">{notice}</div>}
      {inviteOpen && <InviteModal member={editingMember} onClose={() => { setInviteOpen(false); setEditingMember(null); }} onInvite={createInvitation} />}
    </div>
  );
}
