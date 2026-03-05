import { useState, useRef, useEffect } from "react";
import { updateDoc, doc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_PIPELINE } from "@/types/order";
import OrderTracker from "@/components/tracking/OrderTracker";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  baking: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  decorating: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  ready: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  delivered: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export default function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes);
  const [saving, setSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleUpdateStatus = async () => {
    if (newStatus === order.status) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const orderRef = doc(db, "orders", order.orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        statusHistory: arrayUnion({
          status: newStatus,
          timestamp: serverTimestamp(),
          note: `Updated from admin panel`,
        }),
        updatedAt: serverTimestamp(),
      });

      setUpdateMessage("Status updated successfully!");
      setTimeout(() => {
        setUpdateMessage("");
        setEditing(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to update status:", err);
      setUpdateMessage("Failed to update. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (adminNotes === order.adminNotes) return;

    setSaving(true);
    try {
      const orderRef = doc(db, "orders", order.orderId);
      await updateDoc(orderRef, {
        adminNotes,
        updatedAt: serverTimestamp(),
      });

      setUpdateMessage("Notes saved!");
      setTimeout(() => setUpdateMessage(""), 2000);
    } catch (err) {
      console.error("Failed to save notes:", err);
      setUpdateMessage("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {order.orderId}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {order.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Status</h3>
                <button
                  onClick={() => {
                    setEditing(!editing);
                    setNewStatus(order.status);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {editing ? "Cancel" : "Edit"}
                </button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {ORDER_STATUS_PIPELINE.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateStatus}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Update Status"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              )}

              {updateMessage && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  {updateMessage}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Tracker Component */}
            <OrderTracker order={order} />

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Admin Notes */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Admin Notes
              </h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                onBlur={handleUpdateNotes}
                placeholder="Add internal notes here..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary outline-none transition resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Saves automatically
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Customer Contact */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Customer Contact
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerEmail}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerPhone}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Order Details */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Order Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Requested Date:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.requestedDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.requestedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Cake Type:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.weight} {order.flavour}
                    {order.eggless && " (Eggless)"}
                  </span>
                </div>
                {order.messageOnCake && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Message:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      "{order.messageOnCake}"
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {order.deliveryType === "deliver"
                      ? "Home Delivery"
                      : "Pickup"}
                  </span>
                </div>
                {order.deliveryType === "deliver" && order.deliveryAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Address:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white max-w-xs text-right">
                      {order.deliveryAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
