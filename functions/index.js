const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// In-memory state for multi-step /addingredient flow
const pendingAddCost = new Map();

const STATUS_EMOJI = {
    pending: "⏳",
    confirmed: "✅",
    cancelled: "❌",
    finished: "🏁",
};

// ─── Exported Cloud Functions ────────────────────────────────────────────────

exports.onOrderCreated = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    const { orderId } = req.body;

    try {
        const orderSnap = await db.collection("orders").doc(orderId).get();
        const order = orderSnap.data();

        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        const telegramMessage = formatTelegramMessage(order);
        const buttons = [
            [
                { text: "✅ Confirm", callback_data: `confirm:${orderId}` },
                { text: "❌ Cancel", callback_data: `status:${orderId}:cancelled` },
            ],
        ];
        await sendTelegramMessage(telegramMessage, null, buttons);

        res.json({ success: true });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

// One-time setup: call this URL once to register bot commands in Telegram menu
exports.setupBotCommands = functions.https.onRequest(async (req, res) => {
    const commands = [
        { command: "addingredient", description: "Add ingredient to order" },
        { command: "updateingredient", description: "Update ingredient quantity" },
        { command: "deleteingredient", description: "Delete ingredient from order" },
        { command: "seeprice", description: "View cost breakdown for orders" },
        { command: "paid", description: "List all paid orders" },
        { command: "notpaid", description: "List all unpaid orders" },
        { command: "pending", description: "View pending orders" },
        { command: "active", description: "View confirmed orders" },
        { command: "finished", description: "View finished (paid) orders" },
        { command: "items", description: "View all ingredients" },
        { command: "help", description: "Show all commands" },
    ];

    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const fetch = (await import("node-fetch")).default;
    const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setMyCommands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands }),
    });
    const result = await resp.json();
    res.json({ success: true, result });
});

exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const { message, callback_query } = req.body;

        if (callback_query) {
            await handleCallbackQuery(callback_query);
            res.status(200).json({ ok: true });
            return;
        }

        if (!message) {
            res.status(200).json({ ok: true });
            return;
        }

        const chatId = message.chat.id;
        const text = (message.text || "").trim();

        const allowedIds = (process.env.TELEGRAM_ALLOWED_CHAT_ID || "").split(",").map(id => id.trim());
        if (!allowedIds.includes(chatId.toString())) {
            res.status(200).json({ ok: true });
            return;
        }

        // Check for pending multi-step state (e.g. /addingredient flow)
        const pending = pendingAddCost.get(chatId.toString());
        if (pending && !text.startsWith("/")) {
            if (pending.type === "quantity") {
                await handleAddIngredientQuantity(chatId, text, pending);
            } else if (pending.type === "newitem") {
                await handleAddNewIngredientInline(chatId, text, pending);
            } else if (pending.type === "search") {
                await handleIngredientSearch(chatId, text, pending);
            } else if (pending.type === "updateqty") {
                await handleUpdateCostQuantity(chatId, text, pending);
            } else if (pending.type === "setprice") {
                await handleSetPriceInput(chatId, text, pending);
            }
            res.status(200).json({ ok: true });
            return;
        }

        // Route commands
        if (text.startsWith("/confirm ")) {
            const orderId = text.split(" ")[1];
            await updateOrderStatus(orderId, "confirmed");
            await sendTelegramMessage(`✅ Order ${orderId} confirmed!`, chatId);

        } else if (text.startsWith("/cancel ")) {
            const orderId = text.split(" ")[1];
            await updateOrderStatus(orderId, "cancelled");
            await sendTelegramMessage(`❌ Order ${orderId} cancelled.`, chatId);

        } else if (text.startsWith("/price ")) {
            const parts = text.split(" ");
            const orderId = parts[1];
            const price = parseFloat(parts[2]);
            if (!orderId || isNaN(price)) {
                await sendTelegramMessage("Usage: /price HB-xxxx 1500", chatId);
            } else {
                await db.collection("orders").doc(orderId).update({
                    sellingPrice: price,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                await sendTelegramMessage(`💰 ${orderId} price set to Rs ${price}`, chatId);
            }

        } else if (text.startsWith("/paid ")) {
            const orderId = text.split(" ")[1];
            await db.collection("orders").doc(orderId).update({
                paymentStatus: "paid",
                status: "finished",
                paidAt: admin.firestore.Timestamp.now(),
                statusHistory: admin.firestore.FieldValue.arrayUnion({
                    status: "finished",
                    timestamp: admin.firestore.Timestamp.now(),
                }),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await sendTelegramMessage(`💵 ${orderId} marked as PAID\n🏁 Moved to finished orders`, chatId);

        } else if (text.startsWith("/addcost ")) {
            await handleAddCost(text, chatId);

        } else if (text.startsWith("/newitem ")) {
            await handleNewItem(text, chatId);

        } else if (text.startsWith("/items")) {
            await handleListItems(chatId);

        } else if (text.startsWith("/costs ")) {
            const orderId = text.split(" ")[1];
            await handleViewCosts(orderId, chatId);

        } else if (text.startsWith("/addingredient")) {
            await handleAddIngredientStart(chatId);

        } else if (text.startsWith("/updateingredient")) {
            await handleEditCostStart(chatId, "u");

        } else if (text.startsWith("/deleteingredient")) {
            await handleEditCostStart(chatId, "d");

        } else if (text.startsWith("/seeprice")) {
            await handleSeePriceList(chatId);

        } else if (text === "/paid") {
            await sendPaymentList(chatId, "paid", "💵 Paid Orders");

        } else if (text === "/notpaid") {
            await sendPaymentList(chatId, "unpaid", "🔴 Unpaid Orders");

        } else if (text.startsWith("/finished")) {
            await sendOrderList(chatId, "finished", "🏁 Finished Orders");

        } else if (text.startsWith("/pending")) {
            await sendOrderList(chatId, "pending", "⏳ Pending Orders");

        } else if (text.startsWith("/active")) {
            await sendOrderList(chatId, "confirmed", "✅ Confirmed Orders");

        } else if (text.startsWith("/help") || text.startsWith("/start")) {
            await sendTelegramMessage(
                `<b>📋 Heavenly Bakes Bot</b>\n\n` +
                `<b>Order Management:</b>\n` +
                `/pending — Pending orders\n` +
                `/active — Confirmed orders\n` +
                `/finished — Finished (paid) orders\n` +
                `/confirm HB-xxxx — Confirm order\n` +
                `/cancel HB-xxxx — Cancel order\n\n` +
                `<b>Pricing & Payment:</b>\n` +
                `/price HB-xxxx 1500 — Set selling price\n` +
                `/paid HB-xxxx — Mark as paid\n` +
                `/paid — List all paid orders\n` +
                `/notpaid — List all unpaid orders\n` +
                `/seeprice — View cost breakdown for orders\n\n` +
                `<b>Ingredient Costs:</b>\n` +
                `/addingredient — Add ingredient to order\n` +
                `/updateingredient — Update ingredient quantity\n` +
                `/deleteingredient — Delete ingredient from order\n` +
                `/items — View all ingredients\n` +
                `/newitem flour 45 kg — Add ingredient to DB\n` +
                `/addcost HB-xxxx flour 500g — Quick add cost\n` +
                `/costs HB-xxxx — View order costs\n\n` +
                `💡 <i>New orders arrive with buttons — just tap!</i>`,
                chatId
            );
        }

        res.status(200).json({ ok: true });
    } catch (err) {
        console.error("Webhook error:", err);
        res.status(200).json({ ok: true });
    }
});

// ─── Callback Query Handler ──────────────────────────────────────────────────

async function handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    const allowedIds = (process.env.TELEGRAM_ALLOWED_CHAT_ID || "").split(",").map(id => id.trim());
    if (!allowedIds.includes(chatId.toString())) return;

    if (data === "noop") {
        await answerCallback(query.id);
        return;
    }

    if (data.startsWith("confirm:")) {
        const orderId = data.split(":")[1];
        await updateOrderStatus(orderId, "confirmed");
        await answerCallback(query.id, `✅ ${orderId} confirmed!`);

        const buttons = [
            [
                { text: "💰 Set Price", callback_data: `promptprice:${orderId}` },
                { text: "💵 Mark Paid", callback_data: `paid:${orderId}` },
            ],
            [
                { text: "📦 Add Ingredient", callback_data: `addingord:${orderId}` },
                { text: "📊 View Costs", callback_data: `viewcosts:${orderId}` },
            ],
            [
                { text: "❌ Cancel", callback_data: `status:${orderId}:cancelled` },
            ],
        ];
        await editMessageButtons(chatId, messageId, buttons);

    } else if (data.startsWith("status:")) {
        const parts = data.split(":");
        const orderId = parts[1];
        const newStatus = parts[2];
        await updateOrderStatus(orderId, newStatus);
        await answerCallback(query.id, `${STATUS_EMOJI[newStatus] || "📝"} ${orderId} → ${newStatus}`);

        if (newStatus === "cancelled") {
            await editMessageButtons(chatId, messageId, [
                [{ text: "❌ Cancelled", callback_data: "noop" }],
            ]);
        }

    } else if (data.startsWith("paid:")) {
        const orderId = data.split(":")[1];
        await db.collection("orders").doc(orderId).update({
            paymentStatus: "paid",
            status: "finished",
            paidAt: admin.firestore.Timestamp.now(),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
                status: "finished",
                timestamp: admin.firestore.Timestamp.now(),
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await answerCallback(query.id, `💵 ${orderId} PAID & moved to finished`);

    } else if (data.startsWith("promptprice:")) {
        const orderId = data.split(":")[1];
        pendingAddCost.set(chatId.toString(), { type: "setprice", orderId });
        await sendTelegramMessage(
            `💰 <b>Set price for ${orderId}</b>\n\nJust type the amount:\n<i>Example: 1500</i>`,
            chatId
        );
        await answerCallback(query.id);

    } else if (data.startsWith("viewcosts:")) {
        const orderId = data.split(":")[1];
        await handleViewCosts(orderId, chatId);
        await answerCallback(query.id);

    } else if (data.startsWith("seeprice:")) {
        const orderId = data.split(":")[1];
        await handleSeePriceDetail(orderId, chatId);
        await answerCallback(query.id);

    } else if (data.startsWith("addingord:")) {
        const orderId = data.split(":")[1];
        await handleAddIngredientShowIngredients(orderId, chatId);
        await answerCallback(query.id);

    } else if (data.startsWith("addinging:")) {
        const parts = data.split(":");
        const orderId = parts[1];
        const ingredientDocId = parts[2];
        await handleAddIngredientSelectIngredient(orderId, ingredientDocId, chatId);
        await answerCallback(query.id);

    } else if (data.startsWith("addingnew:")) {
        const orderId = data.split(":")[1];
        pendingAddCost.set(chatId.toString(), { type: "newitem", orderId });
        await sendTelegramMessage(
            `<b>➕ Add New Ingredient</b>\n\n` +
            `Type the ingredient details:\n` +
            `<b>Format:</b> name price unit\n` +
            `<b>Example:</b> chocolate 100 kg\n\n` +
            `<i>Units: kg, liter, piece</i>`,
            chatId
        );
        await answerCallback(query.id);

    } else if (data.startsWith("editcostord:")) {
        const parts = data.split(":");
        const action = parts[1]; // "u" or "d"
        const orderId = parts[2];
        await handleEditCostShowItems(orderId, action, chatId);
        await answerCallback(query.id);

    } else if (data.startsWith("editcost:")) {
        const parts = data.split(":");
        const action = parts[1]; // "u" or "d"
        const orderId = parts[2];
        const costIndex = parseInt(parts[3]);

        if (action === "d") {
            // Delete flow — remove cost item immediately
            const orderSnap = await db.collection("orders").doc(orderId).get();
            const order = orderSnap.data();
            if (!order) {
                await answerCallback(query.id, "Order not found");
                return;
            }
            const costs = order.costs || [];
            if (costIndex < 0 || costIndex >= costs.length) {
                await answerCallback(query.id, "Item not found");
                return;
            }
            const removed = costs[costIndex];
            const updatedCosts = costs.filter((_, i) => i !== costIndex);
            const newTotalCost = updatedCosts.reduce((sum, c) => sum + c.totalCost, 0);
            await db.collection("orders").doc(orderId).update({
                costs: updatedCosts,
                totalCost: Math.round(newTotalCost * 100) / 100,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await sendTelegramMessage(
                `✅ Deleted <b>${removed.name}</b> (${removed.quantity}${removed.unit} = Rs ${removed.totalCost.toFixed(2)}) from <b>${orderId}</b>`,
                chatId
            );
            // Re-show updated list
            await handleEditCostShowItems(orderId, "d", chatId);
            await answerCallback(query.id);
        } else {
            // Update flow — ask for new quantity
            const orderSnap = await db.collection("orders").doc(orderId).get();
            const order = orderSnap.data();
            if (!order) {
                await answerCallback(query.id, "Order not found");
                return;
            }
            const costs = order.costs || [];
            if (costIndex < 0 || costIndex >= costs.length) {
                await answerCallback(query.id, "Item not found");
                return;
            }
            const item = costs[costIndex];
            const baseUnit = Object.entries({ kg: "g", liter: "ml" }).find(([, v]) => v === item.unit)?.[0] || item.unit;
            const subUnitHint = baseUnit === "kg" ? "500g, 1.5kg"
                : baseUnit === "liter" ? "200ml, 1.5l"
                : "3pcs";

            pendingAddCost.set(chatId.toString(), {
                type: "updateqty",
                orderId,
                costIndex,
                ingredientName: item.name,
                pricePerUnit: item.pricePerUnit,
                unit: baseUnit,
                oldQuantity: item.quantity,
                oldUnit: item.unit,
                oldTotalCost: item.totalCost,
            });

            await sendTelegramMessage(
                `<b>✏️ Updating ${item.name} on ${orderId}</b>\n` +
                `Current: ${item.quantity}${item.unit} = Rs ${item.totalCost.toFixed(2)}\n` +
                `Price: Rs ${item.pricePerUnit}/${baseUnit}\n\n` +
                `Type new quantity (e.g. ${subUnitHint}):`,
                chatId
            );
            await answerCallback(query.id);
        }

    } else if (data.startsWith("manage:")) {
        const orderId = data.split(":")[1];
        const orderSnap = await db.collection("orders").doc(orderId).get();
        const order = orderSnap.data();
        if (!order) {
            await answerCallback(query.id, "Order not found");
            return;
        }

        const buttons = [];
        if (order.status === "pending") {
            buttons.push([
                { text: "✅ Confirm", callback_data: `confirm:${orderId}` },
                { text: "❌ Cancel", callback_data: `status:${orderId}:cancelled` },
            ]);
        } else if (order.status === "confirmed") {
            buttons.push([
                { text: "💰 Set Price", callback_data: `promptprice:${orderId}` },
                { text: "💵 Mark Paid", callback_data: `paid:${orderId}` },
            ]);
            buttons.push([
                { text: "📦 Add Ingredient", callback_data: `addingord:${orderId}` },
                { text: "📊 View Costs", callback_data: `viewcosts:${orderId}` },
            ]);
            buttons.push([
                { text: "❌ Cancel", callback_data: `status:${orderId}:cancelled` },
            ]);
        }

        const paymentBadge = order.paymentStatus === "paid" ? "💵 Paid" : "🔴 Unpaid";
        const priceLine = order.sellingPrice ? `Rs ${order.sellingPrice}` : "Not set";
        const orderMakingCharge = order.makingCharge || 0;
        const orderTotalCost = (order.totalCost || 0) + orderMakingCharge;

        const msg = `<b>📋 ${orderId}</b>\n` +
            `${order.customerName} — ${order.weight} ${order.flavour}\n` +
            `Status: ${STATUS_EMOJI[order.status] || "📝"} <b>${order.status}</b>\n` +
            `Price: ${priceLine} | ${paymentBadge}\n` +
            `Cost: Rs ${orderTotalCost.toFixed(2)}`;

        await sendTelegramMessage(msg, chatId, buttons.length > 0 ? buttons : undefined);
        await answerCallback(query.id);
    }
}

// ─── /addcost Handler ────────────────────────────────────────────────────────

async function handleAddCost(text, chatId) {
    const parts = text.split(" ");
    if (parts.length < 4) {
        await sendTelegramMessage(
            "Usage: /addcost HB-xxxx flour 500g\nOr: /addcost HB-xxxx flour 500g 80",
            chatId
        );
        return;
    }

    const orderId = parts[1];
    const itemName = parts[2].toLowerCase();
    const qtyStr = parts[3];
    const manualPrice = parts[4] ? parseFloat(parts[4]) : null;

    const parsed = parseQuantity(qtyStr);
    if (!parsed) {
        await sendTelegramMessage(
            "Invalid quantity. Use: 500g, 1.5kg, 200ml, 2l, 3pcs\nExample: /addcost HB-xxxx flour 500g",
            chatId
        );
        return;
    }

    // Manual price override
    if (manualPrice !== null && !isNaN(manualPrice)) {
        const costItem = {
            name: itemName,
            quantity: parsed.value,
            unit: parsed.unit,
            pricePerUnit: Math.round((manualPrice / parsed.value) * 100) / 100,
            totalCost: manualPrice,
        };
        await addCostToOrder(orderId, costItem);
        await sendTelegramMessage(
            `✅ Added to ${orderId}:\n${itemName} — ${qtyStr} = Rs ${manualPrice}`,
            chatId
        );
        return;
    }

    // Look up ingredient by name (query, not doc ID)
    const ingredientSnap = await db
        .collection("ingredients")
        .where("name", "==", itemName)
        .limit(1)
        .get();

    if (ingredientSnap.empty) {
        await sendTelegramMessage(
            `❓ <b>${itemName}</b> not in ingredient list.\n\n` +
            `Add it: /newitem ${itemName} [price] [unit]\n` +
            `Example: /newitem ${itemName} 45 kg\n\n` +
            `Or set manual cost: /addcost ${orderId} ${itemName} ${qtyStr} [total_cost]`,
            chatId
        );
        return;
    }

    const ingredient = ingredientSnap.docs[0].data();
    const pricePerUnit = ingredient.pricePerUnit;
    const unit = ingredient.unit;

    const baseQty = convertToBaseUnit(parsed.value, parsed.unit, unit);
    if (baseQty === null) {
        await sendTelegramMessage(
            `Cannot convert ${parsed.unit} to ${unit}. Use manual price:\n/addcost ${orderId} ${itemName} ${qtyStr} [total_cost]`,
            chatId
        );
        return;
    }

    const totalCost = Math.round(baseQty * pricePerUnit * 100) / 100;
    const costItem = {
        name: itemName,
        quantity: parsed.value,
        unit: parsed.unit,
        pricePerUnit,
        totalCost,
    };

    await addCostToOrder(orderId, costItem);
    await sendTelegramMessage(
        `✅ Added to ${orderId}:\n${itemName} — ${qtyStr} @ Rs ${pricePerUnit}/${unit} = <b>Rs ${totalCost}</b>`,
        chatId
    );
}

// ─── /newitem Handler ────────────────────────────────────────────────────────

async function handleNewItem(text, chatId) {
    const parts = text.split(" ");
    if (parts.length < 4) {
        await sendTelegramMessage("Usage: /newitem flour 45 kg\nUnits: kg, liter, piece", chatId);
        return;
    }

    const name = parts[1].toLowerCase();
    const price = parseFloat(parts[2]);
    const unit = parts[3].toLowerCase();

    if (isNaN(price) || price <= 0) {
        await sendTelegramMessage("Price must be a positive number.", chatId);
        return;
    }

    // Use addDoc for auto-ID (matches admin panel IngredientsPanel)
    await db.collection("ingredients").add({
        name,
        pricePerUnit: price,
        unit,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendTelegramMessage(
        `✅ Added ingredient: <b>${name}</b> — Rs ${price}/${unit}`,
        chatId
    );
}

// ─── /items Handler ──────────────────────────────────────────────────────────

async function handleListItems(chatId) {
    const snap = await db.collection("ingredients").orderBy("name", "asc").get();

    if (snap.empty) {
        await sendTelegramMessage("No ingredients in price list.\nAdd one: /newitem flour 45 kg", chatId);
        return;
    }

    let msg = "<b>📋 Ingredient Price List</b>\n\n";
    snap.docs.forEach((d) => {
        const item = d.data();
        msg += `• <b>${item.name}</b> — Rs ${item.pricePerUnit}/${item.unit}\n`;
    });

    await sendTelegramMessage(msg, chatId);
}

// ─── /costs Handler ──────────────────────────────────────────────────────────

async function handleViewCosts(orderId, chatId) {
    const orderSnap = await db.collection("orders").doc(orderId).get();
    const order = orderSnap.data();
    if (!order) {
        await sendTelegramMessage("Order not found.", chatId);
        return;
    }

    const costs = order.costs || [];
    const makingCharge = order.makingCharge || 0;
    const ingredientTotal = order.totalCost || 0;
    const totalCost = ingredientTotal + makingCharge;

    if (costs.length === 0 && makingCharge === 0) {
        await sendTelegramMessage(
            `<b>📊 ${orderId} — Costs</b>\n\nNo costs added yet.\nAdd: /addcost ${orderId} flour 500g`,
            chatId
        );
        return;
    }

    let msg = `<b>📊 ${orderId} — Cost Breakdown</b>\n\n`;

    if (costs.length > 0) {
        msg += `<b>📦 Ingredients:</b>\n`;
        costs.forEach((c) => {
            msg += `• ${c.name}: ${c.quantity} ${c.unit} = Rs ${c.totalCost.toFixed(2)}\n`;
        });
        msg += `\nIngredients Total: Rs ${ingredientTotal.toFixed(2)}\n`;
    }

    if (makingCharge > 0) {
        msg += `Making Charge: Rs ${makingCharge.toFixed(2)}\n`;
    }

    msg += `──────────\n`;
    msg += `<b>Total Cost:</b> Rs ${totalCost.toFixed(2)}\n`;

    if (order.sellingPrice) {
        const profit = order.sellingPrice - totalCost;
        msg += `<b>Selling Price:</b> Rs ${order.sellingPrice}\n`;
        msg += `<b>Profit:</b> Rs ${profit.toFixed(2)} ${profit >= 0 ? "📈" : "📉"}`;
    }

    const paymentBadge = order.paymentStatus === "paid" ? "💵 Paid" : "🔴 Unpaid";
    msg += `\n<b>Payment:</b> ${paymentBadge}`;

    await sendTelegramMessage(msg, chatId);
}

// ─── /seeprice Handler ───────────────────────────────────────────────────────

async function handleSeePriceList(chatId) {
    const orders = await db
        .collection("orders")
        .where("status", "in", ["pending", "confirmed"])
        .limit(15)
        .get();

    if (orders.empty) {
        await sendTelegramMessage("No active orders found.", chatId);
        return;
    }

    const buttons = orders.docs.map((d) => {
        const o = d.data();
        const costTotal = (o.totalCost || 0) + (o.makingCharge || 0);
        const priceLine = o.sellingPrice ? `Rs ${o.sellingPrice}` : "No price";
        return [{
            text: `${d.id} — ${o.customerName} (${priceLine} | Cost: Rs ${costTotal.toFixed(0)})`,
            callback_data: `seeprice:${d.id}`,
        }];
    });

    await sendTelegramMessage(
        `<b>💰 See Price — Select an order:</b>`,
        chatId,
        buttons
    );
}

async function handleSeePriceDetail(orderId, chatId) {
    const orderSnap = await db.collection("orders").doc(orderId).get();
    const order = orderSnap.data();
    if (!order) {
        await sendTelegramMessage("Order not found.", chatId);
        return;
    }

    const costs = order.costs || [];
    const makingCharge = order.makingCharge || 0;
    const ingredientTotal = order.totalCost || 0;
    const totalCost = ingredientTotal + makingCharge;

    let msg = `<b>📊 ${orderId} — Cost Breakdown</b>\n\n`;
    msg += `<b>🎂 Customer:</b> ${order.customerName} — ${order.weight} ${order.flavour}\n\n`;

    if (costs.length > 0) {
        msg += `<b>📦 Ingredients:</b>\n`;
        costs.forEach((c) => {
            msg += `• ${c.name}: ${c.quantity} ${c.unit} = Rs ${c.totalCost.toFixed(2)}\n`;
        });
        msg += `\nIngredients Total: Rs ${ingredientTotal.toFixed(2)}\n`;
    } else {
        msg += `<b>📦 Ingredients:</b> None added\n\n`;
    }

    if (makingCharge > 0) {
        msg += `Making Charge: Rs ${makingCharge.toFixed(2)}\n`;
    }

    msg += `──────────\n`;
    msg += `<b>Total Cost:</b> Rs ${totalCost.toFixed(2)}\n`;

    if (order.sellingPrice) {
        const profit = order.sellingPrice - totalCost;
        msg += `<b>Selling Price:</b> Rs ${order.sellingPrice}\n`;
        msg += `<b>Profit:</b> Rs ${profit.toFixed(2)} ${profit >= 0 ? "📈" : "📉"}\n`;
    } else {
        msg += `<b>Selling Price:</b> Not set\n`;
    }

    const paymentBadge = order.paymentStatus === "paid" ? "💵 Paid" : "🔴 Unpaid";
    msg += `\n<b>Payment:</b> ${paymentBadge}`;

    const buttons = costs.length > 0 ? [
        [
            { text: "✏️ Update Ingredient", callback_data: `editcostord:u:${orderId}` },
            { text: "🗑 Delete Ingredient", callback_data: `editcostord:d:${orderId}` },
        ],
    ] : undefined;

    await sendTelegramMessage(msg, chatId, buttons);
}

// ─── /addingredient Handlers ─────────────────────────────────────────────────

async function handleAddIngredientStart(chatId) {
    const orders = await db
        .collection("orders")
        .where("status", "in", ["pending", "confirmed"])
        .limit(15)
        .get();

    if (orders.empty) {
        await sendTelegramMessage("No active orders found.", chatId);
        return;
    }

    const buttons = orders.docs.map((d) => {
        const o = d.data();
        return [{
            text: `${d.id} — ${o.customerName} (${o.weight} ${o.flavour})`,
            callback_data: `addingord:${d.id}`,
        }];
    });

    await sendTelegramMessage(
        `<b>📦 Add Ingredient — Select an order:</b>`,
        chatId,
        buttons
    );
}

async function handleAddIngredientShowIngredients(orderId, chatId) {
    // Search-first approach: ask user to type ingredient name
    pendingAddCost.set(chatId.toString(), { type: "search", orderId });

    await sendTelegramMessage(
        `<b>📦 ${orderId}</b>\n\n` +
        `Type the ingredient name (or part of it):\n` +
        `<i>Example: choc, flour, sugar</i>\n\n` +
        `Or type <b>all</b> to see all ingredients`,
        chatId,
        [[{ text: "➕ Add New Ingredient", callback_data: `addingnew:${orderId}` }]]
    );
}

async function handleIngredientSearch(chatId, text, pending) {
    pendingAddCost.delete(chatId.toString());
    const searchTerm = text.trim().toLowerCase();

    const snap = await db.collection("ingredients").orderBy("name", "asc").get();

    const matches = searchTerm === "all"
        ? snap.docs
        : snap.docs.filter((d) => d.data().name.toLowerCase().includes(searchTerm));

    if (matches.length === 0) {
        await sendTelegramMessage(
            `No ingredients matching "<b>${searchTerm}</b>".\n\n` +
            `Try again or add a new one:`,
            chatId,
            [
                [{ text: "🔍 Search Again", callback_data: `addingord:${pending.orderId}` }],
                [{ text: "➕ Add New Ingredient", callback_data: `addingnew:${pending.orderId}` }],
            ]
        );
        return;
    }

    const buttons = matches.slice(0, 15).map((d) => {
        const item = d.data();
        return [{
            text: `${item.name} — Rs ${item.pricePerUnit}/${item.unit}`,
            callback_data: `addinging:${pending.orderId}:${d.id}`,
        }];
    });

    // Add utility buttons at the end
    buttons.push([
        { text: "🔍 Search Again", callback_data: `addingord:${pending.orderId}` },
        { text: "➕ Add New", callback_data: `addingnew:${pending.orderId}` },
    ]);

    const countNote = matches.length > 15 ? ` (showing first 15 of ${matches.length})` : "";
    await sendTelegramMessage(
        `<b>📦 ${pending.orderId}</b> — Results for "<b>${searchTerm}</b>"${countNote}:`,
        chatId,
        buttons
    );
}

async function handleAddIngredientSelectIngredient(orderId, ingredientDocId, chatId) {
    const ingredientSnap = await db.collection("ingredients").doc(ingredientDocId).get();
    if (!ingredientSnap.exists) {
        await sendTelegramMessage("Ingredient not found.", chatId);
        return;
    }

    const ingredient = ingredientSnap.data();
    pendingAddCost.set(chatId.toString(), {
        type: "quantity",
        orderId,
        ingredientName: ingredient.name,
        pricePerUnit: ingredient.pricePerUnit,
        unit: ingredient.unit,
    });

    const subUnitHint = ingredient.unit === "kg" ? "500g, 1.5kg"
        : ingredient.unit === "liter" ? "200ml, 1.5l"
        : "3pcs";

    await sendTelegramMessage(
        `<b>📦 Adding ${ingredient.name} to ${orderId}</b>\n` +
        `Price: Rs ${ingredient.pricePerUnit}/${ingredient.unit}\n\n` +
        `Type the quantity (e.g. ${subUnitHint}):`,
        chatId
    );
}

async function handleAddIngredientQuantity(chatId, text, pending) {
    pendingAddCost.delete(chatId.toString());

    const parsed = parseQuantity(text.trim());
    if (!parsed) {
        await sendTelegramMessage(
            `Invalid quantity. Use formats like: 500g, 1.5kg, 200ml, 2l, 3pcs\nTry /addingredient again.`,
            chatId
        );
        return;
    }

    const baseQty = convertToBaseUnit(parsed.value, parsed.unit, pending.unit);
    if (baseQty === null) {
        await sendTelegramMessage(
            `Cannot convert ${parsed.unit} to ${pending.unit}.\nTry /addingredient again.`,
            chatId
        );
        return;
    }

    const totalCost = Math.round(baseQty * pending.pricePerUnit * 100) / 100;
    const costItem = {
        name: pending.ingredientName,
        quantity: parsed.value,
        unit: parsed.unit,
        pricePerUnit: pending.pricePerUnit,
        totalCost,
    };

    await addCostToOrder(pending.orderId, costItem);
    await sendTelegramMessage(
        `✅ Added to <b>${pending.orderId}</b>:\n` +
        `${pending.ingredientName} — ${parsed.value}${parsed.unit} @ Rs ${pending.pricePerUnit}/${pending.unit} = <b>Rs ${totalCost}</b>`,
        chatId
    );
}

async function handleAddNewIngredientInline(chatId, text, pending) {
    pendingAddCost.delete(chatId.toString());

    const parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
        await sendTelegramMessage(
            `Invalid format. Use: <b>name price unit</b>\nExample: chocolate 100 kg\n\nTry /addingredient again.`,
            chatId
        );
        return;
    }

    const name = parts[0].toLowerCase();
    const price = parseFloat(parts[1]);
    const unit = parts[2].toLowerCase();

    if (isNaN(price) || price <= 0) {
        await sendTelegramMessage("Price must be a positive number.\nTry /addingredient again.", chatId);
        return;
    }

    if (!["kg", "liter", "piece"].includes(unit)) {
        await sendTelegramMessage("Unit must be: kg, liter, or piece.\nTry /addingredient again.", chatId);
        return;
    }

    await db.collection("ingredients").add({
        name,
        pricePerUnit: price,
        unit,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendTelegramMessage(
        `✅ Added ingredient: <b>${name}</b> — Rs ${price}/${unit}\n\nNow select it from the list:`,
        chatId
    );

    // Re-show the ingredient list for the same order
    await handleAddIngredientShowIngredients(pending.orderId, chatId);
}

// ─── Update/Delete Cost Handlers ────────────────────────────────────────────

async function handleEditCostStart(chatId, action) {
    const orders = await db
        .collection("orders")
        .where("status", "in", ["pending", "confirmed"])
        .limit(15)
        .get();

    if (orders.empty) {
        await sendTelegramMessage("No active orders found.", chatId);
        return;
    }

    const title = action === "d" ? "🗑 Delete Ingredient" : "✏️ Update Ingredient";
    const buttons = orders.docs.map((d) => {
        const o = d.data();
        return [{
            text: `${d.id} — ${o.customerName} (${o.weight} ${o.flavour})`,
            callback_data: `editcostord:${action}:${d.id}`,
        }];
    });

    await sendTelegramMessage(
        `<b>${title} — Select an order:</b>`,
        chatId,
        buttons
    );
}

async function handleEditCostShowItems(orderId, action, chatId) {
    const orderSnap = await db.collection("orders").doc(orderId).get();
    const order = orderSnap.data();
    if (!order) {
        await sendTelegramMessage("Order not found.", chatId);
        return;
    }

    const costs = order.costs || [];
    if (costs.length === 0) {
        await sendTelegramMessage(
            `<b>${orderId}</b> has no ingredients added yet.`,
            chatId
        );
        return;
    }

    const title = action === "d" ? "🗑 Delete Ingredient" : "✏️ Update Ingredient";
    const buttons = costs.map((c, i) => [{
        text: `${i + 1}. ${c.name} — ${c.quantity}${c.unit} = Rs ${c.totalCost.toFixed(2)}`,
        callback_data: `editcost:${action}:${orderId}:${i}`,
    }]);

    await sendTelegramMessage(
        `<b>${title} — ${orderId}</b>\n\nSelect an ingredient:`,
        chatId,
        buttons
    );
}

async function handleUpdateCostQuantity(chatId, text, pending) {
    pendingAddCost.delete(chatId.toString());

    const parsed = parseQuantity(text.trim());
    if (!parsed) {
        await sendTelegramMessage(
            `Invalid quantity. Use formats like: 500g, 1.5kg, 200ml, 2l, 3pcs\nTry /updateingredient again.`,
            chatId
        );
        return;
    }

    const baseQty = convertToBaseUnit(parsed.value, parsed.unit, pending.unit);
    if (baseQty === null) {
        await sendTelegramMessage(
            `Cannot convert ${parsed.unit} to ${pending.unit}.\nTry /updateingredient again.`,
            chatId
        );
        return;
    }

    const newTotalCost = Math.round(baseQty * pending.pricePerUnit * 100) / 100;

    // Fetch order and update the specific cost item
    const orderRef = db.collection("orders").doc(pending.orderId);
    const orderSnap = await orderRef.get();
    const order = orderSnap.data();
    const costs = order.costs || [];

    if (pending.costIndex < 0 || pending.costIndex >= costs.length) {
        await sendTelegramMessage("Cost item no longer exists.\nTry /updateingredient again.", chatId);
        return;
    }

    costs[pending.costIndex] = {
        ...costs[pending.costIndex],
        quantity: parsed.value,
        unit: parsed.unit,
        totalCost: newTotalCost,
    };

    const orderTotalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);
    await orderRef.update({
        costs,
        totalCost: Math.round(orderTotalCost * 100) / 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendTelegramMessage(
        `✅ Updated <b>${pending.ingredientName}</b> on <b>${pending.orderId}</b>:\n` +
        `${pending.oldQuantity}${pending.oldUnit} → ${parsed.value}${parsed.unit}\n` +
        `Rs ${pending.oldTotalCost.toFixed(2)} → <b>Rs ${newTotalCost.toFixed(2)}</b>`,
        chatId
    );
}

// ─── Set Price Handler ───────────────────────────────────────────────────────

async function handleSetPriceInput(chatId, text, pending) {
    pendingAddCost.delete(chatId.toString());

    const price = parseFloat(text.trim());
    if (isNaN(price) || price <= 0) {
        await sendTelegramMessage(
            `Invalid price. Please type a number.\nExample: 1500\n\nOr use: /price ${pending.orderId} 1500`,
            chatId
        );
        return;
    }

    await db.collection("orders").doc(pending.orderId).update({
        sellingPrice: price,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendTelegramMessage(`💰 <b>${pending.orderId}</b> price set to <b>Rs ${price}</b>`, chatId);
}

// ─── Utility Functions ───────────────────────────────────────────────────────

async function addCostToOrder(orderId, costItem) {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    const order = orderSnap.data();
    const currentCosts = order.costs || [];
    const newCosts = [...currentCosts, costItem];
    const newTotalCost = newCosts.reduce((sum, c) => sum + c.totalCost, 0);

    await orderRef.update({
        costs: newCosts,
        totalCost: Math.round(newTotalCost * 100) / 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function sendOrderList(chatId, status, title) {
    const orders = await db
        .collection("orders")
        .where("status", "==", status)
        .limit(10)
        .get();

    if (orders.empty) {
        await sendTelegramMessage(`${title}\n\nNo orders found.`, chatId);
        return;
    }

    const buttons = orders.docs.map((d) => {
        const o = d.data();
        const payBadge = o.paymentStatus === "paid" ? "💵" : "🔴";
        return [{
            text: `${payBadge} ${d.id} — ${o.customerName} (${o.weight} ${o.flavour})`,
            callback_data: `manage:${d.id}`,
        }];
    });

    await sendTelegramMessage(`<b>${title}</b>\n\nTap an order to manage:`, chatId, buttons);
}

async function sendPaymentList(chatId, paymentStatus, title) {
    const orders = await db
        .collection("orders")
        .where("status", "in", ["pending", "confirmed"])
        .limit(15)
        .get();

    const filtered = orders.docs.filter((d) => {
        const o = d.data();
        return paymentStatus === "paid"
            ? o.paymentStatus === "paid"
            : o.paymentStatus !== "paid";
    });

    if (filtered.length === 0) {
        await sendTelegramMessage(`<b>${title}</b>\n\nNo orders found.`, chatId);
        return;
    }

    const buttons = filtered.map((d) => {
        const o = d.data();
        const priceLine = o.sellingPrice ? `Rs ${o.sellingPrice}` : "No price";
        return [{
            text: `${d.id} — ${o.customerName} (${priceLine})`,
            callback_data: `manage:${d.id}`,
        }];
    });

    await sendTelegramMessage(`<b>${title}</b>\n\n${filtered.length} order(s):`, chatId, buttons);
}

function parseQuantity(str) {
    const match = str.match(/^(\d+\.?\d*)\s*(g|gm|gram|grams|kg|ml|liter|litre|l|pcs|piece|pieces)$/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    let unit = match[2].toLowerCase();

    if (["g", "gm", "gram", "grams"].includes(unit)) unit = "g";
    else if (unit === "kg") unit = "kg";
    else if (unit === "ml") unit = "ml";
    else if (["l", "liter", "litre"].includes(unit)) unit = "liter";
    else if (["pcs", "piece", "pieces"].includes(unit)) unit = "piece";

    return { value, unit };
}

function convertToBaseUnit(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === "g" && toUnit === "kg") return value / 1000;
    if (fromUnit === "kg" && toUnit === "kg") return value;
    if (fromUnit === "ml" && toUnit === "liter") return value / 1000;
    if (fromUnit === "liter" && toUnit === "liter") return value;
    if (fromUnit === "piece" && toUnit === "piece") return value;
    return null;
}

async function updateOrderStatus(orderId, status) {
    await db.collection("orders").doc(orderId).update({
        status,
        statusHistory: admin.firestore.FieldValue.arrayUnion({
            status,
            timestamp: admin.firestore.Timestamp.now(),
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function editMessageButtons(chatId, messageId, buttons) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: buttons },
        }),
    });
}

async function answerCallback(callbackQueryId, text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: text || "",
            show_alert: !!text,
        }),
    });
}

async function sendTelegramMessage(text, chatId, inlineKeyboard) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    // If no specific chatId, broadcast to all allowed IDs
    if (!chatId) {
        const allIds = (process.env.TELEGRAM_ALLOWED_CHAT_ID || "").split(",").map(id => id.trim()).filter(Boolean);
        for (const id of allIds) {
            await sendTelegramMessage(text, id, inlineKeyboard);
        }
        return;
    }

    const body = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
    };
    if (inlineKeyboard) {
        body.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
    }
}

// ─── Weekly Unpaid Order Reminder ────────────────────────────────────────────
// Runs every Monday at 10:00 AM IST (4:30 AM UTC)
exports.weeklyUnpaidReminder = onSchedule(
    { schedule: "every monday 04:30", timeZone: "Asia/Kolkata" },
    async () => {
        const orders = await db
            .collection("orders")
            .where("status", "in", ["pending", "confirmed"])
            .get();

        const unpaid = orders.docs.filter((d) => d.data().paymentStatus !== "paid");

        if (unpaid.length === 0) return;

        let msg = `<b>🔔 Weekly Unpaid Orders Reminder</b>\n\n`;
        msg += `You have <b>${unpaid.length}</b> unpaid order(s):\n\n`;

        unpaid.forEach((d) => {
            const o = d.data();
            const priceLine = o.sellingPrice ? `Rs ${o.sellingPrice}` : "No price set";
            const statusIcon = STATUS_EMOJI[o.status] || "📝";
            msg += `${statusIcon} <b>${d.id}</b> — ${o.customerName}\n`;
            msg += `   ${o.weight} ${o.flavour} | ${priceLine}\n`;
            if (o.requestedDate) {
                msg += `   📅 ${o.requestedDate}\n`;
            }
            msg += `\n`;
        });

        msg += `Use /notpaid to manage these orders.`;

        await sendTelegramMessage(msg);
    }
);

function formatTelegramMessage(order) {
    return `<b>📦 New Order: ${order.orderId}</b>

<b>Customer:</b> ${order.customerName}
<b>Contact:</b> ${order.customerEmail}
<b>Phone:</b> ${order.customerPhone}

<b>🎂 Cake:</b> ${order.weight} ${order.flavour}${order.eggless ? " (Eggless)" : ""}
<b>📅 Date:</b> ${order.requestedDate} at ${order.requestedTime}
<b>🚗 Delivery:</b> ${order.deliveryType === "deliver" ? `Home Delivery to ${order.deliveryAddress}` : "Pickup"}
${order.messageOnCake ? `<b>💬 Message:</b> "${order.messageOnCake}"` : ""}
${order.specialInstructions ? `<b>✨ Special Instructions:</b> ${order.specialInstructions}` : ""}`;
}
