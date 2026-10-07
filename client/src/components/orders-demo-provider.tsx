"use client";

import { createContext, useContext, useEffect, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useDeliveryPartnersDemo, type PartnerStatus } from "@/components/delivery-partners-demo-provider";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Packed"
  | "Assigned"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled";

export type OrderItem = {
  name: string;
  packSize: string;
  quantity: number;
  price: number;
  image: string;
};

export type DemoOrder = {
  id: string;
  customer: string;
  initials: string;
  avatar: string;
  phone: string;
  address: string;
  time: string;
  minutesAgo: number;
  amount: number;
  itemCount: number;
  status: OrderStatus;
  paymentMethod: "UPI" | "Card" | "Cash on delivery";
  paymentStatus: "Paid" | "Pending" | "Refunded";
  deliveryPartner: string | null;
  items: OrderItem[];
};

const initialOrders: DemoOrder[] = [
  {
    id: "#GM-1048", customer: "Aarav Sharma", initials: "AS", avatar: "lavender",
    phone: "+91 98765 43210", address: "Flat 204, Lake View Residency, Indiranagar",
    time: "10:42 AM", minutesAgo: 5, amount: 486, itemCount: 5, status: "Preparing",
    paymentMethod: "UPI", paymentStatus: "Paid", deliveryPartner: null,
    items: [
      { name: "Alphonso Mango", packSize: "1 kg", quantity: 1, price: 249, image: "🥭" },
      { name: "Amul Taaza Milk", packSize: "500 ml", quantity: 2, price: 28, image: "🥛" },
      { name: "India Gate Basmati Rice", packSize: "1 kg", quantity: 1, price: 139, image: "🍚" },
      { name: "Whole Wheat Bread", packSize: "400 g", quantity: 1, price: 42, image: "🍞" },
    ],
  },
  {
    id: "#GM-1047", customer: "Diya Patel", initials: "DP", avatar: "peach",
    phone: "+91 98234 56781", address: "12B, Green Park Apartments, Koramangala",
    time: "10:36 AM", minutesAgo: 11, amount: 701, itemCount: 5, status: "Out for delivery",
    paymentMethod: "UPI", paymentStatus: "Paid", deliveryPartner: "Arjun Singh",
    items: [
      { name: "Farm Fresh Eggs", packSize: "6 pcs", quantity: 2, price: 62, image: "🥚" },
      { name: "Alphonso Mango", packSize: "1 kg", quantity: 2, price: 249, image: "🥭" },
      { name: "Sweet Lime", packSize: "1 kg", quantity: 1, price: 79, image: "🍋" },
    ],
  },
  {
    id: "#GM-1046", customer: "Kabir Verma", initials: "KV", avatar: "mint",
    phone: "+91 99001 22334", address: "5th Cross, HSR Layout, Sector 2",
    time: "10:28 AM", minutesAgo: 19, amount: 142, itemCount: 5, status: "Delivered",
    paymentMethod: "Card", paymentStatus: "Paid", deliveryPartner: "Ravi Verma",
    items: [
      { name: "Organic Spinach", packSize: "250 g", quantity: 2, price: 35, image: "🥬" },
      { name: "Cucumber", packSize: "500 g", quantity: 3, price: 24, image: "🥒" },
    ],
  },
  {
    id: "#GM-1045", customer: "Meera Iyer", initials: "MI", avatar: "blue",
    phone: "+91 98450 45678", address: "301, Sunshine Towers, Whitefield",
    time: "10:15 AM", minutesAgo: 32, amount: 390, itemCount: 6, status: "Pending",
    paymentMethod: "Cash on delivery", paymentStatus: "Pending", deliveryPartner: null,
    items: [
      { name: "India Gate Basmati Rice", packSize: "1 kg", quantity: 2, price: 139, image: "🍚" },
      { name: "Amul Taaza Milk", packSize: "500 ml", quantity: 4, price: 28, image: "🥛" },
    ],
  },
  {
    id: "#GM-1044", customer: "Ishaan Rao", initials: "IR", avatar: "yellow",
    phone: "+91 98123 45678", address: "18, Palm Meadows, Marathahalli",
    time: "10:02 AM", minutesAgo: 45, amount: 242, itemCount: 4, status: "Packed",
    paymentMethod: "UPI", paymentStatus: "Paid", deliveryPartner: null,
    items: [
      { name: "Whole Wheat Bread", packSize: "400 g", quantity: 2, price: 42, image: "🍞" },
      { name: "Sweet Lime", packSize: "1 kg", quantity: 2, price: 79, image: "🍋" },
    ],
  },
  {
    id: "#GM-1043", customer: "Ananya Das", initials: "AD", avatar: "rose",
    phone: "+91 98876 54321", address: "7, Orchid Enclave, Bellandur",
    time: "9:54 AM", minutesAgo: 53, amount: 1182, itemCount: 7, status: "Assigned",
    paymentMethod: "Card", paymentStatus: "Paid", deliveryPartner: "Neha Kumari",
    items: [
      { name: "Farm Fresh Eggs", packSize: "6 pcs", quantity: 3, price: 62, image: "🥚" },
      { name: "Alphonso Mango", packSize: "1 kg", quantity: 4, price: 249, image: "🥭" },
    ],
  },
  {
    id: "#GM-1042", customer: "Vikram Joshi", initials: "VJ", avatar: "mint",
    phone: "+91 98451 11223", address: "22, Silver Oak Street, Jayanagar",
    time: "9:41 AM", minutesAgo: 66, amount: 160, itemCount: 6, status: "Cancelled",
    paymentMethod: "UPI", paymentStatus: "Refunded", deliveryPartner: null,
    items: [
      { name: "Amul Taaza Milk", packSize: "500 ml", quantity: 4, price: 28, image: "🥛" },
      { name: "Cucumber", packSize: "500 g", quantity: 2, price: 24, image: "🥒" },
    ],
  },
];

type OrdersDemoContextValue = {
  orders: DemoOrder[];
  setOrders: Dispatch<SetStateAction<DemoOrder[]>>;
};

const OrdersDemoContext = createContext<OrdersDemoContextValue | null>(null);

export function OrdersDemoProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useLocalStorageState("greenmart:demo:orders:v1", initialOrders);
  const { setPartners } = useDeliveryPartnersDemo();

  useEffect(() => {
    setOrders((current) => {
      let changed = false;
      const reconciled = current.map((order) => {
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const amount = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        if (order.itemCount === itemCount && order.amount === amount) return order;
        changed = true;
        return { ...order, itemCount, amount };
      });
      return changed ? reconciled : current;
    });
  }, [setOrders]);

  useEffect(() => {
    const activeAssignments = new Set(
      orders
        .filter((order) => ["Assigned", "Out for delivery"].includes(order.status) && order.deliveryPartner)
        .map((order) => order.deliveryPartner)
    );
    setPartners((current) => {
      let changed = false;
      const reconciled = current.map((partner) => {
        const status: PartnerStatus = activeAssignments.has(partner.name)
          ? "On delivery"
          : partner.status === "On delivery" ? "Available" : partner.status;
        if (partner.status === status) return partner;
        changed = true;
        return { ...partner, status };
      });
      return changed ? reconciled : current;
    });
  }, [orders, setPartners]);

  return (
    <OrdersDemoContext.Provider value={{ orders, setOrders }}>
      {children}
    </OrdersDemoContext.Provider>
  );
}

export function useOrdersDemo() {
  const context = useContext(OrdersDemoContext);
  if (!context) {
    throw new Error("useOrdersDemo must be used inside OrdersDemoProvider");
  }
  return context;
}
