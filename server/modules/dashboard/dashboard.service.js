import { and, eq, inArray, gte, lte, sql, desc, lt, isNotNull, isNull } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  sales, purchases, expenses, products, parties, ledgerEntries,
} from "../../database/schemas/index.js";
import { MSG } from "../../utils/constants.js";

// ─── Dashboard Overview ────────────────────────────────────────────────────

export async function getDashboardOverview(businessId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  // Parallel queries
  const [todaySales, todayPurchases, todayExpenses, monthSales, monthPurchases, monthExpenses, allProducts, customerParties, supplierParties, recentSales, recentPurchases, lowStockAlertsData, overduePayables, overdueReceivables] = await Promise.all([
    // Today sales
    db.select({
      count: sql`count(*)::int`,
      revenue: sql`COALESCE(SUM(cast(${sales.totalAmount} as numeric)), 0)`,
      collected: sql`COALESCE(SUM(cast(${sales.paidAmount} as numeric)), 0)`,
    }).from(sales).where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        gte(sales.saleDate, today),
        lte(sales.saleDate, todayEnd)
      )
    ),

    // Today purchases
    db.select({
      count: sql`count(*)::int`,
      amount: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
    }).from(purchases).where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"]),
        eq(purchases.isReturn, false),
        gte(purchases.purchaseDate, today),
        lte(purchases.purchaseDate, todayEnd)
      )
    ),

    // Today expenses
    db.select({
      amount: sql`COALESCE(SUM(cast(${expenses.amount} as numeric) + cast(${expenses.gstAmount} as numeric)), 0)`,
    }).from(expenses).where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.expenseDate, today),
        lte(expenses.expenseDate, todayEnd)
      )
    ),

    // Month sales
    db.select({
      revenue: sql`COALESCE(SUM(cast(${sales.totalAmount} as numeric)), 0)`,
      collected: sql`COALESCE(SUM(cast(${sales.paidAmount} as numeric)), 0)`,
    }).from(sales).where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"]),
        eq(sales.isReturn, false),
        gte(sales.saleDate, monthStart),
        lte(sales.saleDate, monthEnd)
      )
    ),

    // Month purchases
    db.select({
      amount: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
    }).from(purchases).where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"]),
        eq(purchases.isReturn, false),
        gte(purchases.purchaseDate, monthStart),
        lte(purchases.purchaseDate, monthEnd)
      )
    ),

    // Month expenses
    db.select({
      amount: sql`COALESCE(SUM(cast(${expenses.amount} as numeric) + cast(${expenses.gstAmount} as numeric)), 0)`,
    }).from(expenses).where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.expenseDate, monthStart),
        lte(expenses.expenseDate, monthEnd)
      )
    ),

    // All products
    db.select({ count: sql`count(*)::int` }).from(products).where(
      and(eq(products.businessId, businessId), eq(products.isActive, true))
    ),

    // Customer parties for receivable
    db.select({ id: parties.id }).from(parties).where(
      and(
        eq(parties.businessId, businessId),
        inArray(parties.partyType, ["customer", "both"])
      )
    ),

    // Supplier parties for payable
    db.select({ id: parties.id }).from(parties).where(
      and(
        eq(parties.businessId, businessId),
        inArray(parties.partyType, ["supplier", "both"])
      )
    ),

    // Recent sales (last 5)
    db.select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerId: sales.customerId,
      customerName: sql`(SELECT name FROM ${parties} WHERE id = ${sales.customerId})`,
      totalAmount: sales.totalAmount,
      saleDate: sales.saleDate,
      status: sales.status,
    }).from(sales).where(
      and(
        eq(sales.businessId, businessId),
        inArray(sales.status, ["confirmed", "delivered"])
      )
    ).orderBy(desc(sales.saleDate)).limit(5),

    // Recent purchases (last 5)
    db.select({
      id: purchases.id,
      invoiceNumber: purchases.invoiceNumber,
      supplierId: purchases.supplierId,
      supplierName: sql`(SELECT name FROM ${parties} WHERE id = ${purchases.supplierId})`,
      totalAmount: purchases.totalAmount,
      purchaseDate: purchases.purchaseDate,
      status: purchases.status,
    }).from(purchases).where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"])
      )
    ).orderBy(desc(purchases.purchaseDate)).limit(5),

    // Low stock items (up to 5)
    db.select({
      id: products.id,
      name: products.name,
      currentStock: products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      unit: products.unit,
    }).from(products).where(
      and(
        eq(products.businessId, businessId),
        eq(products.isActive, true),
        sql`cast(${products.currentStock} as numeric) <= cast(${products.lowStockThreshold} as numeric)`
      )
    ).limit(5),

    // Overdue payables
    db.select({
      id: purchases.id,
      invoiceNumber: purchases.invoiceNumber,
      supplierName: parties.name,
      balanceAmount: sql`cast(${purchases.totalAmount} as numeric) - cast(${purchases.paidAmount} as numeric)`,
      dueDate: purchases.dueDate,
    }).from(purchases).innerJoin(parties, eq(purchases.supplierId, parties.id)).where(
      and(
        eq(purchases.businessId, businessId),
        lt(purchases.dueDate, today),
        sql`cast(${purchases.totalAmount} as numeric) - cast(${purchases.paidAmount} as numeric) > 0`
      )
    ).limit(5),

    // Overdue receivables
    db.select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerName: parties.name,
      balanceAmount: sql`cast(${sales.totalAmount} as numeric) - cast(${sales.paidAmount} as numeric)`,
      dueDate: sales.dueDate,
    }).from(sales).innerJoin(parties, eq(sales.customerId, parties.id)).where(
      and(
        eq(sales.businessId, businessId),
        lt(sales.dueDate, today),
        sql`cast(${sales.totalAmount} as numeric) - cast(${sales.paidAmount} as numeric) > 0`
      )
    ).limit(5),
  ]);

  // Calculate inventory value
  const [invValue] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${products.currentStock} as numeric) * cast(${products.purchasePrice} as numeric)), 0)`,
      lowStockCount: sql`count(case when cast(${products.currentStock} as numeric) <= cast(${products.lowStockThreshold} as numeric) then 1 end)::int`,
      outOfStockCount: sql`count(case when cast(${products.currentStock} as numeric) = 0 then 1 end)::int`,
    })
    .from(products)
    .where(
      and(eq(products.businessId, businessId), eq(products.isActive, true))
    );

  // Calculate outstanding balances
  let totalReceivable = 0;
  let totalPayable = 0;

  for (const cust of customerParties) {
    const [ledg] = await db
      .select({
        opening: sql`(SELECT opening_balance FROM ${parties} WHERE id = ${cust.id})`,
        openingType: sql`(SELECT opening_balance_type FROM ${parties} WHERE id = ${cust.id})`,
        debits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
        credits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.businessId, businessId),
          eq(ledgerEntries.partyId, cust.id)
        )
      );

    let opening = parseFloat(ledg?.opening || 0);
    if (ledg?.openingType === "Cr") opening = -opening;
    const balance = opening + parseFloat(ledg?.debits || 0) - parseFloat(ledg?.credits || 0);
    if (balance > 0) totalReceivable += balance;
  }

  for (const supp of supplierParties) {
    const [ledg] = await db
      .select({
        opening: sql`(SELECT opening_balance FROM ${parties} WHERE id = ${supp.id})`,
        openingType: sql`(SELECT opening_balance_type FROM ${parties} WHERE id = ${supp.id})`,
        debits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
        credits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.businessId, businessId),
          eq(ledgerEntries.partyId, supp.id)
        )
      );

    let opening = parseFloat(ledg?.opening || 0);
    if (ledg?.openingType === "Cr") opening = -opening;
    const balance = opening + parseFloat(ledg?.debits || 0) - parseFloat(ledg?.credits || 0);
    if (balance < 0) totalPayable -= balance;
  }

  const monthProfit = parseFloat(monthSales[0]?.revenue || 0) - parseFloat(monthPurchases[0]?.amount || 0) - parseFloat(monthExpenses[0]?.amount || 0);

  return {
    today: {
      salesCount: todaySales[0]?.count || 0,
      salesRevenue: parseFloat(todaySales[0]?.revenue || 0).toFixed(2),
      salesCollection: parseFloat(todaySales[0]?.collected || 0).toFixed(2),
      purchasesCount: todayPurchases[0]?.count || 0,
      purchasesAmount: parseFloat(todayPurchases[0]?.amount || 0).toFixed(2),
      expensesAmount: parseFloat(todayExpenses[0]?.amount || 0).toFixed(2),
    },
    thisMonth: {
      salesRevenue: parseFloat(monthSales[0]?.revenue || 0).toFixed(2),
      salesCollection: parseFloat(monthSales[0]?.collected || 0).toFixed(2),
      purchasesAmount: parseFloat(monthPurchases[0]?.amount || 0).toFixed(2),
      expensesAmount: parseFloat(monthExpenses[0]?.amount || 0).toFixed(2),
      netProfit: monthProfit.toFixed(2),
    },
    inventory: {
      totalProducts: allProducts[0]?.count || 0,
      totalStockValue: parseFloat(invValue?.total || 0).toFixed(2),
      lowStockCount: invValue?.lowStockCount || 0,
      outOfStockCount: invValue?.outOfStockCount || 0,
    },
    outstanding: {
      totalReceivable: totalReceivable.toFixed(2),
      totalPayable: totalPayable.toFixed(2),
    },
    alerts: {
      lowStockItems: lowStockAlertsData.map(item => ({
        id: item.id,
        name: item.name,
        currentStock: parseFloat(item.currentStock).toFixed(2),
        lowStockThreshold: parseFloat(item.lowStockThreshold).toFixed(2),
        unit: item.unit,
      })),
      overduePayables: overduePayables.map(p => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        supplierName: p.supplierName,
        balanceAmount: parseFloat(p.balanceAmount).toFixed(2),
        dueDate: p.dueDate.toISOString().split("T")[0],
      })),
      overdueReceivables: overdueReceivables.map(r => ({
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        customerName: r.customerName,
        balanceAmount: parseFloat(r.balanceAmount).toFixed(2),
        dueDate: r.dueDate.toISOString().split("T")[0],
      })),
    },
    recentSales: recentSales.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      totalAmount: parseFloat(s.totalAmount).toFixed(2),
      saleDate: s.saleDate.toISOString().split("T")[0],
      status: s.status,
    })),
    recentPurchases: recentPurchases.map(p => ({
      id: p.id,
      invoiceNumber: p.invoiceNumber,
      supplierName: p.supplierName,
      totalAmount: parseFloat(p.totalAmount).toFixed(2),
      purchaseDate: p.purchaseDate.toISOString().split("T")[0],
      status: p.status,
    })),
  };
}

// ─── Sales Chart ───────────────────────────────────────────────────────────

export async function getSalesChart(businessId, { period = "30days" }) {
  let startDate;
  let intervalDays;

  if (period === "7days") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    intervalDays = 1;
  } else if (period === "30days") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    intervalDays = 1;
  } else if (period === "12months") {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    intervalDays = 30;
  }

  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const chartData = await db
    .select({
      date: sql`DATE(${sales.saleDate})`,
      salesRevenue: sql`COALESCE(SUM(case when ${inArray(sales.status, ["confirmed", "delivered"])} and ${eq(sales.isReturn, false)} then cast(${sales.totalAmount} as numeric) else 0 end), 0)`,
      purchasesAmount: sql`COALESCE(SUM(case when exists(select 1 from ${purchases} where date(${purchases.purchaseDate}) = date(${sales.saleDate}) and ${eq(purchases.businessId, businessId)} and ${inArray(purchases.status, ["received", "partial"])} and ${eq(purchases.isReturn, false)}) then cast(${purchases.totalAmount} as numeric) else 0 end), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        gte(sales.saleDate, startDate),
        lte(sales.saleDate, endDate)
      )
    )
    .groupBy(sql`DATE(${sales.saleDate})`)
    .orderBy(sql`DATE(${sales.saleDate})`);

  // Get purchases separately
  const purchasesData = await db
    .select({
      date: sql`DATE(${purchases.purchaseDate})`,
      amount: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.businessId, businessId),
        inArray(purchases.status, ["received", "partial"]),
        eq(purchases.isReturn, false),
        gte(purchases.purchaseDate, startDate),
        lte(purchases.purchaseDate, endDate)
      )
    )
    .groupBy(sql`DATE(${purchases.purchaseDate})`);

  const purchasesMap = {};
  purchasesData.forEach(p => {
    purchasesMap[p.date.toISOString().split("T")[0]] = parseFloat(p.amount);
  });

  const labels = [];
  const sales_data = [];
  const purchases_data = [];
  const profit_data = [];

  chartData.forEach(row => {
    const dateStr = row.date.toISOString().split("T")[0];
    const saleRev = parseFloat(row.salesRevenue);
    const purAmount = purchasesMap[dateStr] || 0;
    const profit = saleRev - purAmount;

    labels.push(dateStr);
    sales_data.push(saleRev.toFixed(2));
    purchases_data.push(purAmount.toFixed(2));
    profit_data.push(profit.toFixed(2));
  });

  return {
    period,
    labels,
    sales: sales_data,
    purchases: purchases_data,
    profit: profit_data,
  };
}
