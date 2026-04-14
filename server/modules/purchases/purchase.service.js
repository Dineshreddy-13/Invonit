import { and, eq, desc, asc, sql, or, ilike } from "drizzle-orm";
import { db }            from "../../database/db.js";
import {
  purchases, purchaseItems,
  products, parties,
  payments, ledgerEntries,
} from "../../database/schemas/index.js";
import {
  MSG,
  DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT,
} from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error(MSG.PURCHASE_NOT_FOUND); e.statusCode = 404; return e;
}
function forbidden() {
  const e = new Error(MSG.PURCHASE_FORBIDDEN); e.statusCode = 403; return e;
}

async function verifyOwnership(purchaseId, businessId) {
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);

  if (!purchase) throw notFound();
  if (purchase.businessId !== businessId) throw forbidden();
  return purchase;
}

// ─── Calculate item financials ─────────────────────────────────────────────
function calcItem(item) {
  const qty           = parseFloat(item.quantity);
  const price         = parseFloat(item.purchasePrice);
  const discPct       = parseFloat(item.discountPercent ?? 0);

  const grossAmount   = qty * price;
  const discountAmt   = parseFloat(((grossAmount * discPct) / 100).toFixed(2));
  const taxableAmt    = parseFloat((grossAmount - discountAmt).toFixed(2));

  const cgstRate      = parseFloat(item.cgstRate ?? 0);
  const sgstRate      = parseFloat(item.sgstRate ?? 0);
  const igstRate      = parseFloat(item.igstRate ?? 0);

  // Use IGST for inter-state, CGST+SGST for intra-state
  // Frontend sends the correct rates based on transaction type
  const cgstAmt       = parseFloat(((taxableAmt * cgstRate) / 100).toFixed(2));
  const sgstAmt       = parseFloat(((taxableAmt * sgstRate) / 100).toFixed(2));
  const igstAmt       = parseFloat(((taxableAmt * igstRate) / 100).toFixed(2));
  const totalAmt      = parseFloat((taxableAmt + cgstAmt + sgstAmt + igstAmt).toFixed(2));

  return {
    discountAmount: discountAmt,
    taxableAmount:  taxableAmt,
    cgstAmount:     cgstAmt,
    sgstAmount:     sgstAmt,
    igstAmount:     igstAmt,
    totalAmount:    totalAmt,
  };
}

// ─── Aggregate header totals from items ───────────────────────────────────
function calcTotals(itemCalcs) {
  const totals = {
    subtotal:      0,
    discountAmount:0,
    taxableAmount: 0,
    cgstAmount:    0,
    sgstAmount:    0,
    igstAmount:    0,
    cessAmount:    0,
    totalAmount:   0,
  };

  for (const c of itemCalcs) {
    // subtotal = sum of (qty * price) before discount
    totals.subtotal       += c._gross;
    totals.discountAmount += c.discountAmount;
    totals.taxableAmount  += c.taxableAmount;
    totals.cgstAmount     += c.cgstAmount;
    totals.sgstAmount     += c.sgstAmount;
    totals.igstAmount     += c.igstAmount;
    totals.totalAmount    += c.totalAmount;
  }

  // Round to 2 decimal places
  for (const key of Object.keys(totals)) {
    totals[key] = parseFloat(totals[key].toFixed(2));
  }

  return totals;
}

// ─── Validate supplier ────────────────────────────────────────────────────
async function validateSupplier(supplierId, businessId) {
  if (!supplierId) return null;

  const [party] = await db
    .select({
      id:         parties.id,
      businessId: parties.businessId,
      partyType:  parties.partyType,
      isActive:   parties.isActive,
    })
    .from(parties)
    .where(eq(parties.id, supplierId))
    .limit(1);

  if (!party || party.businessId !== businessId || !party.isActive) {
    const e = new Error(MSG.SUPPLIER_NOT_VALID); e.statusCode = 400; throw e;
  }
  if (!["supplier", "both"].includes(party.partyType)) {
    const e = new Error(MSG.SUPPLIER_NOT_VALID); e.statusCode = 400; throw e;
  }
  return party;
}

// ─── Validate all products exist in this business ─────────────────────────
async function validateProducts(businessId, items) {
  const productIds = items
    .map((i) => i.productId)
    .filter(Boolean);

  if (productIds.length === 0) return {};

  const rows = await db
    .select({
      id:                products.id,
      name:              products.name,
      unit:              products.unit,
      hsnCode:           products.hsnCode,
      currentStock:      products.currentStock,
      allowNegativeStock:products.allowNegativeStock,
      trackInventory:    products.trackInventory,
      businessId:        products.businessId,
    })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.isActive, true)
      )
    );

  const productMap = {};
  for (const p of rows) {
    productMap[p.id] = p;
  }

  // Check all provided IDs are valid
  for (const id of productIds) {
    if (!productMap[id]) {
      const e = new Error(`Product ID ${id} not found in this business.`);
      e.statusCode = 400;
      throw e;
    }
  }

  return productMap;
}

// ─── Duplicate invoice check ──────────────────────────────────────────────
async function checkDuplicateInvoice(businessId, supplierId, invoiceNumber, excludeId = null) {
  if (!invoiceNumber || !supplierId) return false;

  const conditions = [
    eq(purchases.businessId,    businessId),
    eq(purchases.supplierId,    supplierId),
    eq(purchases.invoiceNumber, invoiceNumber),
  ];

  if (excludeId) {
    conditions.push(sql`${purchases.id} != ${excludeId}`);
  }

  const [dup] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(and(...conditions))
    .limit(1);

  return !!dup;
}

// ─── Fetch purchase with items ────────────────────────────────────────────
async function getPurchaseWithItems(purchaseId) {
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);

  if (!purchase) return null;

  const items = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, purchaseId))
    .orderBy(asc(purchaseItems.createdAt));

  return { ...purchase, items };
}

// ─── CREATE PURCHASE ───────────────────────────────────────────────────────
// Full ACID transaction:
// 1. Validate supplier + products
// 2. Duplicate invoice detection
// 3. Calculate all item and header totals
// 4. Insert purchase + purchaseItems
// 5. Increment product stock for each item
// 6. Insert ledger entry (supplier credit)
// 7. If payment provided → insert payment + ledger debit
export async function createPurchase(businessId, payload) {
  // ── Pre-transaction validations ──────────────────────────────────────
  await validateSupplier(payload.supplierId ?? null, businessId);

  const productMap = await validateProducts(businessId, payload.items);

  // Duplicate invoice detection
  const isDuplicate = await checkDuplicateInvoice(
    businessId,
    payload.supplierId,
    payload.invoiceNumber
  );

  if (isDuplicate && !payload.allowDuplicate) {
    const e = new Error(MSG.PURCHASE_DUPLICATE_INVOICE);
    e.statusCode = 409;
    e.isDuplicate = true;
    throw e;
  }

  // ── Calculate item totals ─────────────────────────────────────────────
  const itemCalcs = payload.items.map((item) => {
    const calc = calcItem(item);
    return {
      ...item,
      ...calc,
      _gross: parseFloat(item.quantity) * parseFloat(item.purchasePrice),
    };
  });

  const headerTotals = calcTotals(itemCalcs);

  // Bill total verification (optional — if frontend sends expected total)
  if (payload.expectedTotal !== undefined) {
    const diff = Math.abs(headerTotals.totalAmount - parseFloat(payload.expectedTotal));
    if (diff > 1) { // Allow ₹1 rounding tolerance
      const e = new Error(
        `Bill total mismatch. Calculated: ₹${headerTotals.totalAmount}, Expected: ₹${payload.expectedTotal}`
      );
      e.statusCode = 400;
      throw e;
    }
  }

  const paidAmount    = parseFloat(payload.paidAmount ?? 0);
  const balanceAmount = parseFloat((headerTotals.totalAmount - paidAmount).toFixed(2));
  const status        = payload.status ?? (balanceAmount <= 0 ? "received" : "partial");

  // ── ACID Transaction ──────────────────────────────────────────────────
  return await db.transaction(async (tx) => {

    // 1. Insert purchase header
    const [purchase] = await tx
      .insert(purchases)
      .values({
        businessId,
        supplierId:       payload.supplierId    ?? null,
        invoiceNumber:    payload.invoiceNumber  ?? null,
        referenceNumber:  payload.referenceNumber?? null,
        purchaseDate:     payload.purchaseDate
                            ? new Date(payload.purchaseDate)
                            : new Date(),
        dueDate:          payload.dueDate
                            ? new Date(payload.dueDate)
                            : null,
        status,
        source:           payload.source         ?? "manual",
        subtotal:         String(headerTotals.subtotal),
        discountAmount:   String(headerTotals.discountAmount),
        taxableAmount:    String(headerTotals.taxableAmount),
        cgstAmount:       String(headerTotals.cgstAmount),
        sgstAmount:       String(headerTotals.sgstAmount),
        igstAmount:       String(headerTotals.igstAmount),
        cessAmount:       "0",
        totalAmount:      String(headerTotals.totalAmount),
        paidAmount:       String(paidAmount),
        balanceAmount:    String(balanceAmount),
        paymentMode:      payload.paymentMode    ?? null,
        notes:            payload.notes          ?? null,
        billImageUrl:     payload.billImageUrl   ?? null,
        ocrRawData:       payload.ocrRawData     ?? null,
        isDuplicate,
        isReturn:         false,
      })
      .returning();

    // 2. Insert purchase items
    const itemValues = itemCalcs.map((item) => ({
      purchaseId:      purchase.id,
      productId:       item.productId    ?? null,
      productName:     item.productId
                         ? productMap[item.productId]?.name ?? item.productName
                         : item.productName,
      hsnCode:         item.hsnCode
                         ?? productMap[item.productId]?.hsnCode
                         ?? null,
      quantity:        String(item.quantity),
      unit:            item.unit
                         ?? productMap[item.productId]?.unit
                         ?? "pcs",
      purchasePrice:   String(item.purchasePrice),
      discountPercent: String(item.discountPercent ?? 0),
      discountAmount:  String(item.discountAmount),
      taxableAmount:   String(item.taxableAmount),
      cgstRate:        String(item.cgstRate ?? 0),
      sgstRate:        String(item.sgstRate ?? 0),
      igstRate:        String(item.igstRate ?? 0),
      cgstAmount:      String(item.cgstAmount),
      sgstAmount:      String(item.sgstAmount),
      igstAmount:      String(item.igstAmount),
      totalAmount:     String(item.totalAmount),
      isOcrMatched:    item.isOcrMatched ?? false,
    }));

    await tx.insert(purchaseItems).values(itemValues);

    // 3. Increment product stock for each item that has a productId
    for (const item of itemCalcs) {
      if (!item.productId) continue;

      await tx
        .update(products)
        .set({
          currentStock: sql`cast(current_stock as numeric) + ${parseFloat(item.quantity)}`,
          // Also update purchase price to latest
          purchasePrice: String(item.purchasePrice),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(products.id, item.productId),
            eq(products.businessId, businessId)
          )
        );
    }

    // 4. Supplier ledger entry (Credit supplier = business owes supplier)
    if (payload.supplierId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         payload.supplierId,
        entryType:       "purchase",
        referenceId:     purchase.id,
        referenceType:   "purchase",
        referenceNumber: payload.invoiceNumber ?? null,
        debitAmount:     "0",
        creditAmount:    String(headerTotals.totalAmount),
        description:     `Purchase from supplier — Invoice: ${payload.invoiceNumber ?? "N/A"}`,
        entryDate:       purchase.purchaseDate,
      });
    }

    // 5. If payment was made upfront, record it
    if (paidAmount > 0 && payload.supplierId) {
      // Payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          businessId,
          partyId:         payload.supplierId,
          paymentType:     "payment",
          referenceId:     purchase.id,
          referenceType:   "purchase",
          referenceNumber: payload.invoiceNumber ?? null,
          amount:          String(paidAmount),
          paymentMode:     payload.paymentMode ?? null,
          transactionRef:  payload.transactionRef ?? null,
          paymentDate:     purchase.purchaseDate,
          notes:           payload.notes ?? null,
        })
        .returning();

      // Ledger entry for payment (Debit supplier — reducing what we owe)
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         payload.supplierId,
        entryType:       "payment_made",
        referenceId:     payment.id,
        referenceType:   "payment",
        referenceNumber: payload.invoiceNumber ?? null,
        debitAmount:     String(paidAmount),
        creditAmount:    "0",
        description:     `Payment to supplier for Invoice: ${payload.invoiceNumber ?? "N/A"}`,
        entryDate:       purchase.purchaseDate,
      });
    }

    return getPurchaseWithItems(purchase.id);
  });
}

// ─── LIST PURCHASES ────────────────────────────────────────────────────────
export async function listPurchases(businessId, query) {
  const page   = Math.max(parseInt(query.page  ?? DEFAULT_PAGE,  10), 1);
  const limit  = Math.min(parseInt(query.limit ?? DEFAULT_LIMIT, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(purchases.businessId, businessId),
    eq(purchases.isReturn, false),
  ];

  if (query.supplierId) {
    conditions.push(eq(purchases.supplierId, query.supplierId));
  }

  if (query.status) {
    conditions.push(eq(purchases.status, query.status));
  }

  if (query.source) {
    conditions.push(eq(purchases.source, query.source));
  }

  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(
        ilike(purchases.invoiceNumber,   term),
        ilike(purchases.referenceNumber, term)
      )
    );
  }

  // Date range filter
  if (query.from) {
    conditions.push(sql`${purchases.purchaseDate} >= ${new Date(query.from)}`);
  }
  if (query.to) {
    conditions.push(sql`${purchases.purchaseDate} <= ${new Date(query.to)}`);
  }

  const whereClause = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:              purchases.id,
        businessId:      purchases.businessId,
        supplierId:      purchases.supplierId,
        supplierName:    parties.name,
        invoiceNumber:   purchases.invoiceNumber,
        referenceNumber: purchases.referenceNumber,
        purchaseDate:    purchases.purchaseDate,
        dueDate:         purchases.dueDate,
        status:          purchases.status,
        source:          purchases.source,
        totalAmount:     purchases.totalAmount,
        paidAmount:      purchases.paidAmount,
        balanceAmount:   purchases.balanceAmount,
        paymentMode:     purchases.paymentMode,
        isDuplicate:     purchases.isDuplicate,
        createdAt:       purchases.createdAt,
      })
      .from(purchases)
      .leftJoin(parties, eq(purchases.supplierId, parties.id))
      .where(whereClause)
      .orderBy(desc(purchases.purchaseDate))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql`count(*)::int` })
      .from(purchases)
      .where(whereClause),
  ]);

  return {
    purchases: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── GET PURCHASE BY ID ────────────────────────────────────────────────────
export async function getPurchaseById(purchaseId, businessId) {
  await verifyOwnership(purchaseId, businessId);
  return getPurchaseWithItems(purchaseId);
}

// ─── RECORD ADDITIONAL PAYMENT ────────────────────────────────────────────
// For paying off outstanding balance after the purchase was created
export async function recordPayment(purchaseId, businessId, payload) {
  const purchase = await verifyOwnership(purchaseId, businessId);

  const balance = parseFloat(purchase.balanceAmount);
  const amount  = parseFloat(payload.amount);

  if (amount <= 0) {
    const e = new Error("Payment amount must be greater than zero."); e.statusCode = 400; throw e;
  }
  if (amount > balance + 0.01) {
    const e = new Error(`Payment amount (₹${amount}) exceeds outstanding balance (₹${balance}).`);
    e.statusCode = 400;
    throw e;
  }

  return await db.transaction(async (tx) => {
    const newPaid    = parseFloat((parseFloat(purchase.paidAmount) + amount).toFixed(2));
    const newBalance = parseFloat((parseFloat(purchase.totalAmount) - newPaid).toFixed(2));
    const newStatus  = newBalance <= 0 ? "received" : "partial";

    // Update purchase paid/balance
    await tx
      .update(purchases)
      .set({
        paidAmount:    String(newPaid),
        balanceAmount: String(newBalance),
        status:        newStatus,
        updatedAt:     new Date(),
      })
      .where(eq(purchases.id, purchaseId));

    // Insert payment record
    const [payment] = await tx
      .insert(payments)
      .values({
        businessId,
        partyId:         purchase.supplierId,
        paymentType:     "payment",
        referenceId:     purchaseId,
        referenceType:   "purchase",
        referenceNumber: purchase.invoiceNumber,
        amount:          String(amount),
        paymentMode:     payload.paymentMode    ?? null,
        transactionRef:  payload.transactionRef ?? null,
        paymentDate:     payload.paymentDate
                           ? new Date(payload.paymentDate)
                           : new Date(),
        notes:           payload.notes ?? null,
      })
      .returning();

    // Ledger entry (Debit supplier)
    if (purchase.supplierId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         purchase.supplierId,
        entryType:       "payment_made",
        referenceId:     payment.id,
        referenceType:   "payment",
        referenceNumber: purchase.invoiceNumber,
        debitAmount:     String(amount),
        creditAmount:    "0",
        description:     `Payment to supplier for Invoice: ${purchase.invoiceNumber ?? "N/A"}`,
        entryDate:       payment.paymentDate,
      });
    }

    return { payment, newPaid, newBalance, status: newStatus };
  });
}

// ─── PURCHASE RETURN ──────────────────────────────────────────────────────
// Creates a return record and DECREMENTS stock
export async function createPurchaseReturn(purchaseId, businessId, payload) {
  const original = await verifyOwnership(purchaseId, businessId);

  if (original.status === "cancelled") {
    const e = new Error(MSG.PURCHASE_CANNOT_RETURN); e.statusCode = 400; throw e;
  }
  if (original.isReturn) {
    const e = new Error("Cannot return a purchase return."); e.statusCode = 400; throw e;
  }
  if (original.status === "returned") {
    const e = new Error(MSG.PURCHASE_ALREADY_RETURNED); e.statusCode = 409; throw e;
  }

  // Get original items
  const originalItems = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, purchaseId));

  // Build return items — use original if no specific items provided
  const returnItems = payload.items ?? originalItems.map((i) => ({
    productId:     i.productId,
    productName:   i.productName,
    hsnCode:       i.hsnCode,
    quantity:      i.quantity,
    unit:          i.unit,
    purchasePrice: i.purchasePrice,
    discountPercent:i.discountPercent,
    cgstRate:      i.cgstRate,
    sgstRate:      i.sgstRate,
    igstRate:      i.igstRate,
  }));

  const itemCalcs = returnItems.map((item) => {
    const calc = calcItem(item);
    return { ...item, ...calc, _gross: parseFloat(item.quantity) * parseFloat(item.purchasePrice) };
  });

  const headerTotals = calcTotals(itemCalcs);

  return await db.transaction(async (tx) => {
    // 1. Insert return purchase
    const [returnPurchase] = await tx
      .insert(purchases)
      .values({
        businessId,
        supplierId:        original.supplierId,
        invoiceNumber:     payload.returnInvoiceNumber ?? null,
        referenceNumber:   original.invoiceNumber,
        purchaseDate:      new Date(),
        status:            "returned",
        source:            "manual",
        subtotal:          String(headerTotals.subtotal),
        discountAmount:    String(headerTotals.discountAmount),
        taxableAmount:     String(headerTotals.taxableAmount),
        cgstAmount:        String(headerTotals.cgstAmount),
        sgstAmount:        String(headerTotals.sgstAmount),
        igstAmount:        String(headerTotals.igstAmount),
        cessAmount:        "0",
        totalAmount:       String(headerTotals.totalAmount),
        paidAmount:        String(headerTotals.totalAmount),
        balanceAmount:     "0",
        notes:             payload.notes ?? `Return of purchase ${original.invoiceNumber ?? purchaseId}`,
        isReturn:          true,
        originalPurchaseId:purchaseId,
      })
      .returning();

    // 2. Insert return items
    await tx.insert(purchaseItems).values(
      itemCalcs.map((item) => ({
        purchaseId:      returnPurchase.id,
        productId:       item.productId ?? null,
        productName:     item.productName,
        hsnCode:         item.hsnCode   ?? null,
        quantity:        String(item.quantity),
        unit:            item.unit      ?? "pcs",
        purchasePrice:   String(item.purchasePrice),
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

    // 3. Decrement stock for returned items
    for (const item of itemCalcs) {
      if (!item.productId) continue;

      const [product] = await tx
        .select({ currentStock: products.currentStock, allowNegativeStock: products.allowNegativeStock })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      const newStock = parseFloat(product.currentStock) - parseFloat(item.quantity);

      if (newStock < 0 && !product.allowNegativeStock) {
        throw new Error(
          `Cannot return ${item.quantity} units of "${item.productName}" — insufficient stock.`
        );
      }

      await tx
        .update(products)
        .set({
          currentStock: String(newStock),
          updatedAt:    new Date(),
        })
        .where(eq(products.id, item.productId));
    }

    // 4. Mark original purchase as returned
    await tx
      .update(purchases)
      .set({ status: "returned", updatedAt: new Date() })
      .where(eq(purchases.id, purchaseId));

    // 5. Reverse ledger entry (Debit supplier — they owe us back)
    if (original.supplierId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         original.supplierId,
        entryType:       "purchase_return",
        referenceId:     returnPurchase.id,
        referenceType:   "purchase",
        referenceNumber: payload.returnInvoiceNumber ?? null,
        debitAmount:     String(headerTotals.totalAmount),
        creditAmount:    "0",
        description:     `Purchase return — Original Invoice: ${original.invoiceNumber ?? purchaseId}`,
        entryDate:       new Date(),
      });
    }

    return getPurchaseWithItems(returnPurchase.id);
  });
}

// ─── CANCEL PURCHASE ──────────────────────────────────────────────────────
// Reverses stock and ledger. Only for draft purchases.
export async function cancelPurchase(purchaseId, businessId) {
  const purchase = await verifyOwnership(purchaseId, businessId);

  if (purchase.status === "cancelled") {
    const e = new Error("Purchase is already cancelled."); e.statusCode = 409; throw e;
  }
  if (purchase.isReturn) {
    const e = new Error("Cannot cancel a purchase return."); e.statusCode = 400; throw e;
  }

  const items = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, purchaseId));

  return await db.transaction(async (tx) => {
    // Reverse stock increments
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

    // Mark cancelled
    await tx
      .update(purchases)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(purchases.id, purchaseId));

    // Reverse ledger entry
    if (purchase.supplierId) {
      await tx.insert(ledgerEntries).values({
        businessId,
        partyId:         purchase.supplierId,
        entryType:       "journal",
        referenceId:     purchaseId,
        referenceType:   "purchase",
        referenceNumber: purchase.invoiceNumber,
        debitAmount:     purchase.totalAmount,
        creditAmount:    "0",
        description:     `Purchase cancelled — Invoice: ${purchase.invoiceNumber ?? purchaseId}`,
        entryDate:       new Date(),
      });
    }
  });
}

// ─── GET PURCHASE RETURNS ─────────────────────────────────────────────────
export async function listPurchaseReturns(businessId, query) {
  const page   = Math.max(parseInt(query.page  ?? DEFAULT_PAGE,  10), 1);
  const limit  = Math.min(parseInt(query.limit ?? DEFAULT_LIMIT, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(purchases.businessId, businessId),
    eq(purchases.isReturn, true),
  ];

  if (query.supplierId) {
    conditions.push(eq(purchases.supplierId, query.supplierId));
  }

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:              purchases.id,
        supplierId:      purchases.supplierId,
        supplierName:    parties.name,
        invoiceNumber:   purchases.invoiceNumber,
        referenceNumber: purchases.referenceNumber,
        purchaseDate:    purchases.purchaseDate,
        totalAmount:     purchases.totalAmount,
        originalPurchaseId: purchases.originalPurchaseId,
        createdAt:       purchases.createdAt,
      })
      .from(purchases)
      .leftJoin(parties, eq(purchases.supplierId, parties.id))
      .where(and(...conditions))
      .orderBy(desc(purchases.purchaseDate))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql`count(*)::int` })
      .from(purchases)
      .where(and(...conditions)),
  ]);

  return {
    returns: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}