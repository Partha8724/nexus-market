import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API Route for creating a NOWPayments invoice
  app.post("/api/create-nowpayments-invoice", async (req, res) => {
    console.log("Received NOWPayments invoice request:", req.body);
    try {
      const { amount, currency = "usd", order_id, order_description, apiKey } = req.body;
      const finalApiKey = apiKey || process.env.NOWPAYMENTS_API_KEY;

      if (!finalApiKey) {
        console.warn("NOWPayments: No API key provided.");
        return res.status(400).json({ error: "No NOWPayments API key provided." });
      }

      console.log(`Creating invoice for ${amount} ${currency}...`);
      const response = await fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "x-api-key": finalApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: currency,
          order_id: order_id || "Order_" + Date.now(),
          order_description: order_description || "Payment via NEXUS Protocol",
          success_url: req.headers.origin ? `${req.headers.origin}/?success=true` : undefined,
          cancel_url: req.headers.origin ? `${req.headers.origin}/?cancel=true` : undefined,
        })
      });

      const data = await response.json();
      console.log("NOWPayments API response status:", response.status);
      
      if (!response.ok) {
         console.error("NOWPayments API error:", data);
         throw new Error(data.message || "Failed to create NOWPayments invoice");
      }

      res.json(data);
    } catch (error: any) {
      console.error("NOWPayments error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // NEW: NOWPayments Webhook Handler for Fully Automatic Fulfillment
  app.post("/api/nowpayments-webhook", async (req, res) => {
    const signature = req.headers["x-nowpayments-sig"];
    const payload = req.body;

    console.log("Received NOWPayments Webhook Notification:", payload.payment_status);

    // Optional: Verify signature if secret is provided in env
    // This is skipped for now but recommended in production logic

    try {
      const { order_id, payment_status, purchase_id } = payload;

      if (payment_status === "finished") {
        console.log(`Payment confirmed for Order ID: ${order_id}. Initiating fulfillment...`);
        
        // Parse custom order_id format: TYPE:USER_ID:RESOURCE_ID:UUID
        const parts = order_id.split(":");
        if (parts.length >= 3) {
          const type = parts[0];
          const userId = parts[1];
          const resourceId = parts[2];

          if (type === "PROD") {
            // Fulfill Marketplace Product Purchase
            const orderRef = db.collection("orders").doc(`order_${purchase_id || Date.now()}`);
            await orderRef.set({
              id: orderRef.id,
              product_id: resourceId,
              buyer_id: userId,
              status: "completed",
              amount: payload.actually_paid || 0,
              created_at: new Date().toISOString(),
              payment_provider: "nowpayments",
              external_id: purchase_id
            });
            console.log(`Product ${resourceId} fulfilled for user ${userId}`);
          } 
          else if (type === "SUB") {
            // Fulfill Subscription Upgrade
            const profileRef = db.collection("profiles").doc(userId);
            await profileRef.update({
              subscription_plan: resourceId // e.g. pro, premium
            });
            console.log(`Subscription ${resourceId} activated for user ${userId}`);
          }
          else if (type === "JOB") {
            // Fulfill Job Application Payment
            const appRef = db.collection("job_applications").doc(resourceId);
            await appRef.update({
              status: "paid"
            });
            console.log(`Job application ${resourceId} marked as PAID`);
          }
        } else {
          console.warn("Unknown Order ID format, fulfilling generic order record.");
          const orderRef = db.collection("orders").doc(`generic_${Date.now()}`);
          await orderRef.set({
            status: "completed",
            order_id: order_id,
            payment_status: payment_status,
            created_at: new Date().toISOString()
          });
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook Fulfillment Error:", error);
      res.status(500).send("Fulfillment Error");
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
