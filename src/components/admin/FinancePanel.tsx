import { useState, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/types/order";

export default function FinancePanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "cancelled"),
    [orders]
  );

  const stats = useMemo(() => {
    const paidOrders = activeOrders.filter((o) => o.paymentStatus === "paid");
    const revenue = paidOrders.reduce((sum, o) => sum + (o.sellingPrice || 0), 0);
    const totalCosts = activeOrders.reduce((sum, o) => sum + (o.totalCost || 0) + (o.makingCharge || 0), 0);
    const profit = revenue - totalCosts;
    const unpaidAmount = activeOrders
      .filter((o) => o.paymentStatus !== "paid" && o.sellingPrice)
      .reduce((sum, o) => sum + (o.sellingPrice || 0), 0);

    return { revenue, totalCosts, profit, unpaidAmount, paidCount: paidOrders.length };
  }, [activeOrders]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; costs: number; orders: number }> = {};

    activeOrders.forEach((o) => {
      if (!o.createdAt) return;
      const date = new Date(o.createdAt.seconds * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!months[key]) months[key] = { revenue: 0, costs: 0, orders: 0 };
      months[key].orders++;
      if (o.paymentStatus === "paid") {
        months[key].revenue += o.sellingPrice || 0;
      }
      months[key].costs += (o.totalCost || 0) + (o.makingCharge || 0);
    });

    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        }),
        ...data,
        profit: data.revenue - data.costs,
      }));
  }, [activeOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            Rs {stats.revenue.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.paidCount} paid orders</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Total Costs</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            Rs {stats.totalCosts.toFixed(0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Profit</p>
          <p
            className={`text-2xl font-bold ${
              stats.profit >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            Rs {stats.profit.toFixed(0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Unpaid Amount</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            Rs {stats.unpaidAmount.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Monthly Summary */}
      {monthlyData.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Monthly Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Month</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                  <th className="pb-3 font-medium text-right">Costs</th>
                  <th className="pb-3 font-medium text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => (
                  <tr
                    key={m.month}
                    className="border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <td className="py-3 text-gray-900 dark:text-white font-medium">
                      {m.label}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{m.orders}</td>
                    <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">
                      Rs {m.revenue.toFixed(0)}
                    </td>
                    <td className="py-3 text-right text-orange-600 dark:text-orange-400">
                      Rs {m.costs.toFixed(0)}
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        m.profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Rs {m.profit.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Financial Table */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Order Breakdown</h3>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Cake</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                  <th className="pb-3 font-medium text-right">Profit</th>
                  <th className="pb-3 font-medium text-center">Payment</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => {
                  const orderTotalCost = (order.totalCost || 0) + (order.makingCharge || 0);
                  const orderProfit =
                    order.sellingPrice !== null && order.sellingPrice !== undefined
                      ? order.sellingPrice - orderTotalCost
                      : null;
                  return (
                    <tr
                      key={order.orderId}
                      className="border-b border-gray-100 dark:border-gray-700/50"
                    >
                      <td className="py-3 font-mono text-xs text-gray-900 dark:text-white">
                        {order.orderId}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {order.customerName}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {order.weight} {order.flavour}
                      </td>
                      <td className="py-3 text-right text-gray-900 dark:text-white font-medium">
                        {order.sellingPrice ? `Rs ${order.sellingPrice}` : "-"}
                      </td>
                      <td className="py-3 text-right text-orange-600 dark:text-orange-400">
                        {orderTotalCost ? `Rs ${orderTotalCost.toFixed(0)}` : "-"}
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          orderProfit === null
                            ? "text-gray-400"
                            : orderProfit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {orderProfit !== null ? `Rs ${orderProfit.toFixed(0)}` : "-"}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
