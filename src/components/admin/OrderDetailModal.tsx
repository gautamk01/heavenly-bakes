import { useState, useRef, useEffect } from "react";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus, OrderCostItem } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_PIPELINE } from "@/types/order";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  baking:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  decorating:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  ready: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  delivered: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

interface Ingredient {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
}

// Sub-units that convert to the base unit
const SUB_UNITS: Record<string, { sub: string; factor: number }> = {
  kg: { sub: "g", factor: 0.001 },
  liter: { sub: "ml", factor: 0.001 },
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
  const [sellingPrice, setSellingPrice] = useState(
    order.sellingPrice !== null && order.sellingPrice !== undefined
      ? String(order.sellingPrice)
      : "",
  );
  const [makingCharge, setMakingCharge] = useState(
    String(order.makingCharge || 0),
  );
  const [saving, setSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Ingredient add form state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showAddCost, setShowAddCost] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [costQty, setCostQty] = useState("");
  const [costUnit, setCostUnit] = useState(""); // "kg", "g", "liter", "ml", "piece"
  const [addingCost, setAddingCost] = useState(false);

  // Load ingredients for dropdown
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Ingredient[];
      setIngredients(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const showMessage = (msg: string) => {
    setUpdateMessage(msg);
    setTimeout(() => setUpdateMessage(""), 2000);
  };

  const handleUpdateStatus = async () => {
    if (newStatus === order.status) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      showMessage("Status updated!");
      setEditing(false);
    } catch {
      showMessage("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (adminNotes === order.adminNotes) return;
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        adminNotes,
        updatedAt: serverTimestamp(),
      });
      showMessage("Notes saved!");
    } catch {
      showMessage("Failed to save.");
    }
  };

  const handleUpdatePrice = async () => {
    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price < 0) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        sellingPrice: price,
        updatedAt: serverTimestamp(),
      });
      showMessage("Price updated!");
    } catch {
      showMessage("Failed to update price.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePayment = async () => {
    const newPaymentStatus = order.paymentStatus === "paid" ? "unpaid" : "paid";
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        paymentStatus: newPaymentStatus,
        paidAt: newPaymentStatus === "paid" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      showMessage(
        newPaymentStatus === "paid" ? "Marked as paid!" : "Marked as unpaid.",
      );
    } catch {
      showMessage("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMakingCharge = async () => {
    const charge = parseFloat(makingCharge);
    if (isNaN(charge) || charge < 0) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        makingCharge: charge,
        updatedAt: serverTimestamp(),
      });
      showMessage("Making charge updated!");
    } catch {
      showMessage("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCostItem = async () => {
    const ingredient = ingredients.find((i) => i.id === selectedIngredient);
    if (!ingredient) return;
    const qty = parseFloat(costQty);
    if (isNaN(qty) || qty <= 0) return;

    setAddingCost(true);
    try {
      // Convert quantity to base unit
      let qtyInBaseUnit = qty;
      let displayUnit = costUnit || ingredient.unit;
      const subInfo = SUB_UNITS[ingredient.unit];

      if (subInfo && displayUnit === subInfo.sub) {
        // e.g., user entered grams but price is per kg
        qtyInBaseUnit = qty * subInfo.factor;
        displayUnit = subInfo.sub;
      } else {
        displayUnit = ingredient.unit;
      }

      const itemCost = qtyInBaseUnit * ingredient.pricePerUnit;

      const newCostItem: OrderCostItem = {
        name: ingredient.name,
        quantity: qty,
        unit: displayUnit,
        pricePerUnit: ingredient.pricePerUnit,
        totalCost: Math.round(itemCost * 100) / 100,
      };

      const updatedCosts = [...(order.costs || []), newCostItem];
      const updatedTotalCost = updatedCosts.reduce(
        (sum, c) => sum + c.totalCost,
        0,
      );

      await updateDoc(doc(db, "orders", order.orderId), {
        costs: updatedCosts,
        totalCost: Math.round(updatedTotalCost * 100) / 100,
        updatedAt: serverTimestamp(),
      });

      // Reset form
      setSelectedIngredient("");
      setCostQty("");
      setCostUnit("");
      setShowAddCost(false);
      showMessage("Cost added!");
    } catch {
      showMessage("Failed to add cost.");
    } finally {
      setAddingCost(false);
    }
  };

  const handleDeleteCostItem = async (index: number) => {
    const updatedCosts = (order.costs || []).filter((_, i) => i !== index);
    const updatedTotalCost = updatedCosts.reduce(
      (sum, c) => sum + c.totalCost,
      0,
    );

    try {
      await updateDoc(doc(db, "orders", order.orderId), {
        costs: updatedCosts,
        totalCost: Math.round(updatedTotalCost * 100) / 100,
        updatedAt: serverTimestamp(),
      });
      showMessage("Cost removed!");
    } catch {
      showMessage("Failed to remove cost.");
    }
  };

  const handleDeleteOrder = async () => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, "orders", order.orderId));
      onClose();
    } catch {
      showMessage("Failed to delete order.");
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const ingredientTotal = order.totalCost || 0;
  const orderMakingCharge = order.makingCharge || 0;
  const totalCost = ingredientTotal + orderMakingCharge;
  const profit =
    order.sellingPrice !== null && order.sellingPrice !== undefined
      ? order.sellingPrice - totalCost
      : null;

  // Calculate preview cost when adding ingredient
  const selectedIng = ingredients.find((i) => i.id === selectedIngredient);
  let previewCost: number | null = null;
  if (selectedIng && costQty) {
    const qty = parseFloat(costQty);
    if (!isNaN(qty) && qty > 0) {
      const subInfo = SUB_UNITS[selectedIng.unit];
      const effectiveUnit = costUnit || selectedIng.unit;
      let qtyInBase = qty;
      if (subInfo && effectiveUnit === subInfo.sub) {
        qtyInBase = qty * subInfo.factor;
      }
      previewCost =
        Math.round(qtyInBase * selectedIng.pricePerUnit * 100) / 100;
    }
  }

  // Get available units for selected ingredient
  const getUnitOptions = (ing: Ingredient) => {
    const options = [ing.unit];
    const subInfo = SUB_UNITS[ing.unit];
    if (subInfo) options.unshift(subInfo.sub);
    return options;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
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
        <div
          className="flex-1 overflow-y-auto"
          data-lenis-prevent
          style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
        >
          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Status
                </h3>
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
                    onChange={(e) =>
                      setNewStatus(e.target.value as OrderStatus)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {ORDER_STATUS_PIPELINE.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Update Status"}
                  </button>
                </div>
              ) : (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${STATUS_COLORS[order.status]}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              )}

              {updateMessage && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  {updateMessage}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Price & Payment Section */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Price & Payment
              </h3>
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Selling Price (Rs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="Enter price"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={handleUpdatePrice}
                    disabled={saving}
                    className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        order.paymentStatus === "paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                    {order.paidAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(
                          order.paidAt.seconds * 1000,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleTogglePayment}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      order.paymentStatus === "paid"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                    }`}
                  >
                    {order.paymentStatus === "paid"
                      ? "Mark Unpaid"
                      : "Mark Paid"}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Costs Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Cost Breakdown
                </h3>
                <button
                  onClick={() => setShowAddCost(!showAddCost)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span className="material-icons" style={{ fontSize: "16px" }}>
                    {showAddCost ? "close" : "add"}
                  </span>
                  {showAddCost ? "Cancel" : "Add Ingredient"}
                </button>
              </div>

              {/* Add Ingredient Form */}
              {showAddCost && (
                <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Ingredient
                      </label>
                      <select
                        value={selectedIngredient}
                        onChange={(e) => {
                          setSelectedIngredient(e.target.value);
                          const ing = ingredients.find(
                            (i) => i.id === e.target.value,
                          );
                          if (ing) {
                            const subInfo = SUB_UNITS[ing.unit];
                            setCostUnit(subInfo ? subInfo.sub : ing.unit);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} — Rs {ing.pricePerUnit}/{ing.unit}
                          </option>
                        ))}
                      </select>
                      {ingredients.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No ingredients found. Add them in the Ingredients tab
                          first.
                        </p>
                      )}
                    </div>

                    {selectedIng && (
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={costQty}
                            onChange={(e) => setCostQty(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Unit
                          </label>
                          <select
                            value={costUnit}
                            onChange={(e) => setCostUnit(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            {getUnitOptions(selectedIng).map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {previewCost !== null && (
                      <div className="flex items-center justify-between p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                        <span className="text-xs text-blue-700 dark:text-blue-400">
                          Estimated cost:
                        </span>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                          Rs {previewCost.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleAddCostItem}
                      disabled={addingCost || !selectedIngredient || !costQty}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {addingCost ? "Adding..." : "Add to Order"}
                    </button>
                  </div>
                </div>
              )}

              {/* Costs Table */}
              {order.costs && order.costs.length > 0 ? (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-2 font-medium">Item</th>
                          <th className="pb-2 font-medium">Qty</th>
                          <th className="pb-2 font-medium">Rate</th>
                          <th className="pb-2 font-medium text-right">Cost</th>
                          <th className="pb-2 font-medium w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.costs.map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 dark:border-gray-700/50 group"
                          >
                            <td className="py-2 text-gray-900 dark:text-white capitalize">
                              {item.name}
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              Rs {item.pricePerUnit}/
                              {
                                // Show base unit for rate
                                Object.entries(SUB_UNITS).find(
                                  ([, v]) => v.sub === item.unit,
                                )?.[0] || item.unit
                              }
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                              Rs {item.totalCost.toFixed(2)}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleDeleteCostItem(idx)}
                                className="p-0.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove"
                              >
                                <span
                                  className="material-icons"
                                  style={{ fontSize: "16px" }}
                                >
                                  close
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                !showAddCost && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    No ingredients added yet.
                  </p>
                )
              )}

              {/* Making Charge */}
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Making Charge (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={makingCharge}
                    onChange={(e) => setMakingCharge(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <button
                  onClick={handleUpdateMakingCharge}
                  disabled={saving}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Ingredients
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    Rs {ingredientTotal.toFixed(2)}
                  </span>
                </div>
                {orderMakingCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Making Charge
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {orderMakingCharge.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-700 dark:text-gray-300">
                    Total Cost
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    Rs {totalCost.toFixed(2)}
                  </span>
                </div>
                {profit !== null && (
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700 dark:text-gray-300">
                      Profit
                    </span>
                    <span
                      className={
                        profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      Rs {profit.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

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
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary outline-none transition resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Saves automatically
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Customer Contact */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                Customer Contact
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Email:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerEmail}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Phone:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerPhone}
                  </p>
                </div>
              </div>
            </div>

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
                  <span className="text-gray-600 dark:text-gray-400">
                    Time:
                  </span>
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
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                Delete this order?
              </span>
              <button
                onClick={handleDeleteOrder}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Delete Order
            </button>
          )}
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
