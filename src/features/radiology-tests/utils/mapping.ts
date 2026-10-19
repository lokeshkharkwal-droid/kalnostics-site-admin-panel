/* ═══════════════════════════════════════════════════════════════════════
   Radiology Test mapping: rich UI `RadiologyTest` (string-based) ⇄ backend
   DTO/entity (enums, integer prices, HH:mm times). The radiology model is FLAT —
   there are no nested children to compose.

   SITE_ADMIN templates carry no classification / settings refs, so none are sent
   here — the backend nulls them regardless.
   ═══════════════════════════════════════════════════════════════════════ */
import { emptyTest } from './constants'
import type { RadiologyTest } from '../interfaces'
import type {
  DayOfWeek, RadiologyModality, RadiologyTestEntity, RadiologyTestWriteDto,
  SamplePriority, TatUnit,
} from '@/entities/radiology-test'

/* ─── FE → backend enum maps ─── */
const MODALITY: Record<string, RadiologyModality> = {
  'X-Ray': 'XRAY', CT: 'CT', MRI: 'MRI', Ultrasound: 'ULTRASOUND',
  Mammography: 'MAMMOGRAPHY', PET: 'PET', Fluoroscopy: 'FLUOROSCOPY',
  DEXA: 'DEXA', Other: 'OTHER',
}
const SAMPLE_PRIORITY: Record<string, SamplePriority> = { Routine: 'ROUTINE', Urgent: 'URGENT', STAT: 'STAT' }
const TAT_UNIT: Record<string, TatUnit> = { Minutes: 'MINUTES', Hours: 'HOURS', Days: 'DAYS' }
const DAY: Record<string, DayOfWeek> = { Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY', Thu: 'THURSDAY', Fri: 'FRIDAY', Sat: 'SATURDAY', Sun: 'SUNDAY' }

/* ─── helpers ─── */
function invert<T extends string>(map: Record<string, T>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [fe, be] of Object.entries(map)) if (!(be in out)) out[be] = fe
  return out
}
const MODALITY_R = invert(MODALITY), SAMPLE_PRIORITY_R = invert(SAMPLE_PRIORITY),
  TAT_UNIT_R = invert(TAT_UNIT), DAY_R = invert(DAY)

const trimOrUndef = (s: string | undefined | null): string | undefined => {
  const t = (s ?? '').trim()
  return t ? t : undefined
}
/** Drop keys whose value is undefined (so we never send nulls for optional fields). */
function prune<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

/* ═══════════════════════════════════════
   FE RadiologyTest → backend write DTO
═══════════════════════════════════════ */
/** Build the create/update payload from a UI RadiologyTest. */
export function toWriteDto(t: RadiologyTest): RadiologyTestWriteDto {
  const tags = t.clinicalTags.split(',').map(s => s.trim()).filter(Boolean)
  return prune({
    testName: t.testName.trim(),
    testDisplayName: trimOrUndef(t.testDisplay),
    testCode: t.testCode.trim(),
    aka: trimOrUndef(t.aka),
    modality: MODALITY[t.modality],
    bodyPart: trimOrUndef(t.bodyPart),
    view: trimOrUndef(t.view),
    isContrast: t.isContrast,
    icdCode: trimOrUndef(t.icdCode),
    loincCode: trimOrUndef(t.loincCode),
    clinicalTags: tags.length ? tags : undefined,
    samplePriorityType: SAMPLE_PRIORITY[t.samplePriorityType],
    isEnableCms: t.enable,
    priceMsrp: Math.round(t.priceMSRP) || undefined,
    priceMaximum: Math.round(t.priceMax) || undefined,
    priceMinimum: Math.round(t.priceMin) || undefined,
    priceOriginal: Math.round(t.priceOriginal) || undefined,
    franchisePrice: Math.round(t.franchisePrice) || undefined,
    emergencyPrice: Math.round(t.emergencyPrice) || undefined,
    commissionPrice: Math.round(t.commissionPrice) || undefined,
    discountCapPct: Math.round(t.discountCap) || undefined,
    isAllowPriceOverride: t.allowPriceOverride,
    isAllowDiscounts: t.isAllowDiscounts,
    tatMinValue: t.tatMin || undefined,
    tatMinUnit: TAT_UNIT[t.tatMinUnit],
    tatMaxValue: t.tatMax || undefined,
    tatMaxUnit: TAT_UNIT[t.tatMaxUnit],
    scheduleDays: t.scheduleDays.map(d => DAY[d]).filter(Boolean) as DayOfWeek[],
    scheduleFrom: trimOrUndef(t.scheduleTimeFrom),
    scheduleTo: trimOrUndef(t.scheduleTimeTo),
    isHideInOrderScreen: t.hideInOrderScreen,
    isPreferenceTest: t.preferredTest,
    isOutsource: t.outsource,
    isBillOnlyTest: t.billOnlyTest,
    isActive: t.testStatus === 'Active',
    usefulFor: trimOrUndef(t.usefulFor),
    interpretationOfResults: trimOrUndef(t.interpretation),
    limitations: trimOrUndef(t.limitations),
    remarks: trimOrUndef(t.remarks),
    references: trimOrUndef(t.references),
    preparationInstructions: trimOrUndef(t.preparationInstructions),
  })
}

/* ═══════════════════════════════════════
   backend entity → FE RadiologyTest
═══════════════════════════════════════ */
export function fromEntity(e: RadiologyTestEntity): RadiologyTest {
  const base = emptyTest()
  return {
    ...base,
    id: e.id,
    testName: e.testName,
    testDisplay: e.testDisplayName ?? '',
    testCode: e.testCode,
    aka: e.aka ?? '',
    modality: MODALITY_R[e.modality] ?? 'Other',
    bodyPart: e.bodyPart ?? '',
    view: e.view ?? '',
    isContrast: e.isContrast,
    icdCode: e.icdCode ?? '',
    loincCode: e.loincCode ?? '',
    clinicalTags: (e.clinicalTags ?? []).join(', '),
    samplePriorityType: SAMPLE_PRIORITY_R[e.samplePriorityType] ?? 'Routine',
    enable: e.isEnableCms,
    priceMSRP: e.priceMsrp,
    priceMax: e.priceMaximum,
    priceMin: e.priceMinimum,
    priceOriginal: e.priceOriginal,
    franchisePrice: e.franchisePrice,
    emergencyPrice: e.emergencyPrice,
    commissionPrice: e.commissionPrice ?? 0,
    discountCap: e.discountCapPct,
    allowPriceOverride: e.isAllowPriceOverride,
    isAllowDiscounts: e.isAllowDiscounts,
    tatMin: e.tatMinValue ?? 0,
    tatMinUnit: e.tatMinUnit ? TAT_UNIT_R[e.tatMinUnit] ?? 'Hours' : 'Hours',
    tatMax: e.tatMaxValue ?? 0,
    tatMaxUnit: e.tatMaxUnit ? TAT_UNIT_R[e.tatMaxUnit] ?? 'Hours' : 'Hours',
    scheduleDays: (e.scheduleDays ?? []).map(d => DAY_R[d]).filter(Boolean),
    scheduleTimeFrom: e.scheduleFrom ?? '',
    scheduleTimeTo: e.scheduleTo ?? '',
    hideInOrderScreen: e.isHideInOrderScreen,
    preferredTest: e.isPreferenceTest,
    outsource: e.isOutsource,
    billOnlyTest: e.isBillOnlyTest,
    testStatus: e.isActive ? 'Active' : 'Inactive',
    usefulFor: e.usefulFor ?? '',
    interpretation: e.interpretationOfResults ?? '',
    limitations: e.limitations ?? '',
    remarks: e.remarks ?? '',
    references: e.references ?? '',
    preparationInstructions: e.preparationInstructions ?? '',
  }
}
