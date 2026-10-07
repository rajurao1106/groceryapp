import Link from "next/link";
import { AdminLoginGate } from "@/components/admin-login-gate";

export default function AdminLoginPage() {
  return (
    <AdminLoginGate>
      <main className="grid min-h-[calc(100vh-45px)] place-items-center bg-[#f7f8fa] px-5 py-10">
        <section className="w-full max-w-[420px] rounded-2xl border border-[#e9edea] bg-white p-7 text-center shadow-[0_12px_40px_rgba(12,27,17,0.08)]">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-[#e8f5ed] text-[#17834b]">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
          <p className="mb-2 text-[9px] font-bold tracking-[1px] text-[#89948d]">ADMIN CONSOLE</p>
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.5px] text-[#1b2820]">You are signed in</h1>
          <p className="mb-5 mt-2 text-[12px] leading-5 text-[#78837c]">Your administrator account is ready to manage the product catalog.</p>
          <Link className="inline-flex h-10 items-center justify-center rounded-lg bg-[#18834b] px-5 text-[11px] font-bold text-white no-underline hover:bg-[#116d3e]" href="/products">
            Open product catalog
          </Link>
        </section>
      </main>
    </AdminLoginGate>
  );
}
