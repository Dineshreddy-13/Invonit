import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import { connectDB } from "./database/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import businessRoutes from "./modules/business/business.routes.js";
import partyRoutes    from "./modules/parties/party.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import taxRateRoutes  from "./modules/taxRates/taxRate.routes.js";
import productRoutes  from "./modules/products/product.routes.js";
import purchaseRoutes from "./modules/purchases/purchase.routes.js";
import saleRoutes     from "./modules/sales/sale.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import accountingRoutes from "./modules/accounting/accounting.routes.js";
import gstRoutes from "./modules/gst/gst.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import journalRoutes from "./modules/journal/journal.routes.js";


import "./jobs/workers/email.worker.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/business",   businessRoutes);
app.use("/api/parties",    partyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tax-rates",  taxRateRoutes);
app.use("/api/products",   productRoutes);
app.use("/api/purchases",  purchaseRoutes);
app.use("/api/sales",      saleRoutes);
app.use("/api/expenses",   expenseRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/gst",        gstRoutes);
app.use("/api/reports",    reportRoutes);
app.use("/api/dashboard",  dashboardRoutes);
app.use("/api/journal",    journalRoutes);



// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[GlobalError]", err);
  res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT || 5000, () => {
    console.log(`Server running on port ${PORT || 5000}`);
  });
};

start();