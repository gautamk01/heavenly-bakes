#!/usr/bin/env node
// Quick EmailJS test — run with: node test-email.mjs your@email.com

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Read .env manually ────────────────────────────────────────────
const envPath = join(__dir, ".env");
const env = {};
try {
  readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.replace(/\r/, "").split("=");
      if (key && rest.length) env[key.trim()] = rest.join("=").trim();
    });
} catch {
  console.error("❌ Could not read .env file");
  process.exit(1);
}

const SERVICE_ID = env["VITE_EMAILJS_SERVICE_ID"];
const TEMPLATE_ID = env["VITE_EMAILJS_TEMPLATE_ID"];
const PUBLIC_KEY = env["VITE_EMAILJS_PUBLIC_KEY"];
const TO_EMAIL = process.argv[2];

// ── Validate ──────────────────────────────────────────────────────
if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
  console.error("❌ Missing EmailJS keys in .env");
  console.error("   Make sure these are set:");
  console.error("   VITE_EMAILJS_SERVICE_ID");
  console.error("   VITE_EMAILJS_TEMPLATE_ID");
  console.error("   VITE_EMAILJS_PUBLIC_KEY");
  process.exit(1);
}

if (!TO_EMAIL) {
  console.error("❌ Usage: node test-email.mjs your@email.com");
  process.exit(1);
}

// ── Send via EmailJS REST API ─────────────────────────────────────
const orderId = "HB-TEST-" + Date.now().toString().slice(-4);
const payload = {
  service_id: SERVICE_ID,
  template_id: TEMPLATE_ID,
  user_id: PUBLIC_KEY,
  template_params: {
    to_email: TO_EMAIL,
    order_id: orderId,
    customer_name: "Test Customer",
    cake_summary: "1kg Chocolate Truffle Cake (Eggless)",
    requested_date: "March 10, 2026",
    requested_time: "11:00 AM",
    delivery_type: "Pickup",
    tracking_url: `http://localhost:5173/track?id=${orderId}`,
  },
};

console.log(`\n🧪 Sending test email to: ${TO_EMAIL}`);
console.log(`📦 Order ID: ${orderId}\n`);

const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (res.ok) {
  console.log(
    "✅ Email sent successfully! Check your inbox (and spam folder).",
  );
} else {
  const text = await res.text();
  console.error(`❌ Failed (${res.status}): ${text}`);
  if (res.status === 400)
    console.error("   → Check your Service ID and Template ID");
  if (res.status === 403) console.error("   → Check your Public Key");
}
