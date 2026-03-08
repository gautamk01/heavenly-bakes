import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "baking"
  | "decorating"
  | "ready"
  | "delivered"
  | "cancelled"
  | "finished";

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

export interface OrderCostItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
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
  sellingPrice: number | null;
  paymentStatus: "unpaid" | "paid";
  paidAt: Timestamp | null;
  costs: OrderCostItem[];
  totalCost: number;
  makingCharge: number;
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
  finished: "Finished",
};

export const ORDER_STATUS_PIPELINE: OrderStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
];
