import { and, eq, inArray, gte, lte, sql, desc, isNotNull } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  sales, saleItems, purchases, purchaseItems, products, categories, parties, ledgerEntries,
} from "../../database/schemas/index.js";
import { MSG, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound(type = "Party") {
  const e = new Error(`${type} not found.`);
  e.statusCode = 404;
  return e;
}

function forbidden(type = "Party") {
  const e = new Error(`You do not have access to this ${type.toLowerCase()}.`);
  e.statusCode = 403;
  return e;
}

async function verifyPartyOwnership(partyId, businessId) {
  const [party] = await db
    .select()
    .from(parties)
    .where(eq(parties.id, partyId))
    .limit(1);

  if (!party) throw notFound("Party");
  if (party.businessId !== businessId) throw forbidden("Party");
  return party;
}

// ─── Sales Report ─────────────────────────────────────────────────────────

export async function getSalesReport(businessId, { from, to, customerId, groupBy = "day" }) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? (() => {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : new Date();

  const conditions = [
    eq(sales.businessId, businessId),
    inArray(sales.status, ["confirmed", "delivered"]),
    eq(sales.isReturn, false),
    gte(sales.saleDate, fromDate),
    lte(sales.saleDate, toDate),
  ];

  if (customerId) {
    conditions.push(eq(sales.customerId, customerId));
  }

  let salesList;
  let totals = { totalSales: 0, totalRevenue: "0", totalTax: "0" };

  if (groupBy === "day" || groupBy === "none") {
    salesList = await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        customerId: sales.customerId,
        customerName: parties.name,
        totalAmount: sales.totalAmount,
        taxableAmount: sales.taxableAmount,
        cgstAmount: sales.cgstAmount,
        sgstAmount: sales.sgstAmount,
        igstAmount: sales.igstAmount,
        saleDate: sales.saleDate,
        status: sales.status,
      })
      .from(sales)
      .leftJoin(parties, eq(sales.customerId, parties.id))
      .where(and(...conditions))
      .orderBy(desc(sales.saleDate));

    const totalRevenue = salesList.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
    const totalTax = salesList.reduce((sum, s) => sum + (parseFloat(s.cgstAmount || 0) + parseFloat(s.sgstAmount || 0) + parseFloat(s.igstAmount || 0)), 0);

    totals = {
      totalSales: salesList.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalTax: totalTax.toFixed(2),
    };
  } else if (groupBy === "week" || groupBy === "month") {
    const allSales = await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        saleDate: sales.saleDate,
        cgstAmount: sales.cgstAmount,
        sgstAmount: sales.sgstAmount,
        igstAmount: sales.igstAmount,
      })
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.saleDate));

    const grouped = {};
    allSales.forEach(sale => {
      let period;
      if (groupBy === "week") {
        const date = new Date(sale.saleDate);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        period = startOfWeek.toISOString().split("T")[0];
      } else {
        period = sale.saleDate.toISOString().split("T")[0].slice(0, 7);
      }

      if (!grouped[period]) {
        grouped[period] = { period, totalSales: 0, totalRevenue: 0, totalTax: 0 };
      }
      grouped[period].totalSales += 1;
      grouped[period].totalRevenue += parseFloat(sale.totalAmount || 0);
      grouped[period].totalTax += parseFloat(sale.cgstAmount || 0) + parseFloat(sale.sgstAmount || 0) + parseFloat(sale.igstAmount || 0);
    });

    salesList = Object.values(grouped).map(g => ({
      ...g,
      totalRevenue: g.totalRevenue.toFixed(2),
      totalTax: g.totalTax.toFixed(2),
    }));

    const totalRevenue = allSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
    const totalTax = allSales.reduce((sum, s) => sum + (parseFloat(s.cgstAmount || 0) + parseFloat(s.sgstAmount || 0) + parseFloat(s.igstAmount || 0)), 0);

    totals = {
      totalSales: allSales.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalTax: totalTax.toFixed(2),
    };
  }

  return { data: salesList, totals };
}

// ─── Purchases Report ─────────────────────────────────────────────────────

export async function getPurchasesReport(businessId, { from, to, supplierId, groupBy = "day" }) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? (() => {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : new Date();

  const conditions = [
    eq(purchases.businessId, businessId),
    inArray(purchases.status, ["received", "partial"]),
    eq(purchases.isReturn, false),
    gte(purchases.purchaseDate, fromDate),
    lte(purchases.purchaseDate, toDate),
  ];

  if (supplierId) {
    conditions.push(eq(purchases.supplierId, supplierId));
  }

  let purchasesList;
  let totals = { totalPurchases: 0, totalAmount: "0", totalTax: "0" };

  if (groupBy === "day" || groupBy === "none") {
    purchasesList = await db
      .select({
        id: purchases.id,
        invoiceNumber: purchases.invoiceNumber,
        supplierId: purchases.supplierId,
        supplierName: parties.name,
        totalAmount: purchases.totalAmount,
        taxableAmount: purchases.taxableAmount,
        cgstAmount: purchases.cgstAmount,
        sgstAmount: purchases.sgstAmount,
        igstAmount: purchases.igstAmount,
        purchaseDate: purchases.purchaseDate,
        status: purchases.status,
      })
      .from(purchases)
      .leftJoin(parties, eq(purchases.supplierId, parties.id))
      .where(and(...conditions))
      .orderBy(desc(purchases.purchaseDate));

    const totalAmount = purchasesList.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0);
    const totalTax = purchasesList.reduce((sum, p) => sum + (parseFloat(p.cgstAmount || 0) + parseFloat(p.sgstAmount || 0) + parseFloat(p.igstAmount || 0)), 0);

    totals = {
      totalPurchases: purchasesList.length,
      totalAmount: totalAmount.toFixed(2),
      totalTax: totalTax.toFixed(2),
    };
  } else if (groupBy === "week" || groupBy === "month") {
    const allPurchases = await db
      .select({
        id: purchases.id,
        totalAmount: purchases.totalAmount,
        purchaseDate: purchases.purchaseDate,
        cgstAmount: purchases.cgstAmount,
        sgstAmount: purchases.sgstAmount,
        igstAmount: purchases.igstAmount,
      })
      .from(purchases)
      .where(and(...conditions))
      .orderBy(desc(purchases.purchaseDate));

    const grouped = {};
    allPurchases.forEach(pur => {
      let period;
      if (groupBy === "week") {
        const date = new Date(pur.purchaseDate);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        period = startOfWeek.toISOString().split("T")[0];
      } else {
        period = pur.purchaseDate.toISOString().split("T")[0].slice(0, 7);
      }

      if (!grouped[period]) {
        grouped[period] = { period, totalPurchases: 0, totalAmount: 0, totalTax: 0 };
      }
      grouped[period].totalPurchases += 1;
      grouped[period].totalAmount += parseFloat(pur.totalAmount || 0);
      grouped[period].totalTax += parseFloat(pur.cgstAmount || 0) + parseFloat(pur.sgstAmount || 0) + parseFloat(pur.igstAmount || 0);
    });

    purchasesList = Object.values(grouped).map(g => ({
      ...g,
      totalAmount: g.totalAmount.toFixed(2),
      totalTax: g.totalTax.toFixed(2),
    }));

    const totalAmount = allPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0);
    const totalTax = allPurchases.reduce((sum, p) => sum + (parseFloat(p.cgstAmount || 0) + parseFloat(p.sgstAmount || 0) + parseFloat(p.igstAmount || 0)), 0);

    totals = {
      totalPurchases: allPurchases.length,
      totalAmount: totalAmount.toFixed(2),
      totalTax: totalTax.toFixed(2),
    };
  }

  return { data: purchasesList, totals };
}

// ─── Stock Report ─────────────────────────────────────────────────────────

export async function getStockReport(businessId, { categoryId, lowStock, search, sortBy = "name" }) {
  const conditions = [
    eq(products.businessId, businessId),
    eq(products.isActive, true),
  ];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (lowStock === "true") {
    conditions.push(sql`cast(${products.currentStock} as numeric) <= cast(${products.lowStockThreshold} as numeric)`);
  }

  if (search) {
    conditions.push(sql`(LOWER(${products.name}) LIKE LOWER(${"%" + search + "%"}) OR LOWER(${products.sku}) LIKE LOWER(${"%" + search + "%"}))`);
  }

  let orderByClause = products.name;
  if (sortBy === "currentStock") {
    orderByClause = sql`cast(${products.currentStock} as numeric)`;
  } else if (sortBy === "stockValue") {
    orderByClause = sql`cast(${products.currentStock} as numeric) * cast(${products.purchasePrice} as numeric)`;
  }

  const stockData = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      unit: products.unit,
      currentStock: products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      purchasePrice: products.purchasePrice,
      sellingPrice: products.sellingPrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderByClause);

  const data = stockData.map(row => {
    const stockValue = (parseFloat(row.currentStock || 0) * parseFloat(row.purchasePrice || 0)).toFixed(2);
    return {
      ...row,
      stockValue,
    };
  });

  const totalStockValue = data.reduce((sum, item) => sum + parseFloat(item.stockValue), 0);
  const lowStockCount = data.filter(item => parseFloat(item.currentStock) <= parseFloat(item.lowStockThreshold)).length;
  const outOfStockCount = data.filter(item => parseFloat(item.currentStock) === 0).length;

  return {
    data,
    summary: {
      totalProducts: data.length,
      totalStockValue: totalStockValue.toFixed(2),
      lowStockCount,
      outOfStockCount,
    },
  };
}

// ─── Party Statement (Detailed) ───────────────────────────────────────────

export async function getPartyStatement(partyId, businessId, { from, to }) {
  const party = await verifyPartyOwnership(partyId, businessId);

  const conditions = [
    eq(ledgerEntries.businessId, businessId),
    eq(ledgerEntries.partyId, partyId),
  ];

  if (from) {
    conditions.push(gte(ledgerEntries.entryDate, new Date(from)));
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(ledgerEntries.entryDate, toDate));
  }

  const entries = await db
    .select({
      id: ledgerEntries.id,
      entryType: ledgerEntries.entryType,
      referenceNumber: ledgerEntries.referenceNumber,
      debitAmount: ledgerEntries.debitAmount,
      creditAmount: ledgerEntries.creditAmount,
      description: ledgerEntries.description,
      entryDate: ledgerEntries.entryDate,
    })
    .from(ledgerEntries)
    .where(and(...conditions))
    .orderBy(desc(ledgerEntries.entryDate));

  let openingBal = parseFloat(party.openingBalance || 0);
  if (party.openingBalanceType === "Cr") {
    openingBal = -openingBal;
  }

  let runningBalance = openingBal;
  const withBalance = entries.map(entry => {
    runningBalance += parseFloat(entry.debitAmount || 0) - parseFloat(entry.creditAmount || 0);
    const balanceType = runningBalance >= 0 ? "Dr" : "Cr";
    return {
      date: entry.entryDate.toISOString().split("T")[0],
      type: entry.entryType,
      referenceNumber: entry.referenceNumber,
      description: entry.description,
      debit: parseFloat(entry.debitAmount || 0).toFixed(2),
      credit: parseFloat(entry.creditAmount || 0).toFixed(2),
      runningBalance: Math.abs(runningBalance).toFixed(2),
      balanceType,
    };
  });

  const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debitAmount || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.creditAmount || 0), 0);
  const closingBal = Math.abs(runningBalance);
  const closingBalanceType = runningBalance >= 0 ? "Dr" : "Cr";

  return {
    party: {
      id: party.id,
      name: party.name,
      phone: party.phone,
      email: party.email,
      gstin: party.gstin,
      partyType: party.partyType,
    },
    period: {
      from: from ? new Date(from).toISOString().split("T")[0] : null,
      to: to ? new Date(to).toISOString().split("T")[0] : null,
    },
    openingBalance: Math.abs(openingBal).toFixed(2),
    openingBalanceType: openingBal >= 0 ? "Dr" : "Cr",
    transactions: withBalance,
    closingBalance: closingBal.toFixed(2),
    closingBalanceType,
    summary: {
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    },
  };
}

// ─── Monthly Analysis ─────────────────────────────────────────────────────

export async function getMonthlyAnalysis(businessId, { year }) {
  const yr = parseInt(year) || new Date().getFullYear();

  const months = [];
  for (let m = 0; m < 12; m++) {
    const startOfMonth = new Date(yr, m, 1);
    const endOfMonth = new Date(yr, m + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const [salesData] = await db
      .select({
        count: sql`count(*)::int`,
        revenue: sql`COALESCE(SUM(cast(${sales.totalAmount} as numeric)), 0)`,
        tax: sql`COALESCE(SUM(cast(${sales.cgstAmount} as numeric) + cast(${sales.sgstAmount} as numeric) + cast(${sales.igstAmount} as numeric)), 0)`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.businessId, businessId),
          inArray(sales.status, ["confirmed", "delivered"]),
          eq(sales.isReturn, false),
          gte(sales.saleDate, startOfMonth),
          lte(sales.saleDate, endOfMonth)
        )
      );

    const [purchasesData] = await db
      .select({
        count: sql`count(*)::int`,
        amount: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
        tax: sql`COALESCE(SUM(cast(${purchases.cgstAmount} as numeric) + cast(${purchases.sgstAmount} as numeric) + cast(${purchases.igstAmount} as numeric)), 0)`,
      })
      .from(purchases)
      .where(
        and(
          eq(purchases.businessId, businessId),
          inArray(purchases.status, ["received", "partial"]),
          eq(purchases.isReturn, false),
          gte(purchases.purchaseDate, startOfMonth),
          lte(purchases.purchaseDate, endOfMonth)
        )
      );

    const [expensesData] = await db
      .select({
        count: sql`count(*)::int`,
        amount: sql`COALESCE(SUM(cast(${sql.raw("expenses.amount")} as numeric) + cast(${sql.raw("expenses.gstAmount")} as numeric)), 0)`,
      })
      .from(sql.raw("expenses"))
      .where(
        and(
          sql`expenses.businessId = ${businessId}`,
          sql`expenses.expenseDate >= ${startOfMonth}`,
          sql`expenses.expenseDate <= ${endOfMonth}`
        )
      );

    const revenue = parseFloat(salesData?.revenue || 0);
    const purchaseAmount = parseFloat(purchasesData?.amount || 0);
    const expenseAmount = parseFloat(expensesData?.amount || 0);
    const profit = revenue - purchaseAmount - expenseAmount;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    months.push({
      month: m + 1,
      monthName: monthNames[m],
      sales: {
        count: salesData?.count || 0,
        revenue: revenue.toFixed(2),
        tax: (parseFloat(salesData?.tax || 0)).toFixed(2),
      },
      purchases: {
        count: purchasesData?.count || 0,
        amount: purchaseAmount.toFixed(2),
        tax: (parseFloat(purchasesData?.tax || 0)).toFixed(2),
      },
      expenses: {
        count: expensesData?.count || 0,
        amount: expenseAmount.toFixed(2),
      },
      profit: profit.toFixed(2),
    });
  }

  const totalRevenue = months.reduce((sum, m) => sum + parseFloat(m.sales.revenue), 0);
  const totalPurchases = months.reduce((sum, m) => sum + parseFloat(m.purchases.amount), 0);
  const totalExpenses = months.reduce((sum, m) => sum + parseFloat(m.expenses.amount), 0);
  const totalProfit = totalRevenue - totalPurchases - totalExpenses;

  return {
    year: yr,
    months,
    totals: {
      totalRevenue: totalRevenue.toFixed(2),
      totalPurchases: totalPurchases.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
    },
  };
}

// ─── Top Customers ───────────────────────────────────────────────────────

export async function getTopCustomers(businessId, { from, to, limit = 10 }) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? (() => {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : new Date();

  const lim = Math.min(parseInt(limit) || 10, 50);

  const topCustomers = await db
    .select({
      customerId: sales.customerId,
      customerName: parties.name,
      phone: parties.phone,
      totalInvoices: sql`count(*)::int`,
      totalAmount: sql`COALESCE(SUM(cast(${sales.totalAmount} as numeric)), 0)`,
      totalPaid: sql`COALESCE(SUM(cast(${sales.paidAmount} as numeric)), 0)`,
    })
    .from(sales)
    .innerJoin(parties, eq(sales.customerId, parties.id))
    .where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    )
    .groupBy(sales.customerId, parties.name, parties.phone)
    .orderBy(desc(sql`SUM(cast(${sales.totalAmount} as numeric))`))
    .limit(lim);

  return {
    data: topCustomers.map(row => ({
      customerId: row.customerId,
      customerName: row.customerName,
      phone: row.phone,
      totalInvoices: row.totalInvoices,
      totalAmount: parseFloat(row.totalAmount).toFixed(2),
      totalPaid: parseFloat(row.totalPaid).toFixed(2),
      totalOutstanding: (parseFloat(row.totalAmount) - parseFloat(row.totalPaid)).toFixed(2),
    })),
  };
}

// ─── Top Suppliers ───────────────────────────────────────────────────────

export async function getTopSuppliers(businessId, { from, to, limit = 10 }) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? (() => {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : new Date();

  const lim = Math.min(parseInt(limit) || 10, 50);

  const topSuppliers = await db
    .select({
      supplierId: purchases.supplierId,
      supplierName: parties.name,
      phone: parties.phone,
      totalInvoices: sql`count(*)::int`,
      totalAmount: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
      totalPaid: sql`COALESCE(SUM(cast(${purchases.paidAmount} as numeric)), 0)`,
    })
    .from(purchases)
    .innerJoin(parties, eq(purchases.supplierId, parties.id))
    .where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"]),
        eq(purchases.isReturn, false),
        gte(purchases.purchaseDate, fromDate),
        lte(purchases.purchaseDate, toDate)
      )
    )
    .groupBy(purchases.supplierId, parties.name, parties.phone)
    .orderBy(desc(sql`SUM(cast(${purchases.totalAmount} as numeric))`))
    .limit(lim);

  return {
    data: topSuppliers.map(row => ({
      supplierId: row.supplierId,
      supplierName: row.supplierName,
      phone: row.phone,
      totalInvoices: row.totalInvoices,
      totalAmount: parseFloat(row.totalAmount).toFixed(2),
      totalPaid: parseFloat(row.totalPaid).toFixed(2),
      totalOutstanding: (parseFloat(row.totalAmount) - parseFloat(row.totalPaid)).toFixed(2),
    })),
  };
}
