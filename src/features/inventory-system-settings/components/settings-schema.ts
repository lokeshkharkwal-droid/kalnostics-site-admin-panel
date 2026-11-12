/**
 * Declarative schema for the inventory system-settings form, rebuilt to replicate
 * the EZ Health Track (legacy Stock Manager Advance) System Settings page
 * field-for-field.
 *
 * SOURCE OF TRUTH (legacy):
 *   - controller: inventory/app/controllers/System_settings.php  (index(), business_settings())
 *   - views:      themes/default/views/settings/index.php
 *                 themes/default/views/settings/business_settings.php
 *
 * Every field below corresponds to a real legacy setting. The `key` is the name
 * the legacy app persists into the `settings` row (the stored column), which is
 * what the flexible JSON `data` store mirrors here. Where the legacy HTML `name`
 * attribute differs from the stored column, the stored column wins and the
 * divergent POST name is noted in a comment (e.g. POST `currency` → `default_currency`).
 *
 * Select option sets are taken verbatim from the legacy view (`$ps`, `$wm`, the
 * inline option arrays). Two shared legacy maps:
 *   $wm = { 0: 'No',  1: 'Yes' }
 *   $ps = { 0: 'Disable', 1: 'Enable' }
 *
 * EXCLUSIONS (intentional, per SiteAdmin scope):
 *   - "Warehouse Quantity" is excluded at SiteAdmin level.
 *   - Business-only data-source selects that are commented out in the SiteAdmin
 *     `index.php` view (default_warehouse, default_biller, default_supplier) are
 *     not surfaced here; they require tenant-level catalogues the SiteAdmin page
 *     does not have.
 */

export type FieldType = 'text' | 'number' | 'select' | 'paginated-select'

export interface SettingField {
  /** Exact legacy stored setting key. */
  key: string
  label: string
  type: FieldType
  placeholder?: string
  /** Options for `type: 'select'`. */
  options?: { value: string; label: string }[]
  /**
   * For `type: 'paginated-select'`, the inventory master-reference resource to
   * page through (e.g. 'tax-rates'). An extra leading "Disable (0)" option is
   * injected to mirror the legacy `$tr['0'] = lang('disable')` behaviour.
   */
  resource?: string
}

export interface SettingGroup {
  title: string
  description?: string
  fields: SettingField[]
}

/* ── shared legacy option maps ─────────────────────────────────────────── */

/** $ps = Disable / Enable (stored as '0' / '1'). */
const ENABLE_DISABLE: SettingField['options'] = [
  { value: '0', label: 'Disable' },
  { value: '1', label: 'Enable' },
]

/** $wm = No / Yes (stored as '0' / '1'). */
const YES_NO: SettingField['options'] = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' },
]

/* ── Local Languages: EzSettings::getLanguageList() in the legacy app ────── */
const LOCAL_LANGUAGES: SettingField['options'] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
]

/* ── Default Currencies: legacy builds options from the `currencies` table.
   A reasonable static set keyed by currency code (matching the legacy
   `$cu[$currency->code] = $currency->name` dropdown). ───────────────────── */
const CURRENCIES: SettingField['options'] = [
  { value: 'INR', label: 'Indian Rupee' },
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'British Pound' },
  { value: 'AED', label: 'UAE Dirham' },
]

/* ── Configuration: accounting_method ($am) ──────────────────────────────── */
const ACCOUNTING_METHODS: SettingField['options'] = [
  { value: '0', label: 'FIFO (First In First Out)' },
  { value: '1', label: 'LIFO (Last In First Out)' },
  { value: '2', label: 'AVCO (Average Cost Method)' },
]

/* ── Configuration: rows_per_page (inline $options) ──────────────────────── */
const ROWS_PER_PAGE: SettingField['options'] = [
  { value: '10', label: '10' },
  { value: '15', label: '15' },
  { value: '20', label: '20' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]

/* ── Configuration: dateformat. Legacy builds from the `date_formats` table
   (id → js). A reasonable static set keyed by the common SMA date-format ids. ─ */
const DATE_FORMATS: SettingField['options'] = [
  { value: '1', label: 'dd-mm-yyyy (31-01-2026)' },
  { value: '2', label: 'mm/dd/yyyy (01/31/2026)' },
  { value: '3', label: 'yyyy-mm-dd (2026-01-31)' },
  { value: '4', label: 'dd/mm/yyyy (31/01/2026)' },
]

/* ── Configuration: timezone. Legacy = DateTimeZone::listIdentifiers(); a
   curated subset covering the regions the product ships to. ───────────────── */
const TIMEZONES: SettingField['options'] = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Europe/London', label: 'Europe/London' },
]

/* ── Products ─────────────────────────────────────────────────────────────── */

/** remove_expired ($re_opts). */
const REMOVE_EXPIRED: SettingField['options'] = [
  { value: '0', label: "No, I'll remove" },
  { value: '1', label: 'Yes, remove automatically' },
]

/** display_all_products ($dopts). */
const DISPLAY_ALL_PRODUCTS: SettingField['options'] = [
  { value: '0', label: 'Hide products with 0 quantity' },
  { value: '1', label: 'Show products with 0 quantity' },
]

/** barcode_separator ($bcopts). */
const BARCODE_SEPARATOR: SettingField['options'] = [
  { value: '-', label: '-' },
  { value: '.', label: '.' },
  { value: '~', label: '~' },
  { value: '_', label: '_' },
]

/* ── Sales ──────────────────────────────────────────────────────────────── */

/** overselling via POST `restrict_sale` ($opt = Yes/No, 1/0). */
const OVERSELLING: SettingField['options'] = [
  { value: '1', label: 'Yes' },
  { value: '0', label: 'No' },
]

/** reference_format ($ref). */
const REFERENCE_FORMAT: SettingField['options'] = [
  { value: '1', label: 'Prefix + Year + Number' },
  { value: '2', label: 'Prefix + Month + Year + Number' },
  { value: '3', label: 'Sequence Number' },
  { value: '4', label: 'Random Number' },
  { value: '5', label: 'Prefix + Branch + Year + Number' },
  { value: '6', label: 'Prefix + Branch + Month + Year + Number' },
]

/** item_addition ($ia). */
const ITEM_ADDITION: SettingField['options'] = [
  { value: '0', label: 'Add New Item' },
  { value: '1', label: 'Increase Quantity if Item Exists' },
]

/** set_focus ($sfopts). */
const SET_FOCUS: SettingField['options'] = [
  { value: '0', label: 'Add Item Input' },
  { value: '1', label: 'Last Order Item' },
]

/** invoice_view ($opt_inv). */
const INVOICE_VIEW: SettingField['options'] = [
  { value: '1', label: 'Tax Invoice' },
  { value: '0', label: 'Standard' },
]

/** after_sale_page ($popts). */
const AFTER_SALE_PAGE: SettingField['options'] = [
  { value: '0', label: 'Sales' },
  { value: '1', label: 'Receipt' },
  { value: '2', label: 'Template Receipt' },
]

/* ── Money / Number Format ───────────────────────────────────────────────── */

/** decimals / qty_decimals ($decimals, $qty_decimals). */
const DECIMALS: SettingField['options'] = [
  { value: '0', label: 'Disable' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
]

/** decimals_sep ($dec_point). */
const DECIMALS_SEP: SettingField['options'] = [
  { value: '.', label: 'Dot' },
  { value: ',', label: 'Comma' },
]

/** thousands_sep ($thousands_sep). */
const THOUSANDS_SEP: SettingField['options'] = [
  { value: '.', label: 'Dot' },
  { value: ',', label: 'Comma' },
  { value: '0', label: 'Space' },
]

/** display_symbol ($opts). */
const DISPLAY_SYMBOL: SettingField['options'] = [
  { value: '0', label: 'Disable' },
  { value: '1', label: 'Before' },
  { value: '2', label: 'After' },
]

/** roundoff_purchase / roundoff_sales ($rnd). */
const ROUNDOFF: SettingField['options'] = [
  { value: '0', label: 'Disable' },
  { value: '1', label: 'To nearest 0.05' },
  { value: '2', label: 'To nearest 0.50' },
  { value: '3', label: 'To nearest number' },
  { value: '4', label: 'To next number' },
]

/* ════════════════════════════════════════════════════════════════════════
   Grouped schema. The legacy view uses 5 fieldsets (Site Config, Products,
   Sales, Prefix, Money/Number Format). Per the SiteAdmin spec these are
   re-presented across the named groups below; "General Settings" is merged
   into "Configuration Settings" exactly as the legacy "Site Config" fieldset
   combines them.
   ════════════════════════════════════════════════════════════════════════ */
export const SETTINGS_GROUPS: SettingGroup[] = [
  {
    title: 'Local Languages',
    description: 'Interface language shown across the inventory module.',
    fields: [
      // POST `local_language` → stored `local_language`
      { key: 'local_language', label: 'Local Language', type: 'select', options: LOCAL_LANGUAGES },
    ],
  },
  {
    title: 'Default Currencies',
    description: 'Default currency and how its symbol is displayed.',
    fields: [
      // POST `currency` → stored `default_currency`
      { key: 'default_currency', label: 'Default Currency', type: 'select', options: CURRENCIES },
      // display_symbol + symbol live in the legacy Money/Number-Format fieldset,
      // surfaced here with the currency so the two currency-symbol fields sit together.
      { key: 'display_symbol', label: 'Display Currency Symbol', type: 'select', options: DISPLAY_SYMBOL },
      { key: 'symbol', label: 'Currency Symbol', type: 'text' },
    ],
  },
  {
    title: 'Configuration Settings',
    description: 'General inventory configuration (legacy "Site Config").',
    fields: [
      { key: 'accounting_method', label: 'Accounting Method', type: 'select', options: ACCOUNTING_METHODS },
      { key: 'default_email', label: 'Default Email', type: 'text' },
      { key: 'rows_per_page', label: 'Rows Per Page', type: 'select', options: ROWS_PER_PAGE },
      { key: 'dateformat', label: 'Date Format', type: 'select', options: DATE_FORMATS },
      { key: 'timezone', label: 'Timezone', type: 'select', options: TIMEZONES },
    ],
  },
  {
    title: 'Product Settings',
    description: 'Defaults applied to products (legacy "Products" fieldset).',
    fields: [
      // POST `tax_rate` → stored `default_tax_rate`
      { key: 'default_tax_rate', label: 'Product Tax', type: 'select', options: ENABLE_DISABLE },
      { key: 'racks', label: 'Racks', type: 'select', options: ENABLE_DISABLE },
      { key: 'attributes', label: 'Attributes', type: 'select', options: ENABLE_DISABLE },
      { key: 'product_expiry', label: 'Product Expiry', type: 'select', options: ENABLE_DISABLE },
      { key: 'remove_expired', label: 'Remove Expired', type: 'select', options: REMOVE_EXPIRED },
      { key: 'iwidth', label: 'Image Width', type: 'number', placeholder: 'image width' },
      { key: 'iheight', label: 'Image Height', type: 'number', placeholder: 'image height' },
      { key: 'twidth', label: 'Thumbnail Width', type: 'number', placeholder: 'thumbnail width' },
      { key: 'theight', label: 'Thumbnail Height', type: 'number', placeholder: 'thumbnail height' },
      { key: 'watermark', label: 'Watermark', type: 'select', options: YES_NO },
      { key: 'display_all_products', label: 'Display All Products', type: 'select', options: DISPLAY_ALL_PRODUCTS },
      { key: 'barcode_separator', label: 'Barcode Separator', type: 'select', options: BARCODE_SEPARATOR },
    ],
  },
  {
    title: 'Sales Settings',
    description: 'Defaults applied to sales and quotations (legacy "Sales" fieldset).',
    fields: [
      // POST `restrict_sale` → stored `overselling`
      { key: 'overselling', label: 'Over Selling', type: 'select', options: OVERSELLING },
      { key: 'reference_format', label: 'Reference Format', type: 'select', options: REFERENCE_FORMAT },
      // POST `tax_rate2` → stored `default_tax_rate2`; legacy dropdown = Disable (0)
      // + the tax_rates table, so page the master-reference tax-rates resource.
      { key: 'default_tax_rate2', label: 'Invoice Tax', type: 'paginated-select', resource: 'tax-rates' },
      { key: 'product_discount', label: 'Product Level Discount', type: 'select', options: ENABLE_DISABLE },
      { key: 'product_serial', label: 'Product Serial', type: 'select', options: ENABLE_DISABLE },
      // POST `detect_barcode` → stored `auto_detect_barcode`
      { key: 'auto_detect_barcode', label: 'Auto Detect Barcode', type: 'select', options: ENABLE_DISABLE },
      { key: 'bc_fix', label: 'Barcode Fix', type: 'number' },
      { key: 'item_addition', label: 'Item Addition', type: 'select', options: ITEM_ADDITION },
      { key: 'set_focus', label: 'Set Focus', type: 'select', options: SET_FOCUS },
      { key: 'invoice_view', label: 'Invoice View', type: 'select', options: INVOICE_VIEW },
      { key: 'disable_editing', label: 'Disable Editing', type: 'text' },
      { key: 'discount_limit_percentage', label: 'Discount Limit Percentage', type: 'text' },
      { key: 'discount_limit_amount', label: 'Discount Limit Amount', type: 'text' },
      { key: 'expiry_alert_days', label: 'Expiry Alert Days', type: 'text' },
      { key: 'after_sale_page', label: 'After Sale Page', type: 'select', options: AFTER_SALE_PAGE },
      { key: 'quotation_sales_reducing', label: 'Quotation Sales Reducing', type: 'select', options: ENABLE_DISABLE },
    ],
  },
  {
    title: 'Prefix Settings',
    description: 'Document number prefixes (legacy "Prefix" fieldset).',
    fields: [
      { key: 'sales_prefix', label: 'Sales Prefix', type: 'text' },
      { key: 'return_prefix', label: 'Return Prefix', type: 'text' },
      { key: 'payment_prefix', label: 'Payment Prefix', type: 'text' },
      { key: 'transaction_prefix', label: 'Transaction Prefix', type: 'text' },
      { key: 'delivery_prefix', label: 'Delivery Prefix', type: 'text' },
      { key: 'quote_prefix', label: 'Quote Prefix', type: 'text' },
      { key: 'purchase_prefix', label: 'Purchase Prefix', type: 'text' },
      { key: 'returnp_prefix', label: 'Return Purchase Prefix', type: 'text' },
      { key: 'transfer_prefix', label: 'Transfer Prefix', type: 'text' },
      { key: 'expense_prefix', label: 'Expense Prefix', type: 'text' },
      { key: 'income_prefix', label: 'Income Prefix', type: 'text' },
      { key: 'requisition_prefix', label: 'Requisition Prefix', type: 'text' },
      { key: 'material_prefix', label: 'Material Prefix', type: 'text' },
      { key: 'product_prefix', label: 'Product Prefix', type: 'text' },
    ],
  },
  {
    title: 'Money Settings',
    description: 'Decimal precision and rounding (legacy "Money & Number Format").',
    fields: [
      { key: 'decimals', label: 'Decimals', type: 'select', options: DECIMALS },
      { key: 'qty_decimals', label: 'Quantity Decimals', type: 'select', options: DECIMALS },
      { key: 'sac', label: 'Same as Currency (SAC)', type: 'select', options: ENABLE_DISABLE },
      { key: 'roundoff_purchase', label: 'Round Off Purchase', type: 'select', options: ROUNDOFF },
      { key: 'roundoff_sales', label: 'Round Off Sales', type: 'select', options: ROUNDOFF },
    ],
  },
  {
    title: 'Number Format Settings',
    description: 'Thousands / decimal separators for display (legacy "nsac" block).',
    fields: [
      { key: 'decimals_sep', label: 'Decimals Separator', type: 'select', options: DECIMALS_SEP },
      { key: 'thousands_sep', label: 'Thousands Separator', type: 'select', options: THOUSANDS_SEP },
    ],
  },
]
