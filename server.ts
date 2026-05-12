import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

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
          order_description: order_description || "Payment via NOWPayments",
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
