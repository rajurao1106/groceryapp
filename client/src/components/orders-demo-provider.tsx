"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { backendRequest } from "@/lib/backend-api";

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
  customerId?: number | null;
  deliveryPartnerId?: number | null;
};

export type OrderInput = Omit<DemoOrder, "id" | "amount" | "itemCount" | "customerId" | "deliveryPartnerId"> & {
  id?: string;
  amount?: number;
  itemCount?: number;
  customerId?: number | null;
  deliveryPartnerId?: number | null;
};

type OrdersContextValue = {
  orders: DemoOrder[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  createOrder: (input: OrderInput) => Promise<DemoOrder>;
  updateOrder: (order: DemoOrder) => Promise<DemoOrder>;
  updateOrderStatus: (id: string, status: OrderStatus, deliveryPartnerId?: number | null) => Promise<DemoOrder>;
  updateOrderPayment: (id: string, paymentStatus: DemoOrder["paymentStatus"]) => Promise<DemoOrder>;
  deleteOrder: (id: string) => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersDemoProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const response = await backendRequest<{ orders: DemoOrder[] }>("/orders");
      setOrders(response.orders);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
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

  const createOrder = useCallback(async (input: OrderInput) => {
    const { order } = await backendRequest<{ order: DemoOrder }>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setOrders((current) => [order, ...current]);
    return order;
  }, []);

  const updateOrder = useCallback(async (order: DemoOrder) => {
    const input = {
      id: order.id,
      customerId: order.customerId,
      deliveryPartnerId: order.deliveryPartnerId,
      customer: order.customer,
      initials: order.initials,
      avatar: order.avatar,
      phone: order.phone,
      address: order.address,
      time: order.time,
      minutesAgo: order.minutesAgo,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryPartner: order.deliveryPartner,
      items: order.items,
    };
    const { order: saved } = await backendRequest<{ order: DemoOrder }>(`/orders/${encodeURIComponent(order.id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    setOrders((current) => current.map((item) => item.id === saved.id ? saved : item));
    return saved;
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus, deliveryPartnerId?: number | null) => {
    const { order } = await backendRequest<{ order: DemoOrder }>(`/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...(deliveryPartnerId === undefined ? {} : { deliveryPartnerId }) }),
    });
    setOrders((current) => current.map((item) => item.id === order.id ? order : item));
    return order;
  }, []);

  const updateOrderPayment = useCallback(async (id: string, paymentStatus: DemoOrder["paymentStatus"]) => {
    const { order } = await backendRequest<{ order: DemoOrder }>(`/orders/${encodeURIComponent(id)}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus }),
    });
    setOrders((current) => current.map((item) => item.id === order.id ? order : item));
    return order;
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    await backendRequest<void>(`/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
    setOrders((current) => current.filter((order) => order.id !== id));
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, loading, error, reload, createOrder, updateOrder, updateOrderStatus, updateOrderPayment, deleteOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrdersDemo() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrdersDemo must be used inside OrdersDemoProvider");
  return context;
}
