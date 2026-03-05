import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const onOrderCreated = functions.https.onRequest(
    async (req, res) => {
        const { orderId } = req.body;

        try {
            const orderSnap = await db.collection("orders").doc(orderId).get();
            const order = orderSnap.data();

            if (!order) {
                res.status(404).json({ error: "Order not found" });
                return;
            }

            // Send Telegram notification
            const telegramMessage = formatTelegramMessage(order);
            await sendTelegramMessage(telegramMessage);

            // Generate AI timeline
            await generateAITimeline(orderId, order);

            res.json({ success: true });
        } catch (err) {
            console.error("Error:", err);
            res.status(500).json({ error: "Internal error" });
        }
    }
);

export const telegramWebhook = functions.https.onRequest(
    async (req, res) => {
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }

        try {
            const { message } = req.body;
            if (!message) {
                res.status(200).json({ ok: true });
                return;
            }

            const chatId = message.chat.id;
            const text = message.text?.trim() || "";

            // Verify chat is authorized
            if (chatId.toString() !== process.env.TELEGRAM_ALLOWED_CHAT_ID) {
                res.status(200).json({ ok: true });
                return;
            }

            // Route commands
            if (text.startsWith("/confirm ")) {
                const orderId = text.split(" ")[1];
                await updateOrderStatus(orderId, "confirmed");
                await sendTelegramMessage(
                    `✅ Order ${orderId} confirmed!`,
                    chatId
                );
            } else if (text.startsWith("/status ")) {
                const parts = text.split(" ");
                const orderId = parts[1];
                const newStatus = parts[2];
                await updateOrderStatus(orderId, newStatus);
                await sendTelegramMessage(
                    `📝 Order ${orderId} updated to: ${newStatus}`,
                    chatId
                );
            } else if (text.startsWith("/pending")) {
                const orders = await db
                    .collection("orders")
                    .where("status", "==", "pending")
                    .limit(10)
                    .get();
                const msg = orders.docs
                    .map((d) => `${d.id}: ${d.data().customerName}`)
                    .join("\n");
                await sendTelegramMessage(
                    `⏳ Pending Orders:\n${msg || "None"}`,
                    chatId
                );
            }

            res.status(200).json({ ok: true });
        } catch (err) {
            console.error("Webhook error:", err);
            res.status(200).json({ ok: true }); // Always 200 for Telegram
        }
    }
);

async function sendTelegramMessage(
    text: string,
    chatId?: number
) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const targetChatId = chatId || process.env.TELEGRAM_ALLOWED_CHAT_ID;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: targetChatId,
            text,
            parse_mode: "HTML",
        }),
    });

    if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
    }
}

async function updateOrderStatus(
    orderId: string,
    status: string
) {
    await db.collection("orders").doc(orderId).update({
        status,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
            status,
            timestamp: admin.firestore.Timestamp.now(),
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function generateAITimeline(orderId: string, order: any) {
    try {
        const { OpenAI } = await import("openai");
        const client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        });

        const prompt = `You are a professional cake production scheduler.

Order: ${order.weight} ${order.flavour} cake${order.eggless ? " (Eggless)" : ""
            }
Special requests: ${order.specialInstructions || "None"}
Delivery date: ${order.requestedDate}

Generate a 4-5 step production timeline. Respond with ONLY valid JSON:
{
  "summary": "Brief overview",
  "steps": [
    {
      "label": "Step name",
      "estimatedTime": "Day X, HH:MM AM/PM",
      "duration": "X hours/minutes"
    }
  ]
}`;

        const response = await client.chat.completions.create({
            model: "z-ai/glm-4.5-air:free",
            messages: [{ role: "user", content: prompt }],
        });

        const timeline = JSON.parse(
            response.choices[0].message.content || "{}"
        );

        await db.collection("orders").doc(orderId).update({
            productionTimeline: {
                ...timeline,
                generatedAt: admin.firestore.Timestamp.now(),
            },
        });
    } catch (err) {
        console.error("AI timeline generation failed (non-blocking):", err);
    }
}

function formatTelegramMessage(order: any): string {
    return `<b>📦 New Order: ${order.orderId}</b>

<b>Customer:</b> ${order.customerName}
<b>Contact:</b> ${order.customerEmail}
<b>Phone:</b> ${order.customerPhone}

<b>🎂 Cake:</b> ${order.weight} ${order.flavour}${order.eggless ? " (Eggless)" : ""
        }
<b>📅 Date:</b> ${order.requestedDate} at ${order.requestedTime}
<b>🚗 Delivery:</b> ${order.deliveryType === "deliver"
            ? `Home Delivery to ${order.deliveryAddress}`
            : "Pickup"
        }
${order.messageOnCake ? `<b>💬 Message:</b> "${order.messageOnCake}"` : ""}
${order.specialInstructions ? `<b>✨ Special Instructions:</b> ${order.specialInstructions}` : ""}

<b>Commands:</b>
/confirm ${order.orderId}
/status ${order.orderId} baking`;
}
