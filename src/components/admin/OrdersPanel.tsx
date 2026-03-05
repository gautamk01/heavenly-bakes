import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/types/order";
import OrderDetailModal from "./OrderDetailModal";

type FilterType = "all" | "pending" | "active" | "ready" | "delivered";

const FILTER_TABS: { label: string; value: FilterType }[] = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "active" },
  { label: "Ready", value: "ready" },
  { label: "Delivered", value: "delivered" },
];

const STATUS_COLORS: Record<OrderStatus, { badge: string; text: string }> = {
  pending: { badge: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  confirmed: { badge: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  baking: { badge: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  decorating: { badge: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  ready: { badge: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  delivered: { badge: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300" },
  cancelled: { badge: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        orderId: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "pending") return order.status === "pending";
    if (filter === "active")
      return ["confirmed", "baking", "decorating"].includes(order.status);
    if (filter === "ready") return order.status === "ready";
    if (filter === "delivered") return order.status === "delivered";
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["confirmed", "baking", "decorating"].includes(o.status))
      .length,
    ready: orders.filter((o) => o.status === "ready").length,
  };

  const selectedOrder = selectedOrderId ? orders.find((o) => o.orderId === selectedOrderId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total },
          { label: "Pending", value: stats.pending, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Active", value: stats.active, color: "text-orange-600 dark:text-orange-400" },
          { label: "Ready", value: stats.ready, color: "text-green-600 dark:text-green-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color || "text-gray-900 dark:text-white"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
            {tab.value === "pending" && stats.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <button
              key={order.orderId}
              onClick={() => setSelectedOrderId(order.orderId)}
              className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-mono font-bold text-gray-900 dark:text-white">
                      {order.orderId}
                    </h4>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status].badge} ${STATUS_COLORS[order.status].text}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {order.customerName} • {order.weight} {order.flavour}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>{order.requestedDate} at {order.requestedTime}</span>
                    <span>
                      {order.deliveryType === "deliver" ? "Delivery" : "Pickup"}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="material-icons text-gray-400">chevron_right</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
