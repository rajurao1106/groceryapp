"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { backendRequest } from "@/lib/backend-api";

export type PartnerStatus = "Available" | "On delivery" | "Offline" | "Pending review";

export type DeliveryPartner = {
  id: number;
  name: string;
  phone: string;
  initials: string;
  zone: string;
  vehicle: string;
  status: PartnerStatus;
  deliveries: number;
  rating: number | null;
  joined: string;
};

export type DeliveryPartnerInput = Omit<DeliveryPartner, "id">;

type DeliveryPartnersContextValue = {
  partners: DeliveryPartner[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  createPartner: (partner: DeliveryPartnerInput) => Promise<DeliveryPartner>;
  updatePartner: (partner: DeliveryPartner) => Promise<DeliveryPartner>;
  updatePartnerStatus: (id: number, status: PartnerStatus) => Promise<DeliveryPartner>;
  deletePartner: (id: number) => Promise<void>;
};

const DeliveryPartnersContext = createContext<DeliveryPartnersContextValue | null>(null);

export function DeliveryPartnersDemoProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const response = await backendRequest<{ partners: DeliveryPartner[] }>("/delivery-partners");
      setPartners(response.partners);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load delivery partners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload(); }, 0);
    const interval = window.setInterval(() => { void reload(); }, 30_000);
    window.addEventListener("focus", reload);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("focus", reload);
    };
  }, [reload]);

  const createPartner = useCallback(async (input: DeliveryPartnerInput) => {
    const { partner } = await backendRequest<{ partner: DeliveryPartner }>("/delivery-partners", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setPartners((current) => [partner, ...current]);
    return partner;
  }, []);

  const updatePartner = useCallback(async (partner: DeliveryPartner) => {
    const { partner: saved } = await backendRequest<{ partner: DeliveryPartner }>(`/delivery-partners/${partner.id}`, {
      method: "PUT",
      body: JSON.stringify(partner),
    });
    setPartners((current) => current.map((item) => item.id === saved.id ? saved : item));
    return saved;
  }, []);

  const updatePartnerStatus = useCallback(async (id: number, status: PartnerStatus) => {
    const { partner } = await backendRequest<{ partner: DeliveryPartner }>(`/delivery-partners/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setPartners((current) => current.map((item) => item.id === partner.id ? partner : item));
    return partner;
  }, []);

  const deletePartner = useCallback(async (id: number) => {
    await backendRequest<void>(`/delivery-partners/${id}`, { method: "DELETE" });
    setPartners((current) => current.filter((partner) => partner.id !== id));
  }, []);

  return (
    <DeliveryPartnersContext.Provider value={{ partners, loading, error, reload, createPartner, updatePartner, updatePartnerStatus, deletePartner }}>
      {children}
    </DeliveryPartnersContext.Provider>
  );
}

export function useDeliveryPartnersDemo() {
  const context = useContext(DeliveryPartnersContext);
  if (!context) throw new Error("useDeliveryPartnersDemo must be used inside DeliveryPartnersDemoProvider");
  return context;
}
