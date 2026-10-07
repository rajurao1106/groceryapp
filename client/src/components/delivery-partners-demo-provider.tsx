"use client";

import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";

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

export const initialPartners: DeliveryPartner[] = [
  { id: 1, name: "Arjun Singh", phone: "+91 98765 10234", initials: "AS", zone: "Indiranagar", vehicle: "Motorcycle", status: "On delivery", deliveries: 248, rating: 4.9, joined: "12 Aug 2026" },
  { id: 2, name: "Ravi Verma", phone: "+91 98234 56710", initials: "RV", zone: "Koramangala", vehicle: "Motorcycle", status: "Available", deliveries: 196, rating: 4.8, joined: "18 Aug 2026" },
  { id: 3, name: "Neha Kumari", phone: "+91 99001 22881", initials: "NK", zone: "HSR Layout", vehicle: "Scooter", status: "On delivery", deliveries: 172, rating: 4.9, joined: "24 Aug 2026" },
  { id: 4, name: "Karan Mehta", phone: "+91 98450 33442", initials: "KM", zone: "Whitefield", vehicle: "Motorcycle", status: "Offline", deliveries: 121, rating: 4.7, joined: "02 Sep 2026" },
  { id: 5, name: "Pooja Nair", phone: "+91 98123 76009", initials: "PN", zone: "Jayanagar", vehicle: "Bicycle", status: "Pending review", deliveries: 0, rating: null, joined: "Today" },
];

type DeliveryPartnersContextValue = {
  partners: DeliveryPartner[];
  setPartners: Dispatch<SetStateAction<DeliveryPartner[]>>;
};

const DeliveryPartnersContext = createContext<DeliveryPartnersContextValue | null>(null);

export function DeliveryPartnersDemoProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useLocalStorageState("greenmart:demo:delivery-partners:v1", initialPartners);

  return (
    <DeliveryPartnersContext.Provider value={{ partners, setPartners }}>
      {children}
    </DeliveryPartnersContext.Provider>
  );
}

export function useDeliveryPartnersDemo() {
  const context = useContext(DeliveryPartnersContext);
  if (!context) {
    throw new Error("useDeliveryPartnersDemo must be used inside DeliveryPartnersDemoProvider");
  }
  return context;
}
