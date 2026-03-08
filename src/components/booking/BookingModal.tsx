import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { setDoc, doc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateOrderId } from "@/lib/orderId";
import type { CreateOrderPayload } from "@/types/order";
import emailjs from "@emailjs/browser";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  flavour: string;
  weight: string;
  candles: string;
  message: string;
  eggless: boolean;
  delivery: "pickup" | "deliver";
  address: string;
  specs: string;
}

const INITIAL_FORM: FormData = {
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  flavour: "",
  weight: "",
  candles: "",
  message: "",
  eggless: false,
  delivery: "pickup",
  address: "",
  specs: "",
};

const FLAVOURS = [
  "Chocolate",
  "Vanilla",
  "Red Velvet",
  "Butterscotch",
  "Pineapple",
  "Black Forest",
  "Strawberry",
  "Mango",
];

const WEIGHTS = ["0.5 kg", "1 kg", "1.5 kg", "2 kg", "3 kg", "5 kg"];

const STEP_LABELS = ["When", "What", "How"];

export default function BookingModal({ open, onClose }: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [generatedOrderId, setGeneratedOrderId] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);

  // Update a single form field
  const updateField = <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Card entrance animation on open
  useEffect(() => {
    if (!open) return;
    // Reset state when opening
    setCurrentStep(1);
    setFormData(INITIAL_FORM);
    setShowSuccess(false);

    const card = cardRef.current;
    const overlay = overlayRef.current;
    if (!card || !overlay) return;

    gsap.set(overlay, { opacity: 0 });
    gsap.set(card, { scale: 0.85, opacity: 0, y: 40 });

    const tl = gsap.timeline();
    tl.to(overlay, { opacity: 1, duration: 0.3, ease: "power2.out" });
    tl.to(
      card,
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" },
      "-=0.15"
    );

    return () => {
      tl.kill();
    };
  }, [open]);

  // Field stagger animation on step change
  useEffect(() => {
    if (!open || showSuccess) return;
    const container = fieldsRef.current;
    if (!container) return;

    const fields = container.querySelectorAll(".form-field");
    if (fields.length === 0) return;

    gsap.fromTo(
      fields,
      { opacity: 0, x: 30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: 0.07,
        ease: "power2.out",
      }
    );
  }, [currentStep, open, showSuccess]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const shakeField = (el: HTMLElement) => {
    gsap.fromTo(
      el,
      { x: -8 },
      { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
    );
  };

  const validateStep = (): boolean => {
    const container = fieldsRef.current;
    if (!container) return false;

    let valid = true;
    const requiredMap: Record<number, (keyof FormData)[]> = {
      1: ["date", "time", "name", "email", "phone"],
      2: ["flavour", "weight"],
      3: [],
    };

    const required = requiredMap[currentStep] || [];
    for (const key of required) {
      const value = formData[key];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const fieldEl = container.querySelector(
          `[data-field="${key}"]`
        ) as HTMLElement | null;
        if (fieldEl) shakeField(fieldEl);
        valid = false;
      }
    }

    if (
      currentStep === 3 &&
      formData.delivery === "deliver" &&
      !formData.address.trim()
    ) {
      const fieldEl = container.querySelector(
        `[data-field="address"]`
      ) as HTMLElement | null;
      if (fieldEl) shakeField(fieldEl);
      valid = false;
    }

    return valid;
  };

  const goToStep = (step: number) => {
    const container = fieldsRef.current;
    if (!container) {
      setCurrentStep(step);
      return;
    }

    // Slide out current fields
    gsap.to(container, {
      opacity: 0,
      x: step > currentStep ? -30 : 30,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        setCurrentStep(step);
        gsap.set(container, { opacity: 1, x: 0 });
      },
    });
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const orderId = generateOrderId();

      // 1. Create order payload for Firestore
      const payload: CreateOrderPayload = {
        orderId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        flavour: formData.flavour,
        weight: formData.weight,
        candles: formData.candles,
        messageOnCake: formData.message,
        eggless: formData.eggless,
        deliveryType: formData.delivery,
        deliveryAddress: formData.address,
        specialInstructions: formData.specs,
        requestedDate: formData.date,
        requestedTime: formData.time,
      };

      // 2. Write to Firestore
      await setDoc(doc(db, "orders", orderId), {
        ...payload,
        status: "pending",
        statusHistory: [],
        productionTimeline: null,
        progressPhotos: [],
        adminNotes: "",
        sellingPrice: null,
        paymentStatus: "unpaid",
        paidAt: null,
        costs: [],
        totalCost: 0,
        makingCharge: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Send email via EmailJS (client-side)
      try {
        const cakeSummary = `${formData.weight} ${formData.flavour} Cake${formData.eggless ? " (Eggless)" : ""}`;
        const deliveryInfo =
          formData.delivery === "deliver"
            ? `Delivery to: ${formData.address}`
            : "Pickup";

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: formData.email,
            order_id: orderId,
            customer_name: formData.name,
            cake_summary: cakeSummary,
            requested_date: formData.date,
            requested_time: formData.time,
            delivery_type: deliveryInfo,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
        // Don't fail the entire submission if email fails
      }

      // 4. Trigger Cloud Function for Telegram notification (fire and forget)
      fetch(
        (import.meta.env.VITE_CLOUD_FUNCTION_URL || "") + "/onOrderCreated",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        }
      ).catch(() => {
        console.error("Cloud function call failed");
        // Silent fail — notification is nice-to-have
      });

      // 5. Show success with order ID
      setGeneratedOrderId(orderId);
      setShowSuccess(true);
    } catch (err) {
      console.error("Order submission failed:", err);
      setSubmitError(
        "Could not submit your order. Please try again or contact us on Instagram."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const card = cardRef.current;
    const overlay = overlayRef.current;
    if (!card || !overlay) {
      onClose();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => onClose(),
    });
    tl.to(card, {
      scale: 0.85,
      opacity: 0,
      y: 30,
      duration: 0.3,
      ease: "power2.in",
    });
    tl.to(overlay, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Cake icon */}
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.1 17.29 4.55 17.29 3.25 16L2 14.75V21c0 .55.45 1 1 1h18c.55 0 1-.45 1-1v-6.25l-1.25 1.25c-1.3 1.3-2.85 1.29-4.15-.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54l1.83 1.83c.65.65 1.68.65 2.33 0l1.41-1.41 1.41 1.41c.65.65 1.7.65 2.35 0l1.41-1.41 1.41 1.41c.65.65 1.68.65 2.33 0L21 13.54V12c0-1.66-1.34-3-3-3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Book Your Cake
            </h2>
          </div>

          {/* Progress bar */}
          {!showSuccess && (
            <div className="flex items-center gap-2">
              {STEP_LABELS.map((label, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isDone = step < currentStep;
                return (
                  <div key={label} className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isDone
                            ? "bg-green-500 text-white"
                            : isActive
                              ? "bg-primary text-white"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {isDone ? (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isActive
                            ? "text-primary"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone
                            ? "bg-green-500 w-full"
                            : isActive
                              ? "bg-primary w-1/2"
                              : "w-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {showSuccess ? (
            <SuccessState orderId={generatedOrderId} email={formData.email} />
          ) : (
            <div ref={fieldsRef}>
              {currentStep === 1 && (
                <StepWhen formData={formData} updateField={updateField} />
              )}
              {currentStep === 2 && (
                <StepWhat formData={formData} updateField={updateField} />
              )}
              {currentStep === 3 && (
                <StepHow formData={formData} updateField={updateField} />
              )}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        {!showSuccess && (
          <div className="px-6 pb-6 pt-2 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700">
            {submitError && (
              <div className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 3
                  ? submitting
                    ? "Confirming..."
                    : "Confirm Order"
                  : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step Components ─── */

function StepWhen({
  formData,
  updateField,
}: {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="form-field" data-field="date">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => updateField("date", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
      <div className="form-field" data-field="time">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Time <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => updateField("time", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
      <div className="form-field" data-field="name">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Your full name"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
      <div className="form-field" data-field="email">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
      <div className="form-field" data-field="phone">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          placeholder="Your phone number"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
    </div>
  );
}

function StepWhat({
  formData,
  updateField,
}: {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="form-field" data-field="flavour">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Flavour <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.flavour}
          onChange={(e) => updateField("flavour", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        >
          <option value="">Select a flavour</option>
          {FLAVOURS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field" data-field="weight">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Weight <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.weight}
          onChange={(e) => updateField("weight", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        >
          <option value="">Select weight</option>
          {WEIGHTS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field" data-field="candles">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Number of Candles
        </label>
        <input
          type="number"
          min="0"
          max="100"
          placeholder="0"
          value={formData.candles}
          onChange={(e) => updateField("candles", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
      <div className="form-field" data-field="message">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message on Cake
        </label>
        <input
          type="text"
          placeholder="e.g. Happy Birthday Priya!"
          value={formData.message}
          onChange={(e) => updateField("message", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>
      <div className="form-field" data-field="eggless">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.eggless}
              onChange={(e) => updateField("eggless", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-primary transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Eggless
          </span>
        </label>
      </div>
    </div>
  );
}

function StepHow({
  formData,
  updateField,
}: {
  formData: FormData;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="form-field" data-field="delivery">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Delivery Method
        </label>
        <div className="flex gap-3">
          <label
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
              formData.delivery === "pickup"
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value="pickup"
              checked={formData.delivery === "pickup"}
              onChange={() => updateField("delivery", "pickup")}
              className="sr-only"
            />
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium">Pickup</span>
          </label>
          <label
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
              formData.delivery === "deliver"
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value="deliver"
              checked={formData.delivery === "deliver"}
              onChange={() => updateField("delivery", "deliver")}
              className="sr-only"
            />
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span className="text-sm font-medium">Deliver</span>
          </label>
        </div>
      </div>

      {formData.delivery === "deliver" && (
        <div className="form-field" data-field="address">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Delivery Address <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Full delivery address"
            value={formData.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
          />
        </div>
      )}

      <div className="form-field" data-field="specs">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Special Instructions
        </label>
        <textarea
          rows={3}
          placeholder="Allergies, design preferences, etc."
          value={formData.specs}
          onChange={(e) => updateField("specs", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
        />
      </div>
    </div>
  );
}

/* ─── Success State ─── */

function SuccessState({ orderId, email }: { orderId: string; email: string }) {
  const checkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = checkRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { scale: 0, rotation: -180 },
      {
        scale: 1,
        rotation: 0,
        duration: 0.7,
        ease: "back.out(1.7)",
      }
    );
  }, []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
      <div
        ref={checkRef}
        className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Order Confirmed!
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Check your email at <span className="font-medium">{email}</span> for
          details and contact information
        </p>
      </div>

      <div className="w-full max-w-sm px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Your Order ID
        </p>
        <button
          onClick={copyOrderId}
          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-mono font-bold text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {orderId}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Click to copy
        </p>
      </div>
    </div>
  );
}
