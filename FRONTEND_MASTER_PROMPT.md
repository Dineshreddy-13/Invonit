# INVONIT FRONTEND - MASTER IMPLEMENTATION PROMPT

## PROJECT OVERVIEW
**Invonit** is a comprehensive business management and accounting software built with:
- **Frontend**: React 19 + Vite + Zustand + React Router v7 + Tailwind CSS 4
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Authentication**: OTP-based registration and login
- **Target Users**: Small business owners, accountants, inventory managers

### Core Business Modules
1. **Authentication & Business Setup** - User registration, login, business creation
2. **Party Management** - Contacts (customers/suppliers) with outstanding tracking
3. **Inventory** - Products, stock levels, adjustments
4. **Purchasing** - Purchase orders, supplier invoicing, stock-in
5. **Sales** - Sales invoicing, POS, estimates, returns
6. **Accounting** - General ledger, journals, financial statements
7. **Reporting** - Sales, purchases, stock, party statements, GST compliance
8. **Expenses** - Expense tracking and categorization

---

## FRONTEND ARCHITECTURE

### Technology Stack
```
- React 19.2.0
- React Router DOM 7.13.1 (file-based routing supported)
- Zustand 5.0.11 (state management)
- Tailwind CSS 4.2.1 (styling)
- React Hook Form 7.72.1 (form handling)
- Axios 1.13.6 (HTTP client)
- Lucide React 0.577.0 (icons)
- React Hot Toast 2.6.0 (notifications)
- Input OTP 1.4.2 (OTP input component)
- @base-ui/react 1.2.0 (unstyled components)
```

### Project Structure
```
client/
├── src/
│   ├── api/
│   │   └── apiClient.js              # Axios instance with interceptors
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── select.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── OtpInput.jsx
│   │   ├── auth/                     # Auth-related components
│   │   ├── parties/                  # Party management components
│   │   ├── inventory/                # Inventory components
│   │   ├── purchases/                # Purchase components
│   │   ├── sales/                    # Sales components (TODO)
│   │   ├── reports/                  # Report components (TODO)
│   │   ├── accounting/               # Accounting components (TODO)
│   │   ├── expenses/                 # Expense components (TODO)
│   │   ├── Navbar.jsx                # Top navigation
│   │   ├── Sidebar.jsx               # Main sidebar
│   │   ├── ProtectedRoute.jsx        # Auth guard
│   │   ├── PublicRoute.jsx           # Public route guard
│   │   └── CreateBusinessModal.jsx   # Business setup modal
│   ├── layouts/
│   │   ├── AuthLayout.jsx            # Auth page layout
│   │   └── MainLayout.jsx            # Authenticated page layout
│   ├── lib/
│   │   ├── constants.js              # App constants & routes
│   │   ├── validators.js             # Form validators (GSTIN, mobile, email)
│   │   └── utils.js                  # Utility functions (cn)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── SignIn.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── OtpVerification.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── PasswordReset.jsx
│   │   ├── Dashboard.jsx             # Main dashboard (TODO: expand)
│   │   ├── Parties.jsx               # Party overview (TODO)
│   │   ├── parties/
│   │   │   └── PartyListPage.jsx     # Party list with CRUD
│   │   ├── inventory/
│   │   │   ├── ProductsPage.jsx      # Inventory list/grid
│   │   │   └── InventoryMastersPage.jsx # Categories, tax rates
│   │   ├── purchases/
│   │   │   ├── PurchaseListPage.jsx  # Purchase list
│   │   │   └── PurchaseFormPage.jsx  # Create/edit purchase
│   │   ├── sales/                    # Sales pages (TODO)
│   │   ├── reports/                  # Report pages (TODO)
│   │   └── accounting/               # Accounting pages (TODO)
│   ├── store/
│   │   ├── authStore.js              # Authentication state
│   │   ├── businessStore.js          # Business setup state
│   │   ├── partyStore.js             # Parties CRUD
│   │   ├── inventoryStore.js         # Products/inventory state
│   │   ├── purchaseStore.js          # Purchases state
│   │   ├── categoryStore.js          # Categories state
│   │   ├── taxRateStore.js           # Tax rates state
│   │   ├── salesStore.js             # Sales state (TODO)
│   │   ├── expenseStore.js           # Expenses state (TODO)
│   │   ├── reportStore.js            # Reports state (TODO)
│   │   ├── accountingStore.js        # Accounting state (TODO)
│   │   └── gstStore.js               # GST state (TODO)
│   ├── App.jsx                       # Router configuration
│   ├── main.jsx                      # App entry point
│   └── index.css                     # Global styles
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## IMPLEMENTATION PHASES

### PHASE 1: CORE INFRASTRUCTURE ✅ (Already Implemented)
- [x] Authentication flow (OTP-based signup/login)
- [x] Business setup modal
- [x] Protected routing
- [x] API client with interceptors
- [x] Base UI components (button, input, modal, etc.)
- [x] Zustand stores setup

### PHASE 2: MASTER DATA MANAGEMENT 🟡 (60% Complete)

#### 2.1 Complete Party Management
**Status**: 60% complete (needs refinement)
**Components to complete**:
- PartyDetailPage - View full party profile, outstanding tracking
- PartyStatementModal - Show payment history, balances
- Bulk import functionality
- Advanced filters (address, city, registration date)

**Store Updates**:
- Add getPartyOutstanding() method
- Add bulk operations (import, export)
- Add advanced filtering

#### 2.2 Inventory Masters (Categories & Tax Rates)
**Status**: Not started
**Pages to create**:
- `pages/inventory/InventoryMastersPage.jsx` - Main master data management
- `components/inventory/CategoryManagement.jsx` - CRUD for categories
- `components/inventory/TaxRateManagement.jsx` - CRUD for tax rates

**Stores to create**:
- [x] `categoryStore.js` - Create operations
- [x] `taxRateStore.js` - Tax rates management

**API Endpoints to use**:
```
POST   /api/categories           - Create category
GET    /api/categories           - List categories
PATCH  /api/categories/:id       - Update category
DELETE /api/categories/:id       - Delete category

GET    /api/tax-rates            - List tax rates
POST   /api/tax-rates            - Create tax rate
PATCH  /api/tax-rates/:id        - Update tax rate
DELETE /api/tax-rates/:id        - Delete tax rate
```

---

### PHASE 3: TRANSACTION MANAGEMENT 🔴 (20% Complete)

#### 3.1 Complete Purchase Management
**Status**: 20% complete (needs form logic)
**Pages to create/complete**:
- `pages/purchases/PurchaseFormPage.jsx` - Create/edit purchase with line items
- `pages/purchases/PurchaseDetailPage.jsx` - View purchase, record payment, return
- `pages/purchases/PurchaseReturnPage.jsx` - Process purchase returns

**Components to create**:
- `components/purchases/PurchaseForm.jsx` - Line-item based form
- `components/purchases/LineItemTable.jsx` - Add/remove items dynamically
- `components/purchases/InvoiceUploadModal.jsx` - OCR or manual upload
- `components/purchases/PurchasePaymentModal.jsx` - Record payment against invoice
- `components/purchases/PurchaseReturnForm.jsx` - Process returns

**Store completion**:
- Complete `purchaseStore.js` with:
  - createPurchase, updatePurchase, getPurchaseById
  - recordPayment method
  - createPurchaseReturn method
  - cancelPurchase method
  - Remove mock OCR, replace with file upload

**API Endpoints**:
```
POST   /api/purchases                    - Create purchase
GET    /api/purchases                    - List with filters
GET    /api/purchases/:id                - Get single
PATCH  /api/purchases/:id                - Update
POST   /api/purchases/:id/payment        - Record payment
POST   /api/purchases/:id/return         - Create return
POST   /api/purchases/:id/cancel         - Cancel purchase
GET    /api/purchases/returns            - List returns
```

#### 3.2 Complete Inventory Management
**Status**: 40% complete (needs add/remove line items)
**Pages to create**:
- `pages/inventory/ProductDetailPage.jsx` - View product details, adjust stock

**Components to complete**:
- `components/inventory/StockAdjustmentModal.jsx` - Adjust stock with reasons
- `components/inventory/LowStockAlert.jsx` - Show low stock items
- `components/inventory/ProductDetailPanel.jsx` - Product info panel

**Store completion**:
- Complete `inventoryStore.js`:
  - LowStockProducts fetching and filtering
  - Stock adjustment functionality
  - Product barcode lookup
  - Batch operations

**API Endpoints**:
```
GET    /api/products                     - List with pagination
POST   /api/products                     - Create product
PATCH  /api/products/:id                 - Update product
DELETE /api/products/:id                 - Delete product
GET    /api/products/:id                 - Get single
GET    /api/products/stock-summary       - Summary for dashboard
GET    /api/products/low-stock           - Low stock alert
GET    /api/products/barcode/:barcode    - Barcode lookup
POST   /api/products/:id/adjust-stock    - Stock adjustment
```

---

### PHASE 4: SALES & POS 🔴 (Not Started)

#### 4.1 Sales Module
**Pages to create**:
- `pages/sales/SalesListPage.jsx` - List all sales with filters
- `pages/sales/SalesFormPage.jsx` - Create/edit sales invoice
- `pages/sales/POSPage.jsx` - Point of Sale interface
- `pages/sales/EstimatePage.jsx` - Quotation/Estimate management
- `pages/sales/SalesReturnPage.jsx` - Process sales returns
- `pages/sales/SalesDetailPage.jsx` - View sale detail, payments, returns

**Components to create**:
- `components/sales/SalesForm.jsx` - Line-item invoice form
- `components/sales/SalesTable.jsx` - Sales list table
- `components/sales/InvoiceTemplate.jsx` - Print-ready template
- `components/sales/POSInterface.jsx` - Fast entry interface
- `components/sales/SalesPaymentModal.jsx` - Partial/full payment recording
- `components/sales/SalesReturnForm.jsx` - Return processing
- `components/sales/CustomerSelector.jsx` - Quick customer search
- `components/sales/CustomerCreditModal.jsx` - Show customer credit limit
- `components/sales/SavedEstimateModal.jsx` - Convert estimate to invoice

**Store to create**:
- `salesStore.js` with:
  - createSale (invoice or POS bill)
  - listSales with filters (customer, date range, status, type)
  - getSale with line items
  - recordPayment
  - createSaleReturn
  - cancelSale
  - convertEstimate (quote to invoice)
  - getTopSellingProducts
  - getSalesSummary

**Key Features**:
- Support for multiple sale types: Invoice, POS Bill, Estimate
- Line-item level quantity, rate, discount, tax
- Auto-calculation of totals, taxes, discounts
- Payment recording (full/partial)
- Sales returns tracking
- Estimate to invoice conversion
- Customer credit limit validation
- Barcode scanning for quick entry (POS)
- Print functionality

**API Endpoints**:
```
POST   /api/sales                        - Create sale/invoice/estimate
GET    /api/sales                        - List with filters
GET    /api/sales/:id                    - Get sale details
POST   /api/sales/:id/payment            - Record payment
POST   /api/sales/:id/return             - Create return
POST   /api/sales/:id/cancel             - Cancel sale
POST   /api/sales/:id/convert            - Convert estimate
GET    /api/sales/returns                - List returns
GET    /api/sales/summary                - Revenue summary
GET    /api/sales/top-products           - Top selling products
```

---

### PHASE 5: EXPENSES TRACKING 🔴 (Not Started)

#### 5.1 Expense Module
**Pages to create**:
- `pages/expenses/ExpenseListPage.jsx` - List all expenses
- `pages/expenses/ExpenseFormPage.jsx` - Create/edit expense
- `pages/expenses/ExpenseCategoriesPage.jsx` - Manage categories

**Components to create**:
- `components/expenses/ExpenseForm.jsx` - Expense entry form
- `components/expenses/ExpenseTable.jsx` - Expense list
- `components/expenses/ExpenseCategoryForm.jsx` - Category CRUD
- `components/expenses/ExpenseFilters.jsx` - Filter by date, category, amount

**Store to create**:
- `expenseStore.js` with:
  - createExpense
  - updateExpense
  - deleteExpense
  - getExpense
  - listExpenses (with filters)
  - createExpenseCategory
  - listExpenseCategories
  - updateExpenseCategory
  - getExpenseSummary

**Features**:
- Expense categorization
- Date tracking
- Amount and payment method
- Category-wise breakdown
- Monthly analysis
- PDF export

**API Endpoints**:
```
POST   /api/expenses                     - Create expense
GET    /api/expenses                     - List expenses
PATCH  /api/expenses/:id                 - Update expense
DELETE /api/expenses/:id                 - Delete expense
GET    /api/expenses/:id                 - Get expense
GET    /api/expenses/summary             - Summary/analysis
POST   /api/expenses/categories          - Create category
GET    /api/expenses/categories          - List categories
PATCH  /api/expenses/categories/:id      - Update category
DELETE /api/expenses/categories/:id      - Delete category
```

---

### PHASE 6: REPORTING & ANALYTICS 🔴 (Not Started)

#### 6.1 Report Module
**Pages to create**:
- `pages/reports/ReportsPage.jsx` - Report selection dashboard
- `pages/reports/SalesReportPage.jsx` - Sales analysis & trends
- `pages/reports/PurchaseReportPage.jsx` - Purchase analysis
- `pages/reports/StockReportPage.jsx` - Inventory analysis
- `pages/reports/PartyStatementPage.jsx` - Party-wise outstanding
- `pages/reports/MonthlyAnalysisPage.jsx` - Month-on-month analysis
- `pages/reports/TopCustomersPage.jsx` - Customer performance
- `pages/reports/TopSuppliersPage.jsx` - Supplier performance

**Components to create**:
- `components/reports/ReportFilters.jsx` - Date range, category, party filters
- `components/reports/ReportTable.jsx` - Tabular data display
- `components/reports/ReportChart.jsx` - Chart visualization (line, bar, pie)
- `components/reports/PDFExport.jsx` - PDF generation
- `components/reports/ExcelExport.jsx` - Excel export

**Store to create**:
- `reportStore.js` with:
  - getSalesReport
  - getPurchasesReport
  - getStockReport
  - getPartyStatement
  - getMonthlyAnalysis
  - getTopCustomers
  - getTopSuppliers
  - Advanced filtering and sorting

**Features**:
- Date range filtering
- Multi-series filtering (party, category, payment status)
- Graphical visualization
- CSV/Excel export
- PDF print
- Trend analysis
- Comparison reports

**API Endpoints**:
```
GET    /api/reports/sales                - Sales report
GET    /api/reports/purchases            - Purchase report
GET    /api/reports/stock                - Stock report
GET    /api/reports/party-statement/:id  - Party statement
GET    /api/reports/monthly-analysis     - Monthly trends
GET    /api/reports/top-customers        - Top customers
GET    /api/reports/top-suppliers        - Top suppliers
```

---

### PHASE 7: ACCOUNTING & FINANCIALS 🔴 (Not Started)

#### 7.1 Accounting Module
**Pages to create**:
- `pages/accounting/AccountingPage.jsx` - Accounting dashboard
- `pages/accounting/LedgerPage.jsx` - General ledger view
- `pages/accounting/DaybookPage.jsx` - Daily transactions
- `pages/accounting/PartyLedgerPage.jsx` - Party-wise ledger
- `pages/accounting/TrialBalancePage.jsx` - Trial balance
- `pages/accounting/ProfitLossPage.jsx` - P&L statement
- `pages/accounting/BalanceSheetPage.jsx` - Balance sheet report
- `pages/accounting/CashFlowPage.jsx` - Cash flow statement
- `pages/accounting/JournalPage.jsx` - Journal entries

**Components to create**:
- `components/accounting/LedgerTable.jsx` - Ledger display
- `components/accounting/TrialBalanceTable.jsx` - Trial balance format
- `components/accounting/ProfitLossStatement.jsx` - P&L formatting
- `components/accounting/BalanceSheetStatement.jsx` - Balance sheet format
- `components/accounting/JournalEntryForm.jsx` - Manual journal entry
- `components/accounting/DateRangeFilter.jsx` - Date range selector

**Store to create**:
- `accountingStore.js` with:
  - getLedger
  - getDaybook
  - getPartyLedger
  - getOutstanding
  - getTrialBalance
  - getProfitLoss
  - getBalanceSheet
  - getCashFlow

**Features**:
- Double-entry bookkeeping view
- Trial balance verification
- Financial statement generation
- Period-wise comparison
- Manual journal entries
- Audit trails

**API Endpoints**:
```
GET    /api/accounting/ledger            - General ledger
GET    /api/accounting/daybook           - Daily daybook
GET    /api/accounting/party-ledger/:id  - Party ledger
GET    /api/accounting/outstanding       - Outstanding summary
GET    /api/accounting/trial-balance     - Trial balance
GET    /api/accounting/profit-loss       - P&L statement
GET    /api/accounting/balance-sheet     - Balance sheet
GET    /api/accounting/cash-flow         - Cash flow
```

---

### PHASE 8: GST & TAX COMPLIANCE 🔴 (Not Started)

#### 8.1 GST Module
**Pages to create**:
- `pages/gst/GSTPage.jsx` - GST dashboard
- `pages/gst/GSTR1Page.jsx` - GSTR-1 return filing
- `pages/gst/GSTR3BPage.jsx` - GSTR-3B return filing
- `pages/gst/GSTSummaryPage.jsx` - GST analysis

**Components to create**:
- `components/gst/GSTR1Viewer.jsx` - GSTR-1 table view
- `components/gst/GSTR3BViewer.jsx` - GSTR-3B view
- `components/gst/HSNSummary.jsx` - HSN code summary
- `components/gst/GSTJSONExport.jsx` - Export for e-filing

**Store to create**:
- `gstStore.js` with:
  - getGstSummary (SGST, CGST, IGST breakdown)
  - getHsnSummary (HSN-wise breakdown)
  - getGstr1 (output taxes)
  - getGstr3b (return summary)

**Features**:
- GST summary by rate
- HSN-wise analysis
- GSTR-1 generation (sales detail)
- GSTR-3B generation (return summary)
- State-wise HSN classification
- JSON export for official portal

**API Endpoints**:
```
GET    /api/gst/summary                  - GST summary
GET    /api/gst/hsn-summary              - HSN breakdown
GET    /api/gst/gstr1                    - GSTR-1 data
GET    /api/gst/gstr3b                   - GSTR-3B data
```

---

### PHASE 9: ENHANCED DASHBOARD 🔴 (Not Started)

#### 9.1 Dashboard Module
**Pages to update**:
- `pages/Dashboard.jsx` - Enhanced dashboard with cards and charts

**Components to create**:
- `components/dashboard/SalesCard.jsx` - Today/This month sales
- `components/dashboard/PurchaseCard.jsx` - Purchase summary
- `components/dashboard/OutstandingCard.jsx` - Receivables/Payables
- `components/dashboard/StockCard.jsx` - Low stock alert
- `components/dashboard/SalesChart.jsx` - Sales trend chart
- `components/dashboard/TopProductsChart.jsx` - Best sellers
- `components/dashboard/QuickActions.jsx` - Quick access buttons

**Store for dashboard**:
- `dashboardStore.js` with:
  - getDashboardOverview
  - getSalesChart
  - Caching mechanism

**Features**:
- Key metrics overview
- Sales trend visualization
- Inventory alerts
- Outstanding balance summary
- Top-performing products
- Quick navigation

**API Endpoints**:
```
GET    /api/dashboard/overview           - Overview metrics
GET    /api/dashboard/sales-chart        - Sales chart data
```

---

## COMPONENT SPECIFICATIONS

### Data Input Components

#### LineItemTable Component
**Props**:
```javascript
{
  items: [],                              // Line items
  onAddItem: (item) => {},               // Add new line
  onRemoveItem: (index) => {},           // Remove line
  onUpdateItem: (index, data) => {},     // Update line
  products: [],                          // Available products
  taxRates: [],                          // Available tax rates
  readOnly: false                        // View mode
}
```

**Features**:
- Searchable product dropdown with barcode
- Quantity and rate input
- Auto-calculation of line total
- Tax selection and auto-calculation
- Item-specific discount
- Add/remove buttons
- Keyboard navigation

#### PartySelector Component
**Props**:
```javascript
{
  value: null,                           // Selected party ID
  onChange: (partyId) => {},            // On selection
  type: 'customer|supplier|both',       // Party filter
  disabled: false
}
```

**Features**:
- Searchable dropdown
- Quick create new party
- Display credit limit/outstanding
- Recent parties list

#### DateRangeFilter Component
**Props**:
```javascript
{
  onDateChange: (from, to) => {},       // Date range callback
  presets: ['today', 'week', 'month']   // Quick select presets
}
```

---

### Table/List Components

#### Pagination Component
**Props**:
```javascript
{
  currentPage: 1,
  totalPages: 10,
  onPageChange: (page) => {}
}
```

**Features**:
- First, Previous, Next, Last buttons
- Page number display
- Jump to page input
- Result count display

#### SortableHeader Component
**Props**:
```javascript
{
  sortBy: 'name',
  order: 'asc',
  onSort: (column) => {}
}
```

---

### Form Components

#### CurrencyInput Component
**Props**:
```javascript
{
  value: 0,
  onChange: (amount) => {},
  disabled: false,
  placeholder: "0.00",
  precision: 2                          // Decimal places
}
```

**Features**:
- Formatted display with currency symbol
- Auto-separation with commas
- Paste handling (removes formatting)

#### GSINInput Component
**Props**:
```javascript
{
  value: '',
  onChange: (gstin) => {},
  error: '',
  onValidate: () => {}
}
```

**Features**:
- Format check
- Character count (15)
- Uppercase enforcement
- Format guide

#### MobileInput Component
**Props**:
```javascript
{
  value: '',
  onChange: (mobile) => {},
  error: '',
  countryCode: '+91'
}
```

**Features**:
- 10-digit validation
- Formatting
- Country code prefix

---

### Modal Components

#### ConfirmDialog Component
**Props**:
```javascript
{
  open: false,
  title: '',
  message: '',
  onConfirm: () => {},
  onCancel: () => {},
  isDestructive: false,
  isLoading: false
}
```

#### ResponseModal Component
**Props**:
```javascript
{
  open: false,
  type: 'success|error|info|warning',
  title: '',
  message: '',
  onClose: () => {}
}
```

---

## STYLING GUIDELINES

### Tailwind Classes Used
- Spacing: `p-`, `m-`, `gap-`, `flex-col`, `flex-row`
- Colors: `bg-slate-50`, `bg-white`, `text-slate-500`, `text-slate-900`
- States: `hover:`, `disabled:opacity-50`, `focus:ring-`
- Responsive: `md:`, `sm:`, `lg:`
- Layouts: `flex`, `grid`, `table`, `relative`, `absolute`

### Badge/Status Styling
```javascript
const statusBadges = {
  'success': 'bg-green-100 text-green-800',
  'warning': 'bg-amber-100 text-amber-800',
  'error': 'bg-red-100 text-red-800',
  'info': 'bg-blue-100 text-blue-800',
  'draft': 'bg-slate-100 text-slate-800'
}
```

### Card Layout Pattern
```jsx
<div className="card-container bg-white rounded-lg shadow-sm p-6 border border-slate-200">
  {/* Content */}
</div>
```

---

## VALIDATION RULES

### Business Rules
1. **GSTIN**: 15-character format, alphanumeric, state format
2. **Mobile**: Exactly 10 digits for Indian numbers
3. **Email**: Standard email format
4. **Quantities**: Must be positive numbers, 2-4 decimal places
5. **Amounts**: Must be positive, max 2 decimal places
6. **Stock**: Cannot go negative (except for returns)
7. **Dates**: Must be valid, within reasonable range
8. **Party Names**: Min 3 chars, max 100 chars
9. **Duplicate Checks**: Invoice numbers, party duplicates
10. **Credit Limit**: Cannot exceed for sales

### Form Validations
- Required field checks
- Format validations
- Cross-field validations (e.g., end date > start date)
- Async validation (duplicate invoice number check)
- Real-time validation with error feedback

---

## STATE MANAGEMENT PATTERNS

### Standard Zustand Store Template
```javascript
import { create } from "zustand";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";

const useXXXStore = create((set, get) => ({
  // State
  items: [],
  loading: false,
  error: null,
  
  // Filters & Pagination
  filters: { /* ... */ },
  pagination: { page: 1, limit: 20 },
  
  // Setters
  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetch();
  },
  
  // API Operations
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get("/endpoint");
      set({ items: res.data.data.items });
    } catch (err) {
      set({ error: err.response?.data?.message });
      toast.error(err.response?.data?.message || "Error");
    } finally {
      set({ loading: false });
    }
  },
  
  create: async (data) => {
    set({ loading: true });
    try {
      const res = await apiClient.post("/endpoint", data);
      toast.success("Created successfully");
      get().fetch();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loading: false });
    }
  }
}));

export default useXXXStore;
```

---

## API ERROR HANDLING

### Error Response Format
```javascript
{
  success: false,
  message: "Error description",
  errors: ["Field error 1", "Field error 2"],  // Optional
  isDuplicate?: boolean,                        // Optional
  statusCode: 400
}
```

### Frontend Error Handling
1. **Validation Errors**: Display field-level errors
2. **Business Logic Errors**: Show toast notification
3. **Network Errors**: Retry with exponential backoff
4. **Authentication Errors**: Redirect to login
5. **Server Errors**: Show generic error message

---

## RESPONSIVE DESIGN STANDARDS

### Mobile Breakpoints
- **Mobile**: < 640px (default)
- **Tablet**: 640px - 1024px (`md:`)
- **Desktop**: > 1024px (`lg:`)

### Responsive Adjustments
- Stack columns vertically on mobile
- Single column forms on mobile
- Sheet/modal for filters on mobile
- Simplified tables with horizontal scroll
- Bottom sheet for action menus

---

## ACCESSIBILITY REQUIREMENTS

1. **Keyboard Navigation**: Tab, Enter, Escape, Arrow keys
2. **ARIA Labels**: All buttons and inputs must have labels
3. **Color Contrast**: Minimum WCAG AA (4.5:1 for text)
4. **Form Labels**: Always paired with inputs
5. **Error Messages**: Clear and actionable
6. **Loading States**: Use aria-busy for async operations
7. **Focus Indicators**: Clear focus rings on interactive elements

---

## PERFORMANCE OPTIMIZATION

1. **Code Splitting**: Lazy load page components
2. **Memoization**: Memoize expensive calculations
3. **API Caching**: Cache frequently accessed data
4. **Debouncing**: Search and filter inputs
5. **Pagination**: Load data in chunks
6. **Asset Optimization**: Minify, compress assets
7. **Bundle Analysis**: Monitor bundle size

---

## TESTING STRATEGY

### Unit Tests
- Store functions (fetch, create, update, delete)
- Utility functions and validators
- Component logic

### Integration Tests
- Form submission and validation
- API calls and error handling
- Store integration with components

### E2E Tests
- Authentication flow
- Complete transaction workflows
- Report generation

---

## DEVELOPMENT PRIORITIES

### Must-Have (MVP)
1. ✅ Authentication
2. ✅ Business setup
3. Parties/Suppliers
4. Products/Inventory
5. Purchases
6. Sales (basic)
7. Reports (basic)
8. Dashboard (basic)

### Should-Have
1. Expenses
2. GST compliance
3. Accounting (P&L, Balance Sheet)
4. POS
5. Advanced reports

### Nice-to-Have
1. Mobile app
2. Offline support
3. AI-powered insights
4. Bulk import/export
5. Custom fields
6. API webhooks
7. Third-party integrations

---

## KEY TECHNICAL DECISIONS

1. **State Management**: Zustand for simplicity over Redux
2. **Styling**: Tailwind CSS for utility-first approach
3. **Forms**: React Hook Form for minimal re-renders
4. **Routing**: React Router v7 for client-side routing
5. **HTTP Client**: Axios with centralized instance for consistency
6. **Component Library**: shadcn pattern (unstyled) for accessibility
7. **Notifications**: React Hot Toast for lightweight alerts
8. **Icons**: Lucide React for consistent iconography

---

## DEPLOYMENT & BUILD

### Development
```bash
npm run dev      # Start dev server on :5173
```

### Production Build
```bash
npm run build    # Create optimized build
npm run preview  # Test production build locally
```

### Environment Variables
```
VITE_API_URL=http://localhost:5000/api
```

---

## COMMON PATTERNS & EXAMPLES

### Form Pattern
```jsx
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

export function MyForm() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  
  const onSubmit = async (data) => {
    // API call
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("field", { required: true })} />
      <Button disabled={isSubmitting}>Submit</Button>
    </form>
  );
}
```

### Store Hook Pattern
```jsx
import useXXXStore from "@/store/xxxStore";

export function MyComponent() {
  const { items, loading } = useXXXStore(state => ({
    items: state.items,
    loading: state.loading
  }));
  
  return <div>{loading ? 'Loading...' : items.map(...)}</div>;
}
```

### API Call Pattern
```jsx
useEffect(() => {
  fetch();
}, []); // Called once on mount

async function fetch() {
  try {
    const res = await apiClient.get("/endpoint", { params });
    // Handle success
  } catch (err) {
    // Handle error
  }
}
```

---

## NEXT STEPS FOR IMPLEMENTATION

1. **Complete Party Management** - Refine existing components
2. **Build Purchase Module** - Create complete purchase workflow
3. **Build Sales Module** - Create sales/invoice workflow
4. **Add Reporting** - Basic reports first, advanced later
5. **Add Dashboard** - Key metrics and visualizations
6. **Add Expenses** - Expense tracking
7. **Add Accounting** - Financial statements
8. **Add GST** - Compliance features

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Status**: In Progress (Phase 2)
