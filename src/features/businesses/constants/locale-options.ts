/**
 * Time-zone & currency dropdown options for the business forms. This curated
 * shortlist mirrors the backend's `SUPPORTED_TIMEZONES` / `SUPPORTED_CURRENCIES`
 * (`kalnostics-new/src/modules/tenant/dto/tenant-settings.dto.ts`) — keep the two
 * in sync, since the backend rejects any value not on its list.
 */

export interface LocaleOption {
  value: string
  label: string
}

export const TIMEZONE_OPTIONS: LocaleOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'America/Chicago', label: 'America/Chicago (CT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AET)' },
]

/** Mirrors the backend's `time_format` values (`kalnostics-new` tenant settings). */
export const TIME_FORMAT_OPTIONS: LocaleOption[] = [
  { value: '12h', label: '12-hour (e.g. 03:30 PM)' },
  { value: '24h', label: '24-hour (e.g. 15:30)' },
]

export const CURRENCY_OPTIONS: LocaleOption[] = [
  { value: 'INR', label: 'INR — Indian Rupee (₹)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'AED', label: 'AED — UAE Dirham (د.إ)' },
  { value: 'SGD', label: 'SGD — Singapore Dollar (S$)' },
  { value: 'AUD', label: 'AUD — Australian Dollar (A$)' },
  { value: 'CAD', label: 'CAD — Canadian Dollar (C$)' },
  { value: 'PKR', label: 'PKR — Pakistani Rupee (₨)' },
  { value: 'BDT', label: 'BDT — Bangladeshi Taka (৳)' },
  { value: 'LKR', label: 'LKR — Sri Lankan Rupee (Rs)' },
  { value: 'NPR', label: 'NPR — Nepalese Rupee (रू)' },
]
