import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "baking"
  | "decorating"
  | "ready"
  | "delivered"
  | "cancelled";

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Timestamp;
  note?: string;
}

export interface TimelineStep {
  label: string;
  estimatedTime: string;
  duration: string;
}

export interface ProductionTimeline {
  generatedAt: Timestamp;
  steps: TimelineStep[];
  summary: string;
}

export interface ProgressPhoto {
  url: string;
  cloudinaryId: string;
  caption: string;
  uploadedAt: Timestamp;
}

export interface Order {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  flavour: string;
  weight: string;
  candles: string;
  messageOnCake: string;
  eggless: boolean;
  deliveryType: "pickup" | "deliver";
  deliveryAddress: string;
  specialInstructions: string;
  requestedDate: string;
  requestedTime: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  productionTimeline: ProductionTimeline | null;
  progressPhotos: ProgressPhoto[];
  adminNotes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// What the client sends to Firestore on form submit
export interface CreateOrderPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  flavour: string;
  weight: string;
  candles: string;
  messageOnCake: string;
  eggless: boolean;
  deliveryType: "pickup" | "deliver";
  deliveryAddress: string;
  specialInstructions: string;
  requestedDate: string;
  requestedTime: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  baking: "Baking",
  decorating: "Decorating",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_PIPELINE: OrderStatus[] = [
  "pending",
  "confirmed",
  "baking",
  "decorating",
  "ready",
  "delivered",
];
