"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiBaseUrl } from "@/lib/backend-api";

type AuthStatus = "checking" | "signed-out" | "admin";

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error ?? `Request failed (${response.status}).`;
}

export function AdminLoginGate({ children, onSessionChange }: {
  children: ReactNode;
  onSessionChange?: () => Promise<void>;
}) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`${apiBaseUrl}/admin/session`, {
      credentials: "include",
      cache: "no-store",
    }).then(async (response) => {
      if (response.status === 401) {
        if (active) setStatus("signed-out");
        return;
      }
      if (!response.ok) throw new Error(await readError(response));
      const session = await response.json() as { username: string };
      if (active) {
        setAdminName(session.username);
        setStatus("admin");
        await onSessionChange?.();
      }
    }).catch((cause: unknown) => {
      if (active) {
        setStatus("signed-out");
        setError(cause instanceof Error ? cause.message : "Unable to check admin session.");
      }
    });
    return () => {
      active = false;
    };
  }, [onSessionChange]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const session = await response.json() as { username: string };
      setAdminName(session.username);
      setPassword("");
      setStatus("admin");
      await onSessionChange?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin sign-in failed.");
    } finally {
      setWorking(false);
    }
  }

  async function handleSignOut() {
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/admin/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await readError(response));
      setStatus("signed-out");
      setAdminName("");
      setUsername("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign out.");
    } finally {
      setWorking(false);
    }
  }

  if (status === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5">
        <p className="text-sm text-[#78837c]" role="status">Checking admin session...</p>
      </main>
    );
  }

  if (status === "admin") {
    return (
      <>
        <div className="flex items-center justify-end gap-3 border-b border-[#e9edea] bg-white px-5 py-2 text-[10px] text-[#59655e]">
          <span>Administrator: <strong className="text-[#354139]">{adminName}</strong></span>
          <button className="rounded-md border border-[#e2e8e4] bg-white px-3 py-1.5 font-semibold hover:bg-[#f8faf8] disabled:opacity-60" type="button" onClick={() => void handleSignOut()} disabled={working}>
            {working ? "Signing out..." : "Sign out"}
          </button>
          {error && <span className="text-[#bd554b]" role="alert">{error}</span>}
        </div>
        {children}
      </>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-5 py-10">
      <section className="w-full max-w-[420px] rounded-2xl border border-[#e9edea] bg-white p-7 shadow-[0_12px_40px_rgba(12,27,17,0.08)] max-[480px]:p-5" aria-labelledby="admin-login-title">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#e8f5ed] text-xl font-bold text-[#17834b]" aria-hidden="true">G</span>
          <span>
            <strong className="block text-lg font-bold tracking-[-0.5px] text-[#17211d]">greenmart</strong>
            <small className="text-[9px] font-bold tracking-[1.25px] text-[#8c9690]">ADMIN CONSOLE</small>
          </span>
        </div>
        <p className="mb-2 text-[9px] font-bold tracking-[1px] text-[#89948d]">SECURE ADMIN ACCESS</p>
        <h1 className="m-0 text-[24px] font-bold tracking-[-0.7px] text-[#1b2820]" id="admin-login-title">Admin sign in</h1>
        <p className="mb-5 mt-2 text-[12px] leading-5 text-[#78837c]">Sign in with your admin username and password to manage products.</p>

        <form className="flex flex-col gap-3" onSubmit={(event) => void handleSignIn(event)}>
          <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-[#536057]">
            Username
            <input className="h-10 rounded-lg border border-[#e4eae6] px-3 text-[12px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5 text-[10px] font-semibold text-[#536057]">
            Password
            <input className="h-10 rounded-lg border border-[#e4eae6] px-3 text-[12px] font-normal outline-none focus:border-[#8bb99a] focus:ring-2 focus:ring-[#18834b]/10" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="mt-1 h-10 rounded-lg bg-[#18834b] px-4 text-[11px] font-bold text-white hover:bg-[#116d3e] disabled:opacity-60" type="submit" disabled={working}>
            {working ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error && <p className="mb-0 mt-3 rounded-lg bg-[#fff1ef] p-3 text-[11px] leading-5 text-[#bd554b]" role="alert">{error}</p>}
      </section>
    </main>
  );
}
