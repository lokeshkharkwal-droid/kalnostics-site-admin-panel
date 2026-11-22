import type { AbnormalFlag } from '@/entities/lab-test'

/**
 * Abnormal Flag Logic v1.3 — the 16 styles, in dropdown order. The style belongs to a result PARAMETER.
 * 9 basic styles are valid for every result type; 7 "with High and Low" styles only for Quantitative.
 * `base` is the basic style a High Low style extends (a basic style is its own base). This is the one place
 * the table lives; the backend (abnormal-flag.util.ts) enforces the same rules.
 */
export interface AbnormalFlagStyle {
  value: AbnormalFlag
  label: string
  isHighLow: boolean
  base: AbnormalFlag
}

const basic = (value: AbnormalFlag, label: string): AbnormalFlagStyle => ({ value, label, isHighLow: false, base: value })
const highLow = (value: AbnormalFlag, label: string, base: AbnormalFlag): AbnormalFlagStyle =>
  ({ value, label, isHighLow: true, base })

export const ABNORMAL_FLAG_STYLES: readonly AbnormalFlagStyle[] = [
  basic('RED_ONLY', 'Red'),
  basic('BOLD_ONLY', 'Bold'),
  basic('ITALIC', 'Italic'),
  basic('BOLD_AND_ITALIC', 'Bold Italic'),
  basic('BOLD_AND_RED', 'Bold and Red'),
  basic('ITALIC_AND_RED', 'Italic and Red'),
  basic('BOLD_ITALIC_AND_RED', 'Bold Italic and Red'),
  basic('UNDERLINE', 'Underline'),
  basic('COLOUR_HIGHLIGHT', 'Colour Highlight'),
  highLow('RED_HIGH_LOW', 'Red with High and Low', 'RED_ONLY'),
  highLow('BOLD_HIGH_LOW', 'Bold with High and Low', 'BOLD_ONLY'),
  highLow('ITALIC_HIGH_LOW', 'Italic with High and Low', 'ITALIC'),
  highLow('BOLD_AND_ITALIC_HIGH_LOW', 'Bold Italic with High and Low', 'BOLD_AND_ITALIC'),
  highLow('BOLD_AND_RED_HIGH_LOW', 'Bold and Red with High and Low', 'BOLD_AND_RED'),
  highLow('ITALIC_AND_RED_HIGH_LOW', 'Italic and Red with High and Low', 'ITALIC_AND_RED'),
  highLow('BOLD_ITALIC_AND_RED_HIGH_LOW', 'Bold Italic and Red with High and Low', 'BOLD_ITALIC_AND_RED'),
]

/** Label shown for "no style" in the dropdown (the stored/form label itself is the empty string). */
export const NO_ABNORMAL_FLAG_LABEL = 'Not set'

const BY_LABEL = new Map(ABNORMAL_FLAG_STYLES.map(s => [s.label, s]))
const BY_VALUE = new Map(ABNORMAL_FLAG_STYLES.map(s => [s.value, s]))

/** Display label → API value (undefined for an unknown label). */
export const flagValueOf = (label: string): AbnormalFlag | undefined => BY_LABEL.get(label)?.value

/** API value → display label. The style is optional: a missing/null/unknown value is blank ('') — never a default style. */
export const flagLabelOf = (value: string | null | undefined): string =>
  (value ? BY_VALUE.get(value as AbnormalFlag)?.label : undefined) ?? ''

/** Only a Quantitative parameter may use a High Low style. `resultType` is the form label ("Quantitative" …). */
export const allowsHighLow = (resultType: string): boolean => resultType === 'Quantitative'

/**
 * The dropdown options (value = label) for a parameter's result type: all 16 for Quantitative, else the 9 basic.
 * The blank "Not set" choice is not in this list — the select adds it first (via its placeholder).
 */
export const abnormalFlagOptionsFor = (resultType: string): { value: string; label: string }[] =>
  ABNORMAL_FLAG_STYLES
    .filter(s => !s.isHighLow || allowsHighLow(resultType))
    .map(s => ({ value: s.label, label: s.label }))

/**
 * The style label a parameter should hold after its result type changes: a High Low style that is no longer
 * valid is reset to the basic style it extends; anything else (including a blank label) is returned unchanged.
 */
export function flagLabelForResultType(flagLabel: string, resultType: string): string {
  const style = BY_LABEL.get(flagLabel)
  if (style?.isHighLow && !allowsHighLow(resultType)) return BY_VALUE.get(style.base)?.label ?? ''
  return flagLabel
}
