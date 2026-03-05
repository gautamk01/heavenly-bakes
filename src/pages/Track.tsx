import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/types/order";
import OrderTracker from "@/components/tracking/OrderTracker";

export default function Track() {
  const [searchParams] = useSearchParams();
  const paramOrderId = searchParams.get("id") || "";

  const [searchOrderId, setSearchOrderId] = useState(paramOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(!!paramOrderId);

  // Auto-load if order ID in URL param
  useEffect(() => {
    if (!paramOrderId) return;
    handleTrack(paramOrderId);
  }, [paramOrderId]);

  const handleTrack = async (orderId: string) => {
    if (!orderId.trim()) return;

    setLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      // First check if order exists
      const snap = await getDoc(doc(db, "orders", orderId));
      if (!snap.exists()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Set initial order
      setOrder({ orderId: snap.id, ...snap.data() } as Order);

      // Subscribe to real-time updates
      const unsub = onSnapshot(doc(db, "orders", orderId), (newSnap) => {
        if (newSnap.exists()) {
          setOrder({ orderId: newSnap.id, ...newSnap.data() } as Order);
        }
      });

      setLoading(false);
      setSearching(true);

      // Cleanup subscription on unmount or order change
      return unsub;
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setNotFound(true);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(searchOrderId);
  };

  if (!searching) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Track Your Order
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your Order ID to see the status of your cake
            </p>
          </div>

          {/* Search Card */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order ID
              </label>
              <input
                type="text"
                placeholder="e.g., HB-20260305-4721"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                You received this in your confirmation email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Track Order"}
            </button>

            {notFound && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                Order not found. Please check the Order ID and try again.
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-primary hover:underline font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (notFound) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-3xl text-red-500">
              error_outline
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The Order ID you entered doesn't exist. Please check and try again.
          </p>
          <button
            onClick={() => setSearching(false)}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link to="/" className="text-sm text-primary hover:underline mb-2 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Order {order.orderId}
              </h1>
            </div>
            <button
              onClick={() => setSearching(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              New Search
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OrderTracker order={order} />
      </div>

      {/* Footer note */}
      <div className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated:{" "}
          {order.updatedAt
            ? new Date(order.updatedAt.seconds * 1000).toLocaleString()
            : "Just now"}
        </p>
      </div>
    </div>
  );
}
