import { and, eq, desc, asc, sql, or, ilike, gt } from "drizzle-orm";
import { db }            from "../../database/db.js";
import {
  sales, saleItems,
  products, parties, businesses,
  payments, ledgerEntries,
} from "../../database/schemas/index.js";
import {
  MSG,
  DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT,
} from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error(MSG.SALE_NOT_FOUND); e.statusCode = 404; return e;
}
function forbidden() {
  const e = new Error(MSG.SALE_FORBIDDEN); e.statusCode = 403; return e;
}

async function verifyOwnership(saleId, businessId) {
  const [sale] = await db
    .select()
    .from(sales)
    .where(eq(sales.id, saleId))
    .limit(1);

  if (!sale) throw notFound();
  if (sale.businessId !== businessId) throw forbidden();
  return sale;
}

// ─── Auto-generate invoice number ─────────────────────────────────────────
// Format: <prefix>-<YYYY>-<NNNN>   e.g. INV-2025-0001
// Uses DB-level counter stored on the business row — safe under concurrency.
async function generateInvoiceNumber(tx, businessId) {
  // Atomically increment the counter and return new value
  const [updated] = await tx
    .update(businesses)
    .set({
      invoiceCounter: sql`cast(invoice_counter as int) + 1`,
      updatedAt:      new Date(),
    })
    .where(eq(businesses.id, businessId))
    .returning({
      invoicePrefix:  businesses.invoicePrefix,
      invoiceCounter: businesses.invoiceCounter,
    });

  const year    = new Date().getFullYear();
  const counter = String(parseInt(updated.invoiceCounter)).padStart(4, "0");
  return `${updated.invoicePrefix}-${year}-${counter}`;
}

// ─── Item calculation ─────────────────────────────────────────────────────
function calcItem(item) {
  const qty       = parseFloat(item.quantity);
  const price     = parseFloat(item.sellingPrice);
  const discPct   = parseFloat(item.discountPercent ?? 0);

  const grossAmt  = qty * price;
  const discAmt   = parseFloat(((grossAmt * discPct) / 100).toFixed(2));
  const taxableAmt= parseFloat((grossAmt - discAmt).toFixed(2));

  const cgstRate  = parseFloat(item.cgstRate ?? 0);
  const sgstRate  = parseFloat(item.sgstRate ?? 0);
  const igstRate  = parseFloat(item.igstRate ?? 0);

  const cgstAmt   = parseFloat(((taxableAmt * cgstRate) / 100).toFixed(2));
  const sgstAmt   = parseFloat(((taxableAmt * sgstRate) / 100).toFixed(2));
  const igstAmt   = parseFloat(((taxableAmt * igstRate) / 100).toFixed(2));
  const totalAmt  = parseFloat((taxableAmt + cgstAmt + sgstAmt + igstAmt).toFixed(2));

  return {
    discountAmount: discAmt,
    taxableAmount:  taxableAmt,
    cgstAmount:     cgstAmt,
    sgstAmount:     sgstAmt,
    igstAmount:     igstAmt,
    totalAmount:    totalAmt,
    _gross:         grossAmt,
  };
}

// ─── Aggregate header totals ───────────────────────────────────────────────
function calcTotals(itemCalcs, roundOff = false) {
  const totals = {
    subtotal:      0,
    discountAmount:0,
    taxableAmount: 0,
    cgstAmount:    0,
    sgstAmount:    0,
    igstAmount:    0,
    cessAmount:    0,
    totalAmount:   0,
    roundOffAmount:0,
  };

  for (const c of itemCalcs) {
    totals.subtotal       += c._gross;
    totals.discountAmount += c.discountAmount;
    totals.taxableAmount  += c.taxableAmount;
    totals.cgstAmount     += c.cgstAmount;
    totals.sgstAmount     += c.sgstAmount;
    totals.igstAmount     += c.igstAmount;
    totals.totalAmount    += c.totalAmount;
  }

  for (const key of Object.keys(totals)) {
    totals[key] = parseFloat(totals[key].toFixed(2));
  }

  // Apply round-off for POS billing (nearest rupee)
  if (roundOff) {
    const rounded       = Math.round(totals.totalAmount);
    totals.roundOffAmount = parseFloat((rounded - totals.totalAmount).toFixed(2));
    totals.totalAmount    = rounded;
  }

  return totals;
}

// ─── Validate customer ────────────────────────────────────────────────────
async function validateCustomer(customerId, businessId) {
  if (!customerId) return null;

  const [party] = await db
    .select({
      id:        parties.id,
      businessId:parties.businessId,
      partyType: parties.partyType,
      isActive:  parties.isActive,
      creditLimit:parties.creditLimit,
    })
    .from(parties)
    .where(eq(parties.id, customerId))
    .limit(1);

  if (!party || party.businessId !== businessId || !party.isActive) {
    const e = new Error(MSG.CUSTOMER_NOT_VALID); e.statusCode = 400; throw e;
  }
  if (!["customer", "both"].includes(party.partyType)) {
    const e = new Error(MSG.CUSTOMER_NOT_VALID); e.statusCode = 400; throw e;
  }
  return party;
}

// ─── Validate + fetch products (with stock check) ─────────────────────────
async function validateAndFetchProducts(businessId, items, skipStockCheck = false) {
  const productIds = items.map((i) => i.productId).filter(Boolean);
  if (productIds.length === 0) return {};

  const rows = await db
    .select({
      id:                products.id,
      businessId:        products.businessId,
      name:              products.name,
      unit:              products.unit,
      hsnCode:           products.hsnCode,
      sellingPrice:      products.sellingPrice,
      mrp:               products.mrp,
      currentStock:      products.currentStock,
      allowNegativeStock:products.allowNegativeStock,
      trackInventory:    products.trackInventory,
      cgstRate:          sql`
        coalesce((
          select cgst_rate from tax_rates tr
          where tr.id = ${products.taxRateId}
          limit 1
        ), 0)
      `,
      sgstRate:          sql`
        coalesce((
          select sgst_rate from tax_rates tr
          where tr.id = ${products.taxRateId}
          limit 1
        ), 0)
      `,
      igstRate:          sql`
        coalesce((
          select igst_rate from tax_rates tr
          where tr.id = ${products.taxRateId}
          limit 1
        ), 0)
      `,
    })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.isActive, true)
      )
    );

  const productMap = {};
  for (const p of rows) productMap[p.id] = p;

  // Stock pre-flight check — block out-of-stock sales upfront
  if (!skipStockCheck) {
    const stockErrors = [];
    for (const item of items) {
      if (!item.productId) continue;
      const p = productMap[item.productId];

      if (!p) {
        stockErrors.push(`Product ID ${item.productId} not found in this business.`);
        continue;
      }

      if (p.trackInventory && !p.allowNegativeStock) {
        const currentStock = parseFloat(p.currentStock);
        const requested    = parseFloat(item.quantity);
        if (currentStock < requested) {
          stockErrors.push(
            `"${p.name}" has only ${currentStock} ${p.unit} in stock. Requested: ${requested}.`
          );
        }
      }
    }

    if (stockErrors.length > 0) {
      const e = new Error(MSG.SALE_OUT_OF_STOCK);
      e.statusCode  = 409;
      e.stockErrors = stockErrors;
      throw e;
    }
  }

  return productMap;
}

// ─── Fetch sale with items ─────────────────────────────────────────────────
async function getSaleWithItems(saleId) {
  const [sale] = await db
    .select({
      id:             sales.id,
      businessId:     sales.businessId,
      customerId:     sales.customerId,
      customerName:   parties.name,
      invoiceNumber:  sales.invoiceNumber,
      saleType:       sales.saleType,
      status:         sales.status,
      saleDate:       sales.saleDate,
      dueDate:        sales.dueDate,
      subtotal:       sales.subtotal,
      discountAmount: sales.discountAmount,
      taxableAmount:  sales.taxableAmount,
      cgstAmount:     sales.cgstAmount,
      sgstAmount:     sales.sgstAmount,
      igstAmount:     sales.igstAmount,
      cessAmount:     sales.cessAmount,
      roundOffAmount: sales.roundOffAmount,
      totalAmount:    sales.totalAmount,
      paidAmount:     sales.paidAmount,
      balanceAmount:  sales.balanceAmount,
      paymentMode:    sales.paymentMode,
      notes:          sales.notes,
      termsConditions:sales.termsConditions,
      isReturn:       sales.isReturn,
      originalSaleId: sales.originalSaleId,
      createdAt:      sales.createdAt,
      updatedAt:      sales.updatedAt,
    })
    .from(sales)
    .leftJoin(parties, eq(sales.customerId, parties.id))
    .where(eq(sales.id, saleId))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId))
    .orderBy(asc(saleItems.createdAt));

  return { ...sale, items };
}

// ─── CREATE SALE ───────────────────────────────────────────────────────────
// Full ACID transaction:
// 1. Validate customer + stock pre-flight
// 2. Auto-generate invoice number
// 3. Calculate item + header totals
// 4. Insert sale + saleItems
// 5. Decrement product stock
// 6. Insert ledger entry (customer debit)
// 7. If payment provided → insert payment + ledger credit
export async function createSale(businessId, payload) {
  // ── Pre-transaction validations ───────────────────────────────────────
  const customer = await validateCustomer(payload.customerId ?? null, businessId);

  const saleType = payload.saleType ?? "invoice";

  // Skip stock check for estimates and delivery challans
  const skipStockCheck = ["estimate", "draft"].includes(payload.status ?? "confirmed")
    || saleType === "estimate";

  const productMap = await validateAndFetchProducts(
    businessId,
    payload.items,
    skipStockCheck
  );

  // ── Calculate item totals ──────────────────────────────────────────────
  const itemCalcs = payload.items.map((item) => {
    const p = productMap[item.productId] ?? {};

    // Use item-level rates if provided, else fall back to product's tax rate
    const enrichedItem = {
      ...item,
      sellingPrice:    item.sellingPrice   ?? p.sellingPrice  ?? 0,
      cgstRate:        item.cgstRate       ?? p.cgstRate      ?? 0,
      sgstRate:        item.sgstRate       ?? p.sgstRate      ?? 0,
      igstRate:        item.igstRate       ?? p.igstRate      ?? 0,
    };

    const calc = calcItem(enrichedItem);
    return { ...enrichedItem, ...calc };
  });

  // Round-off for POS billing
  const applyRoundOff = saleType === "pos" || payload.roundOff === true;
  const headerTotals  = calcTotals(itemCalcs, applyRoundOff);

  const paidAmount    = parseFloat(payload.paidAmount ?? 0);
  const balanceAmount = parseFloat((headerTotals.totalAmount - paidAmount).toFixed(2));
  const status        = payload.status
    ?? (saleType === "pos"
      ? "confirmed"
      : balanceAmount <= 0 ? "confirmed" : "confirmed");

  // ── ACID Transaction ──────────────────────────────────────────────────
  return await db.transaction(async (tx) => {

    // 1. Generate invoice number (atomic counter increment)
    const invoiceNumber = payload.invoiceNumber
      ?? await generateInvoiceNumber(tx, businessId);

    // 2. Insert sale header
    const [sale] = await tx
      .insert(sales)
      .values({
        businessId,
        customerId:      payload.customerId      ?? null,
        invoiceNumber,
        saleType,
        status,
        saleDate:        payload.saleDate
                           ? new Date(payload.saleDate)
                           : new Date(),
        dueDate:         payload.dueDate
                           ? new Date(payload.dueDate)
                           : null,
        subtotal:        String(headerTotals.subtotal),
        discountAmount:  String(headerTotals.discountAmount),
        taxableAmount:   String(headerTotals.taxableAmount),
        cgstAmount:      String(headerTotals.cgstAmount),
        sgstAmount:      String(headerTotals.sgstAmount),
        igstAmount:      String(headerTotals.igstAmount),
        cessAmount:      "0",
        roundOffAmount:  String(headerTotals.roundOffAmount),
        totalAmount:     String(headerTotals.totalAmount),
        paidAmount:      String(paidAmount),
        balanceAmount:   String(balanceAmount),
        paymentMode:     payload.paymentMode      ?? "cash",
        notes:           payload.notes            ?? null,
        termsConditions: payload.termsConditions  ?? null,
        isReturn:        false,
      })
      .returning();

    // 3. Insert sale items
    const itemValues = itemCalcs.map((item) => {
      const p = productMap[item.productId] ?? {};
      return {
        saleId:          sale.id,
        productId:       item.productId    ?? null,
        productName:     item.productId
                           ? p.name ?? item.productName
                           : item.productName,
        hsnCode:         item.hsnCode      ?? p.hsnCode ?? null,
        quantity:        String(item.quantity),
        unit:            item.unit         ?? p.unit    ?? "pcs",
        sellingPrice:    String(item.sellingPrice),
        mrp:             item.mrp          ?? p.mrp     ?? null,
        discountPercent: String(item.discountPercent ?? 0),
        discountAmount:  String(item.discountAmount),
        taxableAmount:   String(item.taxableAmount),
        cgstRate:        String(item.cgstRate  ?? 0),
        sgstRate:        String(item.sgstRate  ?? 0),
        igstRate:        String(item.igstRate  ?? 0),
        cgstAmount:      String(item.cgstAmount),
        sgstAmount:      String(item.sgstAmount),
        igstAmount:      String(item.igstAmount),
        totalAmount:     String(item.totalAmount),
      };
    });

    await tx.insert(saleItems).values(itemValues);

    // 4. Decrement stock (skip for estimates / drafts)
    if (!skipStockCheck) {
      for (const item of itemCalcs) {
        if (!item.productId) continue;

        const p = productMap[item.productId];
        if (!p?.trackInventory) continue;

        await tx
          .update(products)
          .set({
            currentStock: sql`cast(current_stock as numeric) - ${parseFloat(item.quantity)}`,
            updatedAt:    new Date(),
          })
          .where(
            and(
              eq(products.id, item.productId),
              eq(products.businessId, businessId)
            )
          );
      }
    }

    // 5. Customer ledger entry (Debit customer — they owe us)
    if (payload.customerId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         payload.customerId,
        entryType:       "sale",
        referenceId:     sale.id,
        referenceType:   "sale",
        referenceNumber: invoiceNumber,
        debitAmount:     String(headerTotals.totalAmount),
        creditAmount:    "0",
        description:     `Sale to customer — Invoice: ${invoiceNumber}`,
        entryDate:       sale.saleDate,
      });
    }

    // 6. Payment received (if any at point of sale)
    if (paidAmount > 0 && payload.customerId) {
      const [payment] = await tx
        .insert(payments)
        .values({
          businessId,
          partyId:         payload.customerId,
          paymentType:     "receipt",
          referenceId:     sale.id,
          referenceType:   "sale",
          referenceNumber: invoiceNumber,
          amount:          String(paidAmount),
          paymentMode:     payload.paymentMode ?? "cash",
          transactionRef:  payload.transactionRef ?? null,
          paymentDate:     sale.saleDate,
          notes:           payload.notes ?? null,
        })
        .returning();

      // Ledger credit (customer paid — reduces what they owe)
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         payload.customerId,
        entryType:       "payment_receipt",
        referenceId:     payment.id,
        referenceType:   "payment",
        referenceNumber: invoiceNumber,
        debitAmount:     "0",
        creditAmount:    String(paidAmount),
        description:     `Payment received — Invoice: ${invoiceNumber}`,
        entryDate:       sale.saleDate,
      });
    }

    return getSaleWithItems(sale.id);
  });
}

// ─── LIST SALES ────────────────────────────────────────────────────────────
export async function listSales(businessId, query) {
  const page   = Math.max(parseInt(query.page  ?? DEFAULT_PAGE,  10), 1);
  const limit  = Math.min(parseInt(query.limit ?? DEFAULT_LIMIT, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(sales.businessId, businessId),
    eq(sales.isReturn, false),
  ];

  if (query.customerId) conditions.push(eq(sales.customerId,  query.customerId));
  if (query.status)     conditions.push(eq(sales.status,      query.status));
  if (query.saleType)   conditions.push(eq(sales.saleType,    query.saleType));

  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(ilike(sales.invoiceNumber, term));
  }

  if (query.from) conditions.push(sql`${sales.saleDate} >= ${new Date(query.from)}`);
  if (query.to)   conditions.push(sql`${sales.saleDate} <= ${new Date(query.to)}`);

  const whereClause = and(...conditions);

  const SORT_MAP = {
    saleDate:    sales.saleDate,
    totalAmount: sales.totalAmount,
    createdAt:   sales.createdAt,
  };
  const sortField = SORT_MAP[query.sortBy] ?? sales.saleDate;
  const sortOrder = query.order === "asc" ? asc(sortField) : desc(sortField);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:             sales.id,
        customerId:     sales.customerId,
        customerName:   parties.name,
        invoiceNumber:  sales.invoiceNumber,
        saleType:       sales.saleType,
        status:         sales.status,
        saleDate:       sales.saleDate,
        dueDate:        sales.dueDate,
        totalAmount:    sales.totalAmount,
        paidAmount:     sales.paidAmount,
        balanceAmount:  sales.balanceAmount,
        paymentMode:    sales.paymentMode,
        createdAt:      sales.createdAt,
      })
      .from(sales)
      .leftJoin(parties, eq(sales.customerId, parties.id))
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql`count(*)::int` })
      .from(sales)
      .where(whereClause),
  ]);

  return {
    sales: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── GET SALE BY ID ────────────────────────────────────────────────────────
export async function getSaleById(saleId, businessId) {
  await verifyOwnership(saleId, businessId);
  return getSaleWithItems(saleId);
}

// ─── RECORD ADDITIONAL PAYMENT ─────────────────────────────────────────────
export async function recordPayment(saleId, businessId, payload) {
  const sale    = await verifyOwnership(saleId, businessId);
  const balance = parseFloat(sale.balanceAmount);
  const amount  = parseFloat(payload.amount);

  if (amount <= 0) {
    const e = new Error("Payment amount must be greater than zero."); e.statusCode = 400; throw e;
  }
  if (amount > balance + 0.01) {
    const e = new Error(
      `Payment (₹${amount}) exceeds outstanding balance (₹${balance}).`
    );
    e.statusCode = 400;
    throw e;
  }

  return await db.transaction(async (tx) => {
    const newPaid    = parseFloat((parseFloat(sale.paidAmount) + amount).toFixed(2));
    const newBalance = parseFloat((parseFloat(sale.totalAmount) - newPaid).toFixed(2));

    await tx
      .update(sales)
      .set({
        paidAmount:    String(newPaid),
        balanceAmount: String(newBalance),
        updatedAt:     new Date(),
      })
      .where(eq(sales.id, saleId));

    const [payment] = await tx
      .insert(payments)
      .values({
        businessId,
        partyId:         sale.customerId,
        paymentType:     "receipt",
        referenceId:     saleId,
        referenceType:   "sale",
        referenceNumber: sale.invoiceNumber,
        amount:          String(amount),
        paymentMode:     payload.paymentMode    ?? "cash",
        transactionRef:  payload.transactionRef ?? null,
        paymentDate:     payload.paymentDate
                           ? new Date(payload.paymentDate)
                           : new Date(),
        notes:           payload.notes ?? null,
      })
      .returning();

    if (sale.customerId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         sale.customerId,
        entryType:       "payment_receipt",
        referenceId:     payment.id,
        referenceType:   "payment",
        referenceNumber: sale.invoiceNumber,
        debitAmount:     "0",
        creditAmount:    String(amount),
        description:     `Payment received — Invoice: ${sale.invoiceNumber}`,
        entryDate:       payment.paymentDate,
      });
    }

    return { payment, newPaid, newBalance };
  });
}

// ─── SALE RETURN ───────────────────────────────────────────────────────────
export async function createSaleReturn(saleId, businessId, payload) {
  const original = await verifyOwnership(saleId, businessId);

  if (!["confirmed", "delivered"].includes(original.status)) {
    const e = new Error(MSG.SALE_CANNOT_RETURN); e.statusCode = 400; throw e;
  }
  if (original.isReturn) {
    const e = new Error("Cannot return a sale return."); e.statusCode = 400; throw e;
  }
  if (original.status === "returned") {
    const e = new Error(MSG.SALE_ALREADY_RETURNED); e.statusCode = 409; throw e;
  }

  const originalItems = await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId));

  const returnItems = payload.items ?? originalItems.map((i) => ({
    productId:      i.productId,
    productName:    i.productName,
    hsnCode:        i.hsnCode,
    quantity:       i.quantity,
    unit:           i.unit,
    sellingPrice:   i.sellingPrice,
    mrp:            i.mrp,
    discountPercent:i.discountPercent,
    cgstRate:       i.cgstRate,
    sgstRate:       i.sgstRate,
    igstRate:       i.igstRate,
  }));

  const itemCalcs = returnItems.map((item) => {
    const calc = calcItem(item);
    return { ...item, ...calc };
  });

  const headerTotals = calcTotals(itemCalcs);

  return await db.transaction(async (tx) => {
    // Generate return invoice number
    const returnInvoiceNumber = payload.returnInvoiceNumber
      ?? await generateInvoiceNumber(tx, businessId);

    // 1. Insert return sale
    const [returnSale] = await tx
      .insert(sales)
      .values({
        businessId,
        customerId:      original.customerId,
        invoiceNumber:   returnInvoiceNumber,
        saleType:        original.saleType,
        status:          "returned",
        saleDate:        new Date(),
        subtotal:        String(headerTotals.subtotal),
        discountAmount:  String(headerTotals.discountAmount),
        taxableAmount:   String(headerTotals.taxableAmount),
        cgstAmount:      String(headerTotals.cgstAmount),
        sgstAmount:      String(headerTotals.sgstAmount),
        igstAmount:      String(headerTotals.igstAmount),
        cessAmount:      "0",
        roundOffAmount:  "0",
        totalAmount:     String(headerTotals.totalAmount),
        paidAmount:      String(headerTotals.totalAmount),
        balanceAmount:   "0",
        paymentMode:     payload.paymentMode ?? original.paymentMode,
        notes:           payload.notes ?? `Return of invoice ${original.invoiceNumber}`,
        isReturn:        true,
        originalSaleId:  saleId,
      })
      .returning();

    // 2. Insert return items
    await tx.insert(saleItems).values(
      itemCalcs.map((item) => ({
        saleId:          returnSale.id,
        productId:       item.productId     ?? null,
        productName:     item.productName,
        hsnCode:         item.hsnCode       ?? null,
        quantity:        String(item.quantity),
        unit:            item.unit          ?? "pcs",
        sellingPrice:    String(item.sellingPrice),
        mrp:             item.mrp           ?? null,
        discountPercent: String(item.discountPercent ?? 0),
        discountAmount:  String(item.discountAmount),
        taxableAmount:   String(item.taxableAmount),
        cgstRate:        String(item.cgstRate  ?? 0),
        sgstRate:        String(item.sgstRate  ?? 0),
        igstRate:        String(item.igstRate  ?? 0),
        cgstAmount:      String(item.cgstAmount),
        sgstAmount:      String(item.sgstAmount),
        igstAmount:      String(item.igstAmount),
        totalAmount:     String(item.totalAmount),
      }))
    );

    // 3. Restore stock for returned items
    for (const item of itemCalcs) {
      if (!item.productId) continue;

      await tx
        .update(products)
        .set({
          currentStock: sql`cast(current_stock as numeric) + ${parseFloat(item.quantity)}`,
          updatedAt:    new Date(),
        })
        .where(eq(products.id, item.productId));
    }

    // 4. Mark original as returned
    await tx
      .update(sales)
      .set({ status: "returned", updatedAt: new Date() })
      .where(eq(sales.id, saleId));

    // 5. Reverse ledger (credit customer — they no longer owe us)
    if (original.customerId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         original.customerId,
        entryType:       "sale_return",
        referenceId:     returnSale.id,
        referenceType:   "sale",
        referenceNumber: returnInvoiceNumber,
        debitAmount:     "0",
        creditAmount:    String(headerTotals.totalAmount),
        description:     `Sale return — Original Invoice: ${original.invoiceNumber}`,
        entryDate:       new Date(),
      });
    }

    return getSaleWithItems(returnSale.id);
  });
}

// ─── CANCEL SALE ───────────────────────────────────────────────────────────
export async function cancelSale(saleId, businessId) {
  const sale = await verifyOwnership(saleId, businessId);

  if (!["draft", "confirmed"].includes(sale.status)) {
    const e = new Error(MSG.SALE_CANNOT_CANCEL); e.statusCode = 400; throw e;
  }
  if (sale.isReturn) {
    const e = new Error("Cannot cancel a sale return."); e.statusCode = 400; throw e;
  }

  const items = await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId));

  return await db.transaction(async (tx) => {
    // Restore stock
    for (const item of items) {
      if (!item.productId) continue;

      await tx
        .update(products)
        .set({
          currentStock: sql`cast(current_stock as numeric) + ${parseFloat(item.quantity)}`,
          updatedAt:    new Date(),
        })
        .where(eq(products.id, item.productId));
    }

    await tx
      .update(sales)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(sales.id, saleId));

    // Reverse ledger
    if (sale.customerId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         sale.customerId,
        entryType:       "journal",
        referenceId:     saleId,
        referenceType:   "sale",
        referenceNumber: sale.invoiceNumber,
        debitAmount:     "0",
        creditAmount:    sale.totalAmount,
        description:     `Sale cancelled — Invoice: ${sale.invoiceNumber}`,
        entryDate:       new Date(),
      });
    }
  });
}

// ─── CONVERT ESTIMATE TO INVOICE ──────────────────────────────────────────
export async function convertEstimateToInvoice(saleId, businessId, payload) {
  const sale = await verifyOwnership(saleId, businessId);

  if (sale.saleType !== "estimate") {
    const e = new Error("Only estimates can be converted to invoices."); e.statusCode = 400; throw e;
  }

  const items = await db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, saleId));

  // Run stock check now that it's becoming a real sale
  const productIds = items.map((i) => i.productId).filter(Boolean);
  await validateAndFetchProducts(businessId, items, false);

  return await db.transaction(async (tx) => {
    // Decrement stock
    for (const item of items) {
      if (!item.productId) continue;

      await tx
        .update(products)
        .set({
          currentStock: sql`cast(current_stock as numeric) - ${parseFloat(item.quantity)}`,
          updatedAt:    new Date(),
        })
        .where(eq(products.id, item.productId));
    }

    // Update sale type + status
    const [updated] = await tx
      .update(sales)
      .set({
        saleType:    "invoice",
        status:      "confirmed",
        paymentMode: payload?.paymentMode ?? sale.paymentMode,
        updatedAt:   new Date(),
      })
      .where(eq(sales.id, saleId))
      .returning();

    // Post ledger entry (estimate had no ledger entry)
    if (sale.customerId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         sale.customerId,
        entryType:       "sale",
        referenceId:     saleId,
        referenceType:   "sale",
        referenceNumber: sale.invoiceNumber,
        debitAmount:     sale.totalAmount,
        creditAmount:    "0",
        description:     `Invoice confirmed from estimate — ${sale.invoiceNumber}`,
        entryDate:       new Date(),
      });
    }

    return getSaleWithItems(saleId);
  });
}

// ─── SALES SUMMARY (Dashboard use) ────────────────────────────────────────
export async function getSalesSummary(businessId, query) {
  const from = query.from ? new Date(query.from) : new Date(new Date().setDate(1)); // start of month
  const to   = query.to   ? new Date(query.to)   : new Date();

  const conditions = [
    eq(sales.businessId, businessId),
    eq(sales.isReturn, false),
    sql`${sales.status} not in ('cancelled', 'draft')`,
    sql`${sales.saleDate} >= ${from}`,
    sql`${sales.saleDate} <= ${to}`,
  ];

  const [summary] = await db
    .select({
      totalSales:      sql`count(*)::int`,
      totalRevenue:    sql`coalesce(sum(cast(total_amount as numeric)), 0)::numeric(14,2)`,
      totalReceived:   sql`coalesce(sum(cast(paid_amount as numeric)), 0)::numeric(14,2)`,
      totalOutstanding:sql`coalesce(sum(cast(balance_amount as numeric)), 0)::numeric(14,2)`,
      totalTax:        sql`coalesce(sum(
                            cast(cgst_amount as numeric) +
                            cast(sgst_amount as numeric) +
                            cast(igst_amount as numeric)
                          ), 0)::numeric(14,2)`,
    })
    .from(sales)
    .where(and(...conditions));

  return { from, to, ...summary };
}

// ─── TOP SELLING PRODUCTS ─────────────────────────────────────────────────
export async function getTopSellingProducts(businessId, query) {
  const from  = query.from  ? new Date(query.from)  : new Date(new Date().setDate(1));
  const to    = query.to    ? new Date(query.to)    : new Date();
  const limit = Math.min(parseInt(query.limit ?? 10), 50);

  const rows = await db
    .select({
      productId:    saleItems.productId,
      productName:  saleItems.productName,
      totalQty:     sql`sum(cast(${saleItems.quantity} as numeric))::numeric(12,3)`,
      totalRevenue: sql`sum(cast(${saleItems.totalAmount} as numeric))::numeric(12,2)`,
      orderCount:   sql`count(distinct ${saleItems.saleId})::int`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.isReturn, false),
        sql`${sales.status} not in ('cancelled', 'draft')`,
        sql`${sales.saleDate} >= ${from}`,
        sql`${sales.saleDate} <= ${to}`
      )
    )
    .groupBy(saleItems.productId, saleItems.productName)
    .orderBy(desc(sql`sum(cast(${saleItems.quantity} as numeric))`))
    .limit(limit);

  return rows;
}

// ─── LIST SALE RETURNS ─────────────────────────────────────────────────────
export async function listSaleReturns(businessId, query) {
  const page   = Math.max(parseInt(query.page  ?? DEFAULT_PAGE,  10), 1);
  const limit  = Math.min(parseInt(query.limit ?? DEFAULT_LIMIT, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(sales.businessId, businessId),
    eq(sales.isReturn, true),
  ];

  if (query.customerId) conditions.push(eq(sales.customerId, query.customerId));

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:             sales.id,
        customerId:     sales.customerId,
        customerName:   parties.name,
        invoiceNumber:  sales.invoiceNumber,
        saleDate:       sales.saleDate,
        totalAmount:    sales.totalAmount,
        originalSaleId: sales.originalSaleId,
        createdAt:      sales.createdAt,
      })
      .from(sales)
      .leftJoin(parties, eq(sales.customerId, parties.id))
      .where(and(...conditions))
      .orderBy(desc(sales.saleDate))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql`count(*)::int` })
      .from(sales)
      .where(and(...conditions)),
  ]);

  return {
    returns: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}