import { and, eq, ilike, or, desc, asc, lte, gte, sql, isNull, isNotNull, inArray } from "drizzle-orm";
import { db } from "../../database/db.js";
import {
  ledgerEntries, parties, sales, saleItems, purchases, purchaseItems, products, expenses,
} from "../../database/schemas/index.js";
import { MSG, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, DEFAULT_FINANCIAL_YEAR_START } from "../../utils/constants.js";

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

// ─── Ledger ───────────────────────────────────────────────────────────────

export async function getLedger(businessId, { partyId, entryType, from, to, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) {
  const p = Math.max(1, parseInt(page) || DEFAULT_PAGE);
  const l = Math.min(parseInt(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (p - 1) * l;

  const conditions = [eq(ledgerEntries.businessId, businessId)];

  if (partyId) {
    conditions.push(eq(ledgerEntries.partyId, partyId));
  }

  if (entryType) {
    conditions.push(eq(ledgerEntries.entryType, entryType));
  }

  if (from) {
    conditions.push(gte(ledgerEntries.entryDate, new Date(from)));
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(ledgerEntries.entryDate, toDate));
  }

  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(ledgerEntries)
    .where(and(...conditions));

  const entries = await db
    .select({
      id: ledgerEntries.id,
      partyId: ledgerEntries.partyId,
      partyName: parties.name,
      entryType: ledgerEntries.entryType,
      referenceNumber: ledgerEntries.referenceNumber,
      debitAmount: ledgerEntries.debitAmount,
      creditAmount: ledgerEntries.creditAmount,
      description: ledgerEntries.description,
      entryDate: ledgerEntries.entryDate,
    })
    .from(ledgerEntries)
    .leftJoin(parties, eq(ledgerEntries.partyId, parties.id))
    .where(and(...conditions))
    .orderBy(desc(ledgerEntries.entryDate))
    .limit(l)
    .offset(offset);

  // Calculate running balance
  let runningBalance = 0;
  const withBalance = entries.map(entry => {
    runningBalance += parseFloat(entry.debitAmount || 0) - parseFloat(entry.creditAmount || 0);
    return {
      ...entry,
      runningBalance: runningBalance.toFixed(2),
    };
  });

  return {
    entries: withBalance,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

export async function getDaybook(businessId, { date, from, to }) {
  const fromDate = from ? new Date(from) : (date ? new Date(date) : new Date());
  const toDate = to ? new Date(to) : (date ? (() => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : (() => {
    const d = new Date(fromDate);
    d.setHours(23, 59, 59, 999);
    return d;
  })());

  const conditions = [
    eq(ledgerEntries.businessId, businessId),
    gte(ledgerEntries.entryDate, fromDate),
    lte(ledgerEntries.entryDate, toDate),
  ];

  const entries = await db
    .select({
      id: ledgerEntries.id,
      partyId: ledgerEntries.partyId,
      partyName: parties.name,
      entryType: ledgerEntries.entryType,
      referenceNumber: ledgerEntries.referenceNumber,
      debitAmount: ledgerEntries.debitAmount,
      creditAmount: ledgerEntries.creditAmount,
      description: ledgerEntries.description,
      entryDate: ledgerEntries.entryDate,
    })
    .from(ledgerEntries)
    .leftJoin(parties, eq(ledgerEntries.partyId, parties.id))
    .where(and(...conditions))
    .orderBy(asc(ledgerEntries.entryDate));

  const totalDebits = entries.reduce((sum, e) => sum + parseFloat(e.debitAmount || 0), 0);
  const totalCredits = entries.reduce((sum, e) => sum + parseFloat(e.creditAmount || 0), 0);

  return {
    entries,
    totals: {
      totalDebits: totalDebits.toFixed(2),
      totalCredits: totalCredits.toFixed(2),
      netFlow: (totalDebits - totalCredits).toFixed(2),
    },
  };
}

// ─── Party Ledger ────────────────────────────────────────────────────────

export async function getPartyLedger(partyId, businessId, { from, to }) {
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
    .orderBy(asc(ledgerEntries.entryDate));

  let openingBal = parseFloat(party.openingBalance || 0);
  if (party.openingBalanceType === "Cr") {
    openingBal = -openingBal;
  }

  let runningBalance = openingBal;
  const withBalance = entries.map(entry => {
    runningBalance += parseFloat(entry.debitAmount || 0) - parseFloat(entry.creditAmount || 0);
    const balanceType = runningBalance >= 0 ? "Dr" : "Cr";
    return {
      ...entry,
      debitAmount: entry.debitAmount || "0",
      creditAmount: entry.creditAmount || "0",
      runningBalance: Math.abs(runningBalance).toFixed(2),
      balanceType,
    };
  });

  const closingBal = Math.abs(runningBalance);
  const closingBalanceType = runningBalance >= 0 ? "Dr" : "Cr";

  return {
    party: {
      id: party.id,
      name: party.name,
      partyType: party.partyType,
      phone: party.phone,
      email: party.email,
      gstin: party.gstin,
    },
    openingBalance: Math.abs(openingBal).toFixed(2),
    openingBalanceType: openingBal >= 0 ? "Dr" : "Cr",
    entries: withBalance,
    closingBalance: closingBal.toFixed(2),
    closingBalanceType,
  };
}

// ─── Outstanding Balances ────────────────────────────────────────────────

export async function getOutstandingParties(businessId, { partyType }) {
  let conditions = [eq(ledgerEntries.businessId, businessId)];

  const parties_list = await db
    .select({
      id: parties.id,
      name: parties.name,
      partyType: parties.partyType,
      openingBalance: parties.openingBalance,
      openingBalanceType: parties.openingBalanceType,
    })
    .from(parties)
    .where(
      and(
        eq(parties.businessId, businessId),
        eq(parties.isActive, true)
      )
    );

  if (partyType) {
    // Filter parties by type
    const partyTypeList = (partyType === "both") ? ["customer", "supplier", "both"] : [partyType];
    conditions.push(inArray(parties.partyType, partyTypeList));
  }

  const ledger = await db
    .select({
      partyId: ledgerEntries.partyId,
      totalDebits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
      totalCredits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
    })
    .from(ledgerEntries)
    .where(and(...conditions))
    .groupBy(ledgerEntries.partyId);

  const ledgerMap = {};
  ledger.forEach(row => {
    ledgerMap[row.partyId] = {
      totalDebits: parseFloat(row.totalDebits),
      totalCredits: parseFloat(row.totalCredits),
    };
  });

  const result = parties_list
    .filter(p => !partyType || (partyType === "both" ? ["customer", "supplier", "both"].includes(p.partyType) : p.partyType === partyType))
    .map(party => {
      let openingBal = parseFloat(party.openingBalance || 0);
      if (party.openingBalanceType === "Cr") {
        openingBal = -openingBal;
      }

      const ledg = ledgerMap[party.id] || { totalDebits: 0, totalCredits: 0 };
      const net = openingBal + ledg.totalDebits - ledg.totalCredits;

      if (net === 0) return null; // Skip parties with zero balance

      return {
        partyId: party.id,
        partyName: party.name,
        partyType: party.partyType,
        outstandingAmount: Math.abs(net).toFixed(2),
        balanceType: net > 0 ? "Dr" : "Cr",
      };
    })
    .filter(Boolean);

  return { parties: result };
}

// ─── Trial Balance ───────────────────────────────────────────────────────

export async function getTrialBalance(businessId, { asOf }) {
  const asOfDate = asOf ? new Date(asOf) : new Date();
  asOfDate.setHours(23, 59, 59, 999);

  const conditions = [
    eq(ledgerEntries.businessId, businessId),
    lte(ledgerEntries.entryDate, asOfDate),
  ];

  // Get all parties with ledger entries
  const partiesWithLedger = await db
    .select({
      partyId: ledgerEntries.partyId,
      totalDebits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
      totalCredits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
    })
    .from(ledgerEntries)
    .where(and(...conditions))
    .groupBy(ledgerEntries.partyId);

  const accounts = [];
  let grandDebit = 0;
  let grandCredit = 0;

  // Add party accounts with opening balances
  const partiesAll = await db.select().from(parties).where(eq(parties.businessId, businessId));

  for (const party of partiesAll) {
    let opening = parseFloat(party.openingBalance || 0);
    if (party.openingBalanceType === "Cr") {
      opening = -opening;
    }

    const ledg = partiesWithLedger.find(l => l.partyId === party.id) || { totalDebits: 0, totalCredits: 0 };
    const totalDeb = opening + parseFloat(ledg.totalDebits);
    const totalCre = parseFloat(ledg.totalCredits);
    const balance = totalDeb - totalCre;

    if (balance === 0) continue;

    accounts.push({
      accountName: `${party.name} (${party.partyType})`,
      accountType: "party",
      totalDebit: balance > 0 ? balance.toFixed(2) : "0",
      totalCredit: balance < 0 ? Math.abs(balance).toFixed(2) : "0",
    });

    if (balance > 0) grandDebit += balance;
    else grandCredit += Math.abs(balance);
  }

  // Add business-level accounts (no partyId)
  const busConditions = [
    eq(ledgerEntries.businessId, businessId),
    isNull(ledgerEntries.partyId),
    lte(ledgerEntries.entryDate, asOfDate),
  ];

  const busSummary = await db
    .select({
      totalDebits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
      totalCredits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
    })
    .from(ledgerEntries)
    .where(and(...busConditions));

  if (busSummary[0].totalDebits > 0 || busSummary[0].totalCredits > 0) {
    accounts.push({
      accountName: "Business Operations",
      accountType: "business",
      totalDebit: busSummary[0].totalDebits,
      totalCredit: busSummary[0].totalCredits,
    });

    grandDebit += parseFloat(busSummary[0].totalDebits);
    grandCredit += parseFloat(busSummary[0].totalCredits);
  }

  return {
    asOf: asOfDate.toISOString().split("T")[0],
    accounts,
    totals: {
      grandDebit: grandDebit.toFixed(2),
      grandCredit: grandCredit.toFixed(2),
    },
  };
}

// ─── Profit & Loss ───────────────────────────────────────────────────────

export async function getProfitLoss(businessId, { from, to }) {
  const business = await db.select().from(db.query.businesses).where(eq(db.query.businesses.id, businessId)).limit(1);
  const b = business?.[0];

  const fromDate = from ? new Date(from) : (() => {
    const fy = (b?.financialYearStart || DEFAULT_FINANCIAL_YEAR_START).split("-");
    const month = parseInt(fy[0]);
    const year = new Date().getFullYear();
    const start = new Date(new Date().getMonth() < month ? year - 1 : year, month - 1, 1);
    return start;
  })();

  const toDate = to ? (() => {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : new Date();

  // Sales revenue (confirmed/delivered, not cancelled/draft/returns)
  const [salesData] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${sales.totalAmount} as numeric)), 0)`,
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

  const grossSales = parseFloat(salesData?.total || 0);

  // Sale returns
  const [returnData] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${sales.totalAmount} as numeric)), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.isReturn, true),
        gte(sales.saleDate, fromDate),
        lte(sales.saleDate, toDate)
      )
    );

  const salesReturns = parseFloat(returnData?.total || 0);
  const netRevenue = grossSales - salesReturns;

  // Cost of goods sold (purchase total for received purchases)
  const [cogsData] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
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

  const cogs = parseFloat(cogsData?.total || 0);

  // Purchase returns
  const [purReturnData] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${purchases.totalAmount} as numeric)), 0)`,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.businessId, businessId),
        eq(purchases.isReturn, true),
        gte(purchases.purchaseDate, fromDate),
        lte(purchases.purchaseDate, toDate)
      )
    );

  const purchaseReturns = parseFloat(purReturnData?.total || 0);

  // Operating expenses
  const [expenseData] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${expenses.amount} as numeric) + cast(${expenses.gstAmount} as numeric)), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.expenseDate, fromDate),
        lte(expenses.expenseDate, toDate)
      )
    );

  const operatingExpenses = parseFloat(expenseData?.total || 0);

  const totalExpenses = cogs + operatingExpenses + purchaseReturns;
  const grossProfit = netRevenue - cogs;
  const netProfit = netRevenue - totalExpenses;

  return {
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    income: {
      grossSales: grossSales.toFixed(2),
      salesReturns: salesReturns.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
    },
    expenses: {
      costOfGoodsSold: cogs.toFixed(2),
      purchaseReturns: purchaseReturns.toFixed(2),
      operatingExpenses: operatingExpenses.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
    },
    grossProfit: grossProfit.toFixed(2),
    netProfit: netProfit.toFixed(2),
  };
}

// ─── Balance Sheet ───────────────────────────────────────────────────────

export async function getBalanceSheet(businessId, { asOf }) {
  const asOfDate = asOf ? new Date(asOf) : new Date();
  asOfDate.setHours(23, 59, 59, 999);

  // TODO: Calculate cash/bank (from payments - for now assume 0)
  const cashBank = "0";

  // Accounts receivable from customers
  const customerParties = await db
    .select({
      id: parties.id,
      openingBalance: parties.openingBalance,
      openingBalanceType: parties.openingBalanceType,
    })
    .from(parties)
    .where(
      and(
        eq(parties.businessId, businessId),
        inArray(parties.partyType, ["customer", "both"])
      )
    );

  let accountsReceivable = 0;
  for (const party of customerParties) {
    let opening = parseFloat(party.openingBalance || 0);
    if (party.openingBalanceType === "Cr") opening = -opening;

    const [ledg] = await db
      .select({
        debits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
        credits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.businessId, businessId),
          eq(ledgerEntries.partyId, party.id),
          lte(ledgerEntries.entryDate, asOfDate)
        )
      );

    const balance = opening + parseFloat(ledg?.debits || 0) - parseFloat(ledg?.credits || 0);
    if (balance > 0) accountsReceivable += balance;
  }

  // Inventory value
  const [invData] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${products.currentStock} as numeric) * cast(${products.purchasePrice} as numeric)), 0)`,
    })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.isActive, true)
      )
    );

  const inventory = parseFloat(invData?.total || 0);

  const totalAssets = parseFloat(cashBank) + accountsReceivable + inventory;

  // Accounts payable from suppliers
  const supplierParties = await db
    .select({
      id: parties.id,
      openingBalance: parties.openingBalance,
      openingBalanceType: parties.openingBalanceType,
    })
    .from(parties)
    .where(
      and(
        eq(parties.businessId, businessId),
        inArray(parties.partyType, ["supplier", "both"])
      )
    );

  let accountsPayable = 0;
  for (const party of supplierParties) {
    let opening = parseFloat(party.openingBalance || 0);
    if (party.openingBalanceType === "Cr") opening = -opening;

    const [ledg] = await db
      .select({
        debits: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
        credits: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.businessId, businessId),
          eq(ledgerEntries.partyId, party.id),
          lte(ledgerEntries.entryDate, asOfDate)
        )
      );

    const balance = opening + parseFloat(ledg?.debits || 0) - parseFloat(ledg?.credits || 0);
    if (balance < 0) accountsPayable -= balance;
  }

  const totalLiabilities = accountsPayable;

  // Net profit (YTD)
  const profitLoss = await getProfitLoss(businessId, { to: asOfDate });
  const netProfit = parseFloat(profitLoss.netProfit);

  const totalEquity = netProfit;

  return {
    asOf: asOfDate.toISOString().split("T")[0],
    assets: {
      currentAssets: {
        cashBank: cashBank,
        accountsReceivable: accountsReceivable.toFixed(2),
        inventory: inventory.toFixed(2),
      },
      totalAssets: totalAssets.toFixed(2),
    },
    liabilities: {
      accountsPayable: accountsPayable.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
    },
    equity: {
      netProfit: netProfit.toFixed(2),
      totalEquity: totalEquity.toFixed(2),
    },
  };
}

// ─── Cash Flow ───────────────────────────────────────────────────────────

export async function getCashFlow(businessId, { from, to }) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? (() => {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : new Date();

  // Cash received from customers (payment receipts)
  const [cashIn] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${ledgerEntries.debitAmount} as numeric)), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.businessId, businessId),
        eq(ledgerEntries.entryType, "payment_receipt"),
        gte(ledgerEntries.entryDate, fromDate),
        lte(ledgerEntries.entryDate, toDate)
      )
    );

  const cashFromCustomers = parseFloat(cashIn?.total || 0);

  // Cash paid to suppliers (payment made)
  const [cashOut] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${ledgerEntries.creditAmount} as numeric)), 0)`,
    })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.businessId, businessId),
        eq(ledgerEntries.entryType, "payment_made"),
        gte(ledgerEntries.entryDate, fromDate),
        lte(ledgerEntries.entryDate, toDate)
      )
    );

  const cashToSuppliers = parseFloat(cashOut?.total || 0);

  // Cash paid for expenses (where paymentMode != 'credit')
  const [expenseCash] = await db
    .select({
      total: sql`COALESCE(SUM(cast(${expenses.amount} as numeric) + cast(${expenses.gstAmount} as numeric)), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        inArray(expenses.paymentMode, ["cash", "upi", "card", "bank_transfer", "cheque"]),
        gte(expenses.expenseDate, fromDate),
        lte(expenses.expenseDate, toDate)
      )
    );

  const cashForExpenses = parseFloat(expenseCash?.total || 0);

  const netOperatingCashFlow = cashFromCustomers - cashToSuppliers - cashForExpenses;
  const netCashFlow = netOperatingCashFlow;

  return {
    period: {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    },
    operating: {
      cashFromCustomers: cashFromCustomers.toFixed(2),
      cashToSuppliers: cashToSuppliers.toFixed(2),
      cashForExpenses: cashForExpenses.toFixed(2),
      netOperatingCashFlow: netOperatingCashFlow.toFixed(2),
    },
    netCashFlow: netCashFlow.toFixed(2),
  };
}
