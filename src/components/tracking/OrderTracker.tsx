import { useMemo } from "react";
import type { Order, OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_PIPELINE } from "@/types/order";

const STEP_ICONS: Record<OrderStatus, string> = {
  pending: "hourglass_empty",
  confirmed: "check_circle",
  baking: "local_fire_department",
  decorating: "brush",
  ready: "inventory_2",
  delivered: "local_shipping",
  cancelled: "cancel",
};

export default function OrderTracker({ order }: { order: Order }) {
  const currentIndex = useMemo(
    () => ORDER_STATUS_PIPELINE.indexOf(order.status),
    [order.status]
  );

  return (
    <div className="space-y-8">
      {/* Status Pipeline */}
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-start gap-0 md:gap-2 w-full">
          {ORDER_STATUS_PIPELINE.map((step, i) => {
            const isDone = i < currentIndex;
            const isActive = i === currentIndex;

            return (
              <div key={step} className="flex flex-col md:flex-1 items-start md:items-center">
                {/* Circle + connector */}
                <div className="flex items-start md:items-center w-full gap-2 md:gap-0">
                  {i > 0 && (
                    <div
                      className={`hidden md:block flex-1 h-1 mb-3 ${
                        isDone || isActive ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}

                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      isDone
                        ? "bg-primary border-primary text-white"
                        : isActive
                          ? "bg-white dark:bg-gray-800 border-primary text-primary ring-4 ring-primary/20"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
                    } ${isActive ? "animate-pulse" : ""}`}
                  >
                    {isDone ? (
                      <span className="material-icons text-lg">check</span>
                    ) : (
                      <span className="material-icons text-lg">
                        {STEP_ICONS[step]}
                      </span>
                    )}
                  </div>

                  {i < ORDER_STATUS_PIPELINE.length - 1 && (
                    <div
                      className={`hidden md:block flex-1 h-1 mb-3 ${
                        isDone ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                </div>

                {/* Label */}
                <p
                  className={`text-xs md:text-sm font-medium mt-2 md:mt-3 text-left md:text-center ${
                    isActive
                      ? "text-primary font-bold"
                      : isDone
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {ORDER_STATUS_LABELS[step]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Badge */}
      <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Your cake is currently:{" "}
          <span className="font-bold text-primary">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </p>
      </div>

      {/* Production Timeline */}
      {order.productionTimeline && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Production Timeline
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.productionTimeline.summary}
          </p>
          <div className="space-y-2">
            {order.productionTimeline.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
              >
                <div className="text-xs font-bold text-primary min-w-fit">
                  {step.duration}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {step.estimatedTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Photos */}
      {order.progressPhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Progress Updates ({order.progressPhotos.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {order.progressPhotos.map((photo, idx) => (
              <a
                key={idx}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity"
              >
                <img
                  src={photo.url}
                  alt={`Progress ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                      {photo.caption}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Cake:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.weight} {order.flavour}
              {order.eggless && " (Eggless)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.requestedDate} at {order.requestedTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {order.deliveryType === "deliver" ? "Home Delivery" : "Pickup"}
            </span>
          </div>
          {order.messageOnCake && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Message:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                "{order.messageOnCake}"
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
