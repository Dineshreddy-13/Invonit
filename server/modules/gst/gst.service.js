import { and, eq, inArray, gte, lte, sql, desc, isNotNull } from "drizzle-orm";
import { db } from "../../database/db.js";
import { sales, saleItems, purchases, purchaseItems, parties } from "../../database/schemas/index.js";
import { MSG } from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error("Report not found.");
  e.statusCode = 404;
  return e;
}

// ─── GST Summary ───────────────────────────────────────────────────────────

export async function getGstSummary(businessId, { from, to }) {
  if (!from || !to) {
    const e = new Error("'from' and 'to' dates are required.");
    e.statusCode = 400;
    throw e;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // Output tax from confirmed/delivered sales (not cancelled/draft/returns)
  const [outputTaxData] = await db
    .select({
      taxableAmount: sql`COALESCE(SUM(cast(${sales.taxableAmount} as numeric)), 0)`,
      cgstAmount: sql`COALESCE(SUM(cast(${sales.cgstAmount} as numeric)), 0)`,
      sgstAmount: sql`COALESCE(SUM(cast(${sales.sgstAmount} as numeric)), 0)`,
      igstAmount: sql`COALESCE(SUM(cast(${sales.igstAmount} as numeric)), 0)`,
      cessAmount: sql`COALESCE(SUM(cast(${sales.cessAmount} as numeric)), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    );

  // Input tax from received purchases
  const [inputTaxData] = await db
    .select({
      taxableAmount: sql`COALESCE(SUM(cast(${purchases.taxableAmount} as numeric)), 0)`,
      cgstAmount: sql`COALESCE(SUM(cast(${purchases.cgstAmount} as numeric)), 0)`,
      sgstAmount: sql`COALESCE(SUM(cast(${purchases.sgstAmount} as numeric)), 0)`,
      igstAmount: sql`COALESCE(SUM(cast(${purchases.igstAmount} as numeric)), 0)`,
      cessAmount: sql`COALESCE(SUM(cast(${purchases.cessAmount} as numeric)), 0)`,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"]),
        eq(purchases.isReturn, false),
        gte(purchases.purchaseDate, fromDate),
        lte(purchases.purchaseDate, toDate)
      )
    );

  const outputTax = {
    taxableAmount: parseFloat(outputTaxData?.taxableAmount || 0).toFixed(2),
    cgstAmount: parseFloat(outputTaxData?.cgstAmount || 0).toFixed(2),
    sgstAmount: parseFloat(outputTaxData?.sgstAmount || 0).toFixed(2),
    igstAmount: parseFloat(outputTaxData?.igstAmount || 0).toFixed(2),
    cessAmount: parseFloat(outputTaxData?.cessAmount || 0).toFixed(2),
    totalTax: (
      parseFloat(outputTaxData?.cgstAmount || 0) +
      parseFloat(outputTaxData?.sgstAmount || 0) +
      parseFloat(outputTaxData?.igstAmount || 0) +
      parseFloat(outputTaxData?.cessAmount || 0)
    ).toFixed(2),
  };

  const inputTax = {
    taxableAmount: parseFloat(inputTaxData?.taxableAmount || 0).toFixed(2),
    cgstAmount: parseFloat(inputTaxData?.cgstAmount || 0).toFixed(2),
    sgstAmount: parseFloat(inputTaxData?.sgstAmount || 0).toFixed(2),
    igstAmount: parseFloat(inputTaxData?.igstAmount || 0).toFixed(2),
    cessAmount: parseFloat(inputTaxData?.cessAmount || 0).toFixed(2),
    totalTax: (
      parseFloat(inputTaxData?.cgstAmount || 0) +
      parseFloat(inputTaxData?.sgstAmount || 0) +
      parseFloat(inputTaxData?.igstAmount || 0) +
      parseFloat(inputTaxData?.cessAmount || 0)
    ).toFixed(2),
  };

  const netTaxLiability = (
    parseFloat(outputTax.totalTax) - parseFloat(inputTax.totalTax)
  ).toFixed(2);

  return {
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    outputTax,
    inputTax,
    netTaxLiability,
  };
}

// ─── HSN Summary ───────────────────────────────────────────────────────────

export async function getHsnSummary(businessId, { from, to, type = "both" }) {
  if (!from || !to) {
    const e = new Error("'from' and 'to' dates are required.");
    e.statusCode = 400;
    throw e;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const result = { sales: [], purchases: [] };

  // Sales HSN summary
  if (["sales", "both"].includes(type)) {
    const salesData = await db
      .select({
        hsnCode: saleItems.hsnCode,
        totalQty: sql`COALESCE(SUM(cast(${saleItems.quantity} as numeric)), 0)`,
        taxableAmount: sql`COALESCE(SUM(cast(${saleItems.taxableAmount} as numeric)), 0)`,
        cgstAmount: sql`COALESCE(SUM(cast(${saleItems.cgstAmount} as numeric)), 0)`,
        sgstAmount: sql`COALESCE(SUM(cast(${saleItems.sgstAmount} as numeric)), 0)`,
        igstAmount: sql`COALESCE(SUM(cast(${saleItems.igstAmount} as numeric)), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(
        and(
          eq(sales.businessId, businessId),
          inArray(sales.status, ["confirmed", "delivered"]),
          eq(sales.isReturn, false),
          gte(sales.saleDate, fromDate),
          lte(sales.saleDate, toDate),
          isNotNull(saleItems.hsnCode)
        )
      )
      .groupBy(saleItems.hsnCode)
      .orderBy(desc(saleItems.hsnCode));

    result.sales = salesData.map(row => ({
      hsnCode: row.hsnCode,
      totalQty: parseFloat(row.totalQty).toFixed(2),
      taxableAmount: parseFloat(row.taxableAmount).toFixed(2),
      cgstAmount: parseFloat(row.cgstAmount).toFixed(2),
      sgstAmount: parseFloat(row.sgstAmount).toFixed(2),
      igstAmount: parseFloat(row.igstAmount).toFixed(2),
      totalTax: (
        parseFloat(row.cgstAmount) + parseFloat(row.sgstAmount) + parseFloat(row.igstAmount)
      ).toFixed(2),
    }));
  }

  // Purchases HSN summary
  if (["purchases", "both"].includes(type)) {
    const purchasesData = await db
      .select({
        hsnCode: purchaseItems.hsnCode,
        totalQty: sql`COALESCE(SUM(cast(${purchaseItems.quantity} as numeric)), 0)`,
        taxableAmount: sql`COALESCE(SUM(cast(${purchaseItems.taxableAmount} as numeric)), 0)`,
        cgstAmount: sql`COALESCE(SUM(cast(${purchaseItems.cgstAmount} as numeric)), 0)`,
        sgstAmount: sql`COALESCE(SUM(cast(${purchaseItems.sgstAmount} as numeric)), 0)`,
        igstAmount: sql`COALESCE(SUM(cast(${purchaseItems.igstAmount} as numeric)), 0)`,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .where(
        and(
          eq(purchases.businessId, businessId),
          inArray(purchases.status, ["received", "partial"]),
          eq(purchases.isReturn, false),
          gte(purchases.purchaseDate, fromDate),
          lte(purchases.purchaseDate, toDate),
          isNotNull(purchaseItems.hsnCode)
        )
      )
      .groupBy(purchaseItems.hsnCode)
      .orderBy(desc(purchaseItems.hsnCode));

    result.purchases = purchasesData.map(row => ({
      hsnCode: row.hsnCode,
      totalQty: parseFloat(row.totalQty).toFixed(2),
      taxableAmount: parseFloat(row.taxableAmount).toFixed(2),
      cgstAmount: parseFloat(row.cgstAmount).toFixed(2),
      sgstAmount: parseFloat(row.sgstAmount).toFixed(2),
      igstAmount: parseFloat(row.igstAmount).toFixed(2),
      totalTax: (
        parseFloat(row.cgstAmount) + parseFloat(row.sgstAmount) + parseFloat(row.igstAmount)
      ).toFixed(2),
    }));
  }

  return result;
}

// ─── GSTR-1 (Outward Supplies) ────────────────────────────────────────────

export async function getGstr1(businessId, { from, to }) {
  if (!from || !to) {
    const e = new Error("'from' and 'to' dates are required.");
    e.statusCode = 400;
    throw e;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // B2B - Sales to GST-registered customers (customer has GSTIN)
  const b2bSales = await db
    .select({
      customerGstin: parties.gstin,
      customerName: parties.name,
      invoiceNumber: sales.invoiceNumber,
      invoiceDate: sales.saleDate,
      invoiceValue: sales.totalAmount,
      taxableValue: sales.taxableAmount,
      cgst: sql`COALESCE(${sales.cgstAmount}, 0)`,
      sgst: sql`COALESCE(${sales.sgstAmount}, 0)`,
      igst: sql`COALESCE(${sales.igstAmount}, 0)`,
      cess: sql`COALESCE(${sales.cessAmount}, 0)`,
    })
    .from(sales)
    .innerJoin(parties, eq(sales.customerId, parties.id))
    .where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        isNotNull(parties.gstin),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    )
    .orderBy(desc(sales.saleDate));

  const b2bGrouped = {};
  b2bSales.forEach(sale => {
    if (!b2bGrouped[sale.customerGstin]) {
      b2bGrouped[sale.customerGstin] = {
        customerGstin: sale.customerGstin,
        customerName: sale.customerName,
        invoices: [],
      };
    }
    b2bGrouped[sale.customerGstin].invoices.push({
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate.toISOString().split("T")[0],
      invoiceValue: parseFloat(sale.invoiceValue).toFixed(2),
      taxableValue: parseFloat(sale.taxableValue).toFixed(2),
      cgst: parseFloat(sale.cgst).toFixed(2),
      sgst: parseFloat(sale.sgst).toFixed(2),
      igst: parseFloat(sale.igst).toFixed(2),
      cess: parseFloat(sale.cess).toFixed(2),
    });
  });

  // B2C - Sales to unregistered customers
  const b2cSales = await db
    .select({
      invoiceNumber: sales.invoiceNumber,
      invoiceDate: sales.saleDate,
      invoiceValue: sales.totalAmount,
      taxableValue: sales.taxableAmount,
      cgst: sql`COALESCE(${sales.cgstAmount}, 0)`,
      sgst: sql`COALESCE(${sales.sgstAmount}, 0)`,
      igst: sql`COALESCE(${sales.igstAmount}, 0)`,
      cess: sql`COALESCE(${sales.cessAmount}, 0)`,
    })
    .from(sales)
    .innerJoin(parties, eq(sales.customerId, parties.id))
    .where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        inArray(sql`${parties.gstin} IS NULL OR ${parties.gstin} = ''`, [true]),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    )
    .orderBy(desc(sales.saleDate));

  // Credit notes (sale returns)
  const creditNotes = await db
    .select({
      originalInvoice: sql`(SELECT invoice_number FROM ${sales} WHERE id = ${sales.originalSaleId})`,
      returnInvoice: sales.invoiceNumber,
      returnDate: sales.saleDate,
      taxableValue: sales.taxableAmount,
      cgst: sql`COALESCE(${sales.cgstAmount}, 0)`,
      sgst: sql`COALESCE(${sales.sgstAmount}, 0)`,
      igst: sql`COALESCE(${sales.igstAmount}, 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.isReturn, true),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    )
    .orderBy(desc(sales.saleDate));

  // Totals
  const totalTaxableValue = b2bSales.reduce((sum, s) => sum + parseFloat(s.taxableValue), 0) +
    b2cSales.reduce((sum, s) => sum + parseFloat(s.taxableValue), 0);
  const totalCgst = b2bSales.reduce((sum, s) => sum + parseFloat(s.cgst), 0) +
    b2cSales.reduce((sum, s) => sum + parseFloat(s.cgst), 0);
  const totalSgst = b2bSales.reduce((sum, s) => sum + parseFloat(s.sgst), 0) +
    b2cSales.reduce((sum, s) => sum + parseFloat(s.sgst), 0);
  const totalIgst = b2bSales.reduce((sum, s) => sum + parseFloat(s.igst), 0) +
    b2cSales.reduce((sum, s) => sum + parseFloat(s.igst), 0);
  const totalCess = b2bSales.reduce((sum, s) => sum + parseFloat(s.cess), 0) +
    b2cSales.reduce((sum, s) => sum + parseFloat(s.cess), 0);

  return {
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    b2b: Object.values(b2bGrouped),
    b2c: b2cSales.map(sale => ({
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate.toISOString().split("T")[0],
      invoiceValue: parseFloat(sale.invoiceValue).toFixed(2),
      taxableValue: parseFloat(sale.taxableValue).toFixed(2),
      cgst: parseFloat(sale.cgst).toFixed(2),
      sgst: parseFloat(sale.sgst).toFixed(2),
      igst: parseFloat(sale.igst).toFixed(2),
      cess: parseFloat(sale.cess).toFixed(2),
    })),
    creditNotes: creditNotes.map(note => ({
      originalInvoice: note.originalInvoice,
      returnInvoice: note.returnInvoice,
      returnDate: note.returnDate.toISOString().split("T")[0],
      taxableValue: parseFloat(note.taxableValue).toFixed(2),
      cgst: parseFloat(note.cgst).toFixed(2),
      sgst: parseFloat(note.sgst).toFixed(2),
      igst: parseFloat(note.igst).toFixed(2),
    })),
    totals: {
      totalTaxableValue: totalTaxableValue.toFixed(2),
      totalCgst: totalCgst.toFixed(2),
      totalSgst: totalSgst.toFixed(2),
      totalIgst: totalIgst.toFixed(2),
      totalCess: totalCess.toFixed(2),
      totalInvoiceValue: (totalTaxableValue + totalCgst + totalSgst + totalIgst + totalCess).toFixed(2),
    },
  };
}

// ─── GSTR-3B (Monthly Summary) ────────────────────────────────────────────

export async function getGstr3b(businessId, { from, to }) {
  if (!from || !to) {
    const e = new Error("'from' and 'to' dates are required.");
    e.statusCode = 400;
    throw e;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // Outward supplies (from sales)
  const [outwardData] = await db
    .select({
      taxableValue: sql`COALESCE(SUM(cast(${sales.taxableAmount} as numeric)), 0)`,
      igst: sql`COALESCE(SUM(cast(${sales.igstAmount} as numeric)), 0)`,
      cgst: sql`COALESCE(SUM(cast(${sales.cgstAmount} as numeric)), 0)`,
      sgst: sql`COALESCE(SUM(cast(${sales.sgstAmount} as numeric)), 0)`,
      cess: sql`COALESCE(SUM(cast(${sales.cessAmount} as numeric)), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    );

  // Inward supplies (input tax from purchases)
  const [inwardData] = await db
    .select({
      taxableValue: sql`COALESCE(SUM(cast(${purchases.taxableAmount} as numeric)), 0)`,
      igst: sql`COALESCE(SUM(cast(${purchases.igstAmount} as numeric)), 0)`,
      cgst: sql`COALESCE(SUM(cast(${purchases.cgstAmount} as numeric)), 0)`,
      sgst: sql`COALESCE(SUM(cast(${purchases.sgstAmount} as numeric)), 0)`,
      cess: sql`COALESCE(SUM(cast(${purchases.cessAmount} as numeric)), 0)`,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"]),
        eq(purchases.isReturn, false),
        gte(purchases.purchaseDate, fromDate),
        lte(purchases.purchaseDate, toDate)
      )
    );

  const outwardSupplies = {
    totalTaxableValue: parseFloat(outwardData?.taxableValue || 0).toFixed(2),
    integratedTax: parseFloat(outwardData?.igst || 0).toFixed(2),
    centralTax: parseFloat(outwardData?.cgst || 0).toFixed(2),
    stateTax: parseFloat(outwardData?.sgst || 0).toFixed(2),
    cess: parseFloat(outwardData?.cess || 0).toFixed(2),
  };

  const inwardSupplies = {
    totalTaxableValue: parseFloat(inwardData?.taxableValue || 0).toFixed(2),
    integratedTax: parseFloat(inwardData?.igst || 0).toFixed(2),
    centralTax: parseFloat(inwardData?.cgst || 0).toFixed(2),
    stateTax: parseFloat(inwardData?.sgst || 0).toFixed(2),
    cess: parseFloat(inwardData?.cess || 0).toFixed(2),
  };

  const taxPayable = {
    integratedTax: (parseFloat(outwardSupplies.integratedTax) - parseFloat(inwardSupplies.integratedTax)).toFixed(2),
    centralTax: (parseFloat(outwardSupplies.centralTax) - parseFloat(inwardSupplies.centralTax)).toFixed(2),
    stateTax: (parseFloat(outwardSupplies.stateTax) - parseFloat(inwardSupplies.stateTax)).toFixed(2),
    cess: (parseFloat(outwardSupplies.cess) - parseFloat(inwardSupplies.cess)).toFixed(2),
  };

  const total = (
    parseFloat(taxPayable.integratedTax) +
    parseFloat(taxPayable.centralTax) +
    parseFloat(taxPayable.stateTax) +
    parseFloat(taxPayable.cess)
  ).toFixed(2);

  return {
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    outwardSupplies,
    inwardSupplies,
    taxPayable: {
      ...taxPayable,
      total,
    },
  };
}
