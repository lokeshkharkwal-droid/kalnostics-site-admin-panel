'use client'

/**
 * PhoneInput — country code selector + phone number input joined as one field.
 *
 * On submit, combine as: form.countryCode + form.phone.trim()
 * e.g. "+91" + "9876543210" → "+919876543210"
 */

import { useState, useRef, useEffect } from 'react'

export const PHONE_COUNTRIES = [
  { code: '+91',  iso: 'IN', name: 'India' },
  { code: '+977', iso: 'NP', name: 'Nepal' },
  { code: '+94',  iso: 'LK', name: 'Sri Lanka' },
  { code: '+971', iso: 'AE', name: 'UAE' },
] as const

export type CountryCode = typeof PHONE_COUNTRIES[number]['code']

/**
 * Split a stored combined phone value (e.g. "+919876543210") into
 * { countryCode, phone }. Falls back to India (+91) if no known prefix is found.
 */
export function parsePhone(combined: string | null | undefined): { countryCode: string; phone: string } {
  if (!combined) return { countryCode: '+91', phone: '' }
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.code.length - a.code.length)
  for (const country of sorted) {
    if (combined.startsWith(country.code)) {
      return { countryCode: country.code, phone: combined.slice(country.code.length) }
    }
  }
  return { countryCode: '+91', phone: combined }
}

interface PhoneInputProps {
  countryCode: string
  onCountryCodeChange: (code: string) => void
  phone: string
  onPhoneChange: (phone: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  id?: string
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  label,
  required,
  disabled,
  placeholder = 'Mobile number',
  id = 'phone-input',
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selected = PHONE_COUNTRIES.find(c => c.code === countryCode) ?? PHONE_COUNTRIES[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-notion-sub mb-1">
          {label}{required && <span className="text-notion-red ml-0.5">*</span>}
        </label>
      )}

      <div className="flex rounded-md border border-notion-line2 focus-within:border-notion-blue focus-within:ring-2 focus-within:ring-notion-blue/30 overflow-visible">

        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-2.5 h-8 text-sm text-notion-text bg-notion-panel border-r border-notion-line2 rounded-l-md hover:bg-notion-hover disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <FlagEmoji iso={selected.iso} />
            <span className="font-medium">{selected.code}</span>
            <svg className="w-3.5 h-3.5 text-notion-faint ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-notion-line2 rounded-md shadow-notion-lg w-52 max-h-60 overflow-y-auto">
              {PHONE_COUNTRIES.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => { onCountryCodeChange(country.code); setOpen(false) }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-notion-hover ${
                    country.code === countryCode ? 'bg-blue-50 text-notion-blue font-medium' : 'text-notion-text'
                  }`}
                >
                  <FlagEmoji iso={country.iso} />
                  <span className="flex-1">{country.name}</span>
                  <span className="text-notion-faint">{country.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={e => onPhoneChange(e.target.value.replace(/\D/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="flex-1 px-2.5 h-8 text-sm text-notion-text bg-white rounded-r-md outline-none placeholder:text-notion-faint disabled:bg-notion-panel disabled:cursor-not-allowed min-w-0"
        />
      </div>
    </div>
  )
}

function FlagEmoji({ iso }: { iso: string }) {
  const emoji = iso
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
  return <span className="text-base leading-none">{emoji}</span>
}
