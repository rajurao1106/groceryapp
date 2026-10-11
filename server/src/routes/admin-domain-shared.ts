import { z } from "zod";
import type { OrderItemSnapshot } from "../db/schema.js";

export const orderStatuses = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Packed",
  "Assigned",
  "Out for delivery",
  "Delivered",
  "Cancelled",
] as const;

export const paymentStatuses = ["Paid", "Pending", "Refunded"] as const;
export const paymentMethods = ["UPI", "Card", "Cash on delivery"] as const;
export const partnerStatuses = ["Available", "On delivery", "Offline", "Pending review"] as const;

export const orderItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  packSize: z.string().trim().min(1).max(80),
  quantity: z.number().int().positive().max(999),
  price: z.number().finite().nonnegative(),
  image: z.string().max(2048),
});

export const orderFieldsSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  customerId: z.number().int().positive().nullable().optional(),
  deliveryPartnerId: z.number().int().positive().nullable().optional(),
  customer: z.string().trim().min(1).max(160),
  initials: z.string().trim().min(1).max(8).optional(),
  avatar: z.string().max(80).default(""),
  phone: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(500),
  time: z.string().trim().min(1).max(80).default("Now"),
  minutesAgo: z.number().int().nonnegative().default(0),
  amount: z.number().finite().nonnegative().optional(),
  itemCount: z.number().int().nonnegative().optional(),
  status: z.enum(orderStatuses).default("Pending"),
  paymentMethod: z.enum(paymentMethods),
  paymentStatus: z.enum(paymentStatuses).default("Pending"),
  deliveryPartner: z.string().trim().min(1).max(160).nullable().optional(),
  items: z.array(orderItemSchema).min(1).max(200),
}).superRefine((value, context) => {
  if (value.deliveryPartnerId !== undefined && value.deliveryPartnerId !== null
    && value.deliveryPartner === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deliveryPartner"],
      message: "Provide a partner name when a delivery partner ID is assigned.",
    });
  }
});

export type OrderInput = z.infer<typeof orderFieldsSchema>;

export function getOrderTotals(items: OrderItemSnapshot[]) {
  return {
    amount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export function parsePositiveId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
