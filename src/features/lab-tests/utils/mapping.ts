/* ═══════════════════════════════════════════════════════════════════════
   Lab Test mapping: rich UI `LabTest` (string-based) ⇄ backend DTO/entity
   (enums, integer prices, HH:mm times, nested children).

   SITE_ADMIN templates carry no classification / mandatory / settings refs, so
   none are sent here — the backend nulls them regardless.
   ═══════════════════════════════════════════════════════════════════════ */
import { emptyTest } from './constants'
import type { LabTest, ResultItem, SampleItem } from '../interfaces'
import type {
  AbnormalFlag, AgeUnit, ContainerType, DayOfWeek, LabTestEntity,
  LabTestReferenceRangeDto, LabTestReferenceValueDto, LabTestResultParamDto,
  LabTestSampleDto, LabTestWriteDto, ParameterType, ProcessMethod,
  ReferenceGender, RepeatIntervalUnit, ResultEntryMode, ResultRounding,
  ResultType, SamplePriority, TatUnit,
} from '@/entities/lab-test'

/* ─── FE → backend enum maps ─── */
const PROCESS_METHOD: Record<string, ProcessMethod> = { 'Single Step': 'SINGLE_STEP', 'Multi Step': 'MULTI_STEP' }
const SAMPLE_PRIORITY: Record<string, SamplePriority> = { Routine: 'ROUTINE', Urgent: 'URGENT', STAT: 'STAT' }
const TAT_UNIT: Record<string, TatUnit> = { Minutes: 'MINUTES', Hours: 'HOURS', Days: 'DAYS' }
const DAY: Record<string, DayOfWeek> = { Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY', Thu: 'THURSDAY', Fri: 'FRIDAY', Sat: 'SATURDAY', Sun: 'SUNDAY' }
const CONTAINER: Record<string, ContainerType> = {
  'EDTA Tube (Purple)': 'EDTA_TUBE_PURPLE_TOP', 'Plain Tube (Red)': 'PLAIN_TUBE_RED_TOP',
  'Fluoride Tube (Grey)': 'FLUORIDE_TUBE_GREY_TOP', 'Urine Container': 'URINE_CONTAINER',
  'Citrate Tube (Blue)': 'STERILE_CONTAINER', 'Stool Container': 'STERILE_CONTAINER',
}
const RESULT_TYPE: Record<string, ResultType> = { Quantitative: 'QUANTITATIVE', Qualitative: 'QUALITATIVE', 'Semi-quantitative': 'QUANTITATIVE' }
const PARAM_TYPE: Record<string, ParameterType> = { Measured: 'MEASURED', Calculated: 'CALCULATED' }
const ENTRY_MODE: Record<string, ResultEntryMode> = { Manual: 'MANUAL', Instrument: 'AUTO', Both: 'AUTO' }
const ROUNDING: Record<string, ResultRounding> = {
  'No Rounding': 'NO_ROUNDING', '1 Decimal': 'ONE_DECIMAL', '2 Decimal': 'TWO_DECIMAL',
  '3 Decimal': 'THREE_DECIMAL', 'Whole Number': 'WHOLE_NUMBER', 'Nearest Integer': 'WHOLE_NUMBER',
}
const GENDER: Record<string, ReferenceGender> = { All: 'ALL', Male: 'MALE', Female: 'FEMALE' }
const AGE_UNIT: Record<string, AgeUnit> = { Days: 'DAYS', Months: 'MONTHS', Years: 'YEARS' }
const FLAG: Record<string, AbnormalFlag> = {
  'Bold and Red': 'BOLD_AND_RED', Bold: 'BOLD_ONLY', Italic: 'ITALIC',
  'Italic and Red': 'COLOUR_HIGHLIGHT', 'Italic Bold': 'ITALIC', 'Bold Italic and Red': 'BOLD_AND_RED',
}
const REPEAT_UNIT: Record<string, RepeatIntervalUnit> = { Hours: 'HOURS', Days: 'DAYS', Months: 'MONTHS', Years: 'YEARS' }

/* ─── helpers ─── */
function invert<T extends string>(map: Record<string, T>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [fe, be] of Object.entries(map)) if (!(be in out)) out[be] = fe
  return out
}
const PROCESS_METHOD_R = invert(PROCESS_METHOD), SAMPLE_PRIORITY_R = invert(SAMPLE_PRIORITY),
  TAT_UNIT_R = invert(TAT_UNIT), DAY_R = invert(DAY), CONTAINER_R = invert(CONTAINER),
  RESULT_TYPE_R = invert(RESULT_TYPE), PARAM_TYPE_R = invert(PARAM_TYPE), ENTRY_MODE_R = invert(ENTRY_MODE),
  GENDER_R = invert(GENDER), AGE_UNIT_R = invert(AGE_UNIT),
  FLAG_R = invert(FLAG), REPEAT_UNIT_R = invert(REPEAT_UNIT)

const numOrUndef = (s: string | number | null | undefined): number | undefined => {
  if (s === null || s === undefined || s === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}
const trimOrUndef = (s: string | undefined | null): string | undefined => {
  const t = (s ?? '').trim()
  return t ? t : undefined
}
/** Drop keys whose value is undefined (so we never send nulls for optional fields). */
function prune<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}
const slugCode = (name: string) => name.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 16) || 'PARAM'

/* ═══════════════════════════════════════
   FE LabTest → backend write DTO
═══════════════════════════════════════ */
function sampleToDto(s: SampleItem): LabTestSampleDto {
  return prune({
    sampleType: trimOrUndef(s.sampleType),
    containerType: CONTAINER[s.containerType],
    sampleSize: trimOrUndef(s.sampleSize),
    collectionMethod: trimOrUndef(s.collectionMethod),
    numberOfSamples: s.numberOfSamples || undefined,
    stability: trimOrUndef(s.stability),
    transportTemperature: trimOrUndef(s.transportTemp),
    preservative: trimOrUndef(s.preservative),
    sampleHandlingInstructions: trimOrUndef(s.handlingInstructions),
    isFastingRequired: s.fastingRequired,
    isLightProtection: s.lightProtection,
    isDefault: s.isDefault,
  })
}

function resultToDto(r: ResultItem, t: LabTest, sortOrder: number): LabTestResultParamDto {
  const ranges = t.referenceRanges
    .filter(x => x.parameter === r.parameterName)
    .map((x): LabTestReferenceRangeDto => prune({
      method: trimOrUndef(x.method),
      gender: GENDER[x.gender],
      ageFrom: numOrUndef(x.ageFrom),
      ageFromUnit: AGE_UNIT[x.ageFromUnit],
      ageTo: numOrUndef(x.ageTo),
      ageToUnit: AGE_UNIT[x.ageToUnit],
      lowerLimit: numOrUndef(x.lowerLimit),
      upperLimit: numOrUndef(x.upperLimit),
      criticalMin: numOrUndef(x.criticalMin),
      criticalMax: numOrUndef(x.criticalMax),
      displayOfReferenceRange: trimOrUndef(x.displayRange),
      abnormalFlagLogic: FLAG[x.abnormalFlagLogic],
    }))
  const values = t.referenceValues
    .filter(x => x.parameter === r.parameterName)
    .map((x): LabTestReferenceValueDto | null => {
      const text = trimOrUndef(x.displayRange)
      if (!text) return null // backend requires a non-empty normalValueText
      return prune({
        method: trimOrUndef(x.method),
        gender: GENDER[x.gender],
        ageFrom: numOrUndef(x.ageFrom),
        ageFromUnit: AGE_UNIT[x.ageFromUnit],
        ageTo: numOrUndef(x.ageTo),
        ageToUnit: AGE_UNIT[x.ageToUnit],
        normalValueText: text,
        displayOfReferenceRange: text,
        abnormalFlagLogic: FLAG[x.abnormalFlagLogic],
      }) as LabTestReferenceValueDto
    })
    .filter((v): v is LabTestReferenceValueDto => v !== null)

  return prune({
    groupName: trimOrUndef(r.groupName),
    parameterName: r.parameterName,
    parameterCode: trimOrUndef(r.parameterCode) ?? slugCode(r.parameterName),
    method: trimOrUndef(r.method),
    reportingUnit: trimOrUndef(r.reportingUnit),
    resultType: RESULT_TYPE[r.resultType] ?? 'QUANTITATIVE',
    parameterType: PARAM_TYPE[r.parameterType],
    resultEntryMode: ENTRY_MODE[r.resultEntryMode],
    calculationFormula: trimOrUndef(r.calculationFormula),
    resultRoundingType: ROUNDING[r.resultRounding],
    allowableUnits: trimOrUndef(r.allowableUnits),
    decimalPlaces: r.decimalPlaces ?? undefined,
    criticalMin: numOrUndef(r.criticalValueMin),
    criticalMax: numOrUndef(r.criticalValueMax),
    reflexTests: r.reflexTests.length ? r.reflexTests.map(rt => ({ id: rt.id, name: rt.name })) : undefined,
    notes: trimOrUndef(r.notes),
    isNabl: r.nabl,
    isCap: r.cap,
    sortOrder,
    referenceRanges: ranges.length ? ranges : undefined,
    referenceValues: values.length ? values : undefined,
  })
}

/** Build the create/update payload from a UI LabTest. */
export function toWriteDto(t: LabTest): LabTestWriteDto {
  const tags = t.clinicalTags.split(',').map(s => s.trim()).filter(Boolean)
  return prune({
    testName: t.testName.trim(),
    testDisplayName: trimOrUndef(t.testDisplay),
    testCode: t.testCode.trim(),
    aka: trimOrUndef(t.aka),
    processMethod: PROCESS_METHOD[t.processMethod],
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
    processingTimeFrom: trimOrUndef(t.processingTimeFrom),
    processingTimeTo: trimOrUndef(t.processingTimeTo),
    procTimeMinValue: t.procTimeMin || undefined,
    procTimeMinUnit: TAT_UNIT[t.procTimeMinUnit],
    procTimeMaxValue: t.procTimeMax || undefined,
    procTimeMaxUnit: TAT_UNIT[t.procTimeMaxUnit],
    approvalTimeFrom: trimOrUndef(t.approvalTimeFrom),
    approvalTimeTo: trimOrUndef(t.approvalTimeTo),
    isHideInOrderScreen: t.hideInOrderScreen,
    isPreferenceTest: t.preferredTest,
    isRepeatIntervalRestriction: t.repeatIntervalRestriction,
    repeatIntervalValue: t.repeatIntervalRestriction ? numOrUndef(t.intervalDuration) : undefined,
    repeatIntervalUnit: t.repeatIntervalRestriction ? REPEAT_UNIT[t.intervalUnit] : undefined,
    isActive: t.testStatus === 'Active',
    usefulFor: trimOrUndef(t.usefulFor),
    interpretationOfResults: trimOrUndef(t.interpretation),
    limitations: trimOrUndef(t.limitations),
    remarks: trimOrUndef(t.remarks),
    references: trimOrUndef(t.references),
    samples: t.samples.length ? t.samples.map(sampleToDto) : undefined,
    resultParams: t.results.length ? t.results.map((r, i) => resultToDto(r, t, i + 1)) : undefined,
  })
}

/* ═══════════════════════════════════════
   backend entity → FE LabTest
═══════════════════════════════════════ */
export function fromEntity(e: LabTestEntity): LabTest {
  const base = emptyTest()
  const results: LabTest['results'] = (e.resultParams ?? []).map(p => ({
    id: p.id,
    groupName: p.groupName ?? '',
    groupLayout: '1 Column',
    parameterName: p.parameterName,
    parameterCode: p.parameterCode,
    method: p.method ?? '',
    nabl: p.isNabl,
    cap: p.isCap,
    parameterType: PARAM_TYPE_R[p.parameterType] ?? 'Measured',
    resultEntryMode: ENTRY_MODE_R[p.resultEntryMode] ?? 'Manual',
    calculationFormula: p.calculationFormula ?? '',
    reportingUnit: p.reportingUnit ?? '',
    resultRounding: '2 Decimal',
    decimalPlaces: p.decimalPlaces,
    resultType: RESULT_TYPE_R[p.resultType] ?? 'Quantitative',
    reflexTests: (p.reflexTests ?? []).map(rt => ({ id: rt.id, name: rt.name })),
    criticalValueMin: p.criticalMin != null ? String(p.criticalMin) : '',
    criticalValueMax: p.criticalMax != null ? String(p.criticalMax) : '',
    notes: p.notes ?? '',
    isDefault: false,
  }))
  const referenceRanges: LabTest['referenceRanges'] = (e.resultParams ?? []).flatMap(p =>
    (p.referenceRanges ?? []).map(r => ({
      id: r.id,
      parameter: p.parameterName,
      method: r.method ?? '',
      gender: GENDER_R[r.gender] ?? 'All',
      ageFrom: String(r.ageFrom),
      ageFromUnit: AGE_UNIT_R[r.ageFromUnit] ?? 'Years',
      ageTo: String(r.ageTo),
      ageToUnit: AGE_UNIT_R[r.ageToUnit] ?? 'Years',
      lowerLimit: r.lowerLimit != null ? String(r.lowerLimit) : '',
      upperLimit: r.upperLimit != null ? String(r.upperLimit) : '',
      criticalMin: r.criticalMin != null ? String(r.criticalMin) : '',
      criticalMax: r.criticalMax != null ? String(r.criticalMax) : '',
      displayRange: r.displayOfReferenceRange ?? '',
      abnormalFlagLogic: FLAG_R[r.abnormalFlagLogic] ?? 'Bold and Red',
      isDefault: false,
    })),
  )
  const referenceValues: LabTest['referenceValues'] = (e.resultParams ?? []).flatMap(p =>
    (p.referenceValues ?? []).map(val => ({
      id: val.id,
      parameter: p.parameterName,
      method: val.method ?? '',
      gender: GENDER_R[val.gender] ?? 'All',
      ageFrom: String(val.ageFrom),
      ageFromUnit: AGE_UNIT_R[val.ageFromUnit] ?? 'Years',
      ageTo: String(val.ageTo),
      ageToUnit: AGE_UNIT_R[val.ageToUnit] ?? 'Years',
      displayRange: val.displayOfReferenceRange ?? val.normalValueText,
      abnormalFlagLogic: FLAG_R[val.abnormalFlagLogic] ?? 'Bold and Red',
      isDefault: false,
    })),
  )
  const samples: LabTest['samples'] = (e.samples ?? []).map(s => ({
    id: s.id,
    sampleName: '',
    sampleType: s.sampleType ?? '',
    containerType: s.containerType ? CONTAINER_R[s.containerType] ?? '' : '',
    sampleSize: s.sampleSize ?? '',
    collectionMethod: s.collectionMethod ?? '',
    fastingRequired: s.isFastingRequired,
    numberOfSamples: s.numberOfSamples,
    stability: s.stability ?? '',
    lightProtection: s.isLightProtection,
    preservative: s.preservative ?? '',
    transportTemp: s.transportTemperature ?? '',
    handlingInstructions: s.sampleHandlingInstructions ?? '',
    isDefault: s.isDefault,
  }))

  return {
    ...base,
    id: e.id,
    testName: e.testName,
    testDisplay: e.testDisplayName ?? '',
    testCode: e.testCode,
    aka: e.aka ?? '',
    processMethod: PROCESS_METHOD_R[e.processMethod] ?? 'Single Step',
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
    processingTimeFrom: e.processingTimeFrom ?? '',
    processingTimeTo: e.processingTimeTo ?? '',
    procTimeMin: e.procTimeMinValue ?? 0,
    procTimeMinUnit: e.procTimeMinUnit ? TAT_UNIT_R[e.procTimeMinUnit] ?? 'Hours' : 'Hours',
    procTimeMax: e.procTimeMaxValue ?? 0,
    procTimeMaxUnit: e.procTimeMaxUnit ? TAT_UNIT_R[e.procTimeMaxUnit] ?? 'Hours' : 'Hours',
    approvalTimeFrom: e.approvalTimeFrom ?? '',
    approvalTimeTo: e.approvalTimeTo ?? '',
    hideInOrderScreen: e.isHideInOrderScreen,
    preferredTest: e.isPreferenceTest,
    repeatIntervalRestriction: e.isRepeatIntervalRestriction,
    intervalDuration: e.repeatIntervalValue != null ? String(e.repeatIntervalValue) : '',
    intervalUnit: e.repeatIntervalUnit ? REPEAT_UNIT_R[e.repeatIntervalUnit] ?? 'Hours' : 'Hours',
    testStatus: e.isActive ? 'Active' : 'Inactive',
    usefulFor: e.usefulFor ?? '',
    interpretation: e.interpretationOfResults ?? '',
    limitations: e.limitations ?? '',
    remarks: e.remarks ?? '',
    references: e.references ?? '',
    samples,
    results,
    referenceRanges,
    referenceValues,
  }
}
