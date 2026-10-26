/**
 * Per-`type` tag catalogue for the Site Admin PDF template editor's "Available
 * tags" helper — the Site Admin mirror of the business FE's
 * `kaltros-fe/src/lib/print-templates/print-template-variables.ts`. Keep the two
 * in lockstep: when the backend print-context builders add/rename a field, mirror
 * it in BOTH files so a template authored in either app resolves the same tags.
 *
 * `printTemplateVariablesFor(type)` returns the flat `{tag}` tokens (click to copy
 * a brace-wrapped token); `printTemplateSnippetsFor(type)` returns verbatim Latte
 * expressions for the all-report (Latte-rendered) types.
 */

/** Shared patient tags (mirrors the lab/radiology report patient set). */
const PATIENT_VARIABLES = [
  'patient_name',
  'patient_salutation',
  'patient_age',
  'patient_gender',
  'patient_um_id',
  'patient_mobile',
  'patient_address1',
  'patient_dob',
  'patient_blood_group',
]

/** Single lab report / panel flat context (`lab_report`, `lab_panel`). */
const LAB_REPORT_CONTEXT_VARIABLES = [
  'order_code',
  'order_date',
  'order_date_time',
  'order_external_id',
  ...PATIENT_VARIABLES,
  'referred_by',
  'referral_panel',
  'test_name',
  'report_status',
  'useful_for',
  'interpretation',
  'limitations',
  'remarks',
  'references',
  'last_report_prepared_on',
  'sample_collected_date',
  'sample_received_date',
  'sample_name',
  'sample_type',
  'sample_source_label',
  'report_approved_by_name',
  'report_approved_by_designation',
  'report_approved_by_certifications',
  'report_approved_by_qualification',
  'report_approved_by_registration_no',
  'report_approved_by_signature',
  'patient_image',
  'order_id_barcode',
  'order_id_qr_code',
  'sample_id_barcode',
  'sample_note',
  'test_file_attachment',
]

/**
 * Flat `{placeholder}` variables for a `radiology_report` template — the exact
 * keys built by `RadiologyPrintService.buildVariables` (kalnostics-new). Includes
 * the reporting-doctor tags (incl. the uploaded signature), full billing figures,
 * and `certificate_body` (the whole issued certificate HTML, embedded verbatim).
 */
const RADIOLOGY_REPORT_VARIABLES = [
  'study_no',
  'test_name',
  'modality',
  'body_part',
  'view',
  'findings',
  'impression',
  'recommendation',
  'order_code',
  'order_date',
  'order_date_time',
  'report_date',
  ...PATIENT_VARIABLES,
  'reporting_doctor_type',
  'reporting_doctor_salutation',
  'reporting_doctor_gender',
  'reporting_doctor_first_name',
  'reporting_doctor_last_name',
  'reporting_doctor_full_name',
  'reporting_doctor_registration_no',
  'reporting_doctor_designation',
  'reporting_doctor_signature',
  'referred_by',
  'referral_panel',
  'gross_amount',
  'discount_amount',
  'net_amount',
  'paid_amount',
  'balance_amount',
  'certificate_body',
]

const VARIABLES_BY_TYPE: Record<string, string[]> = {
  lab_report: LAB_REPORT_CONTEXT_VARIABLES,
  lab_panel: LAB_REPORT_CONTEXT_VARIABLES,
  radiology_report: RADIOLOGY_REPORT_VARIABLES,
  // Latte all-report types expose snippets instead of flat variables.
  lab_all_report: [],
  patient_lab_all_report: [],
  radiology_all_report: [],
}

/** Flat `{tag}` tokens available for `type`, or `undefined` when unmapped. */
export function printTemplateVariablesFor(type: string): string[] | undefined {
  return VARIABLES_BY_TYPE[type]
}

/** A ready-to-insert editor snippet: a human label + the exact text to paste. */
export interface PrintTemplateSnippet {
  label: string
  /** Inserted VERBATIM (no brace-wrapping) — used for Latte expressions. */
  snippet: string
}

/** "Insert tag" snippets for the lab all-report types. */
const LAB_ALL_REPORT_SNIPPETS: PrintTemplateSnippet[] = [
  {
    label: 'Body HTML — all tests loop',
    snippet:
      '{foreach $report_tests->tests as $report}\n  {$report->body_html|noescape}\n{/foreach}',
  },
  { label: 'Test — report prepared on', snippet: '{$report->report_prepared_on}' },
  { label: 'Test — sample collected date', snippet: '{$report->sample_collected_date}' },
  { label: 'Test — sample received date', snippet: '{$report->sample_received_date}' },
  { label: 'Test — File+ attachment (PDF)', snippet: '{$report->test_file_attachment|noescape}' },
  { label: 'Patient — full name', snippet: '{$header_fields->patient->full_name}' },
  { label: 'Patient — salutation', snippet: '{$header_fields->patient->salutation}' },
  { label: 'Patient — age', snippet: '{$header_fields->client_age}' },
  { label: 'Patient — gender', snippet: '{$header_fields->client_gender}' },
  { label: 'Patient — phone', snippet: '{$header_fields->client_phone}' },
  { label: 'Patient — UHID', snippet: '{$header_fields->client_uhid}' },
  { label: 'Order — order code', snippet: '{order_code}' },
  { label: 'Order — external id', snippet: '{$header_fields->external_order_id}' },
  { label: 'Order — date & time', snippet: '{$header_fields->order_date_time}' },
  { label: 'Order — sample source', snippet: '{$header_fields->sample_source_label}' },
  { label: 'Referred by', snippet: '{$header_fields->refer_by_name}' },
  { label: 'Referring panel', snippet: '{$header_fields->referring_panel_name}' },
  { label: 'Order — barcode image', snippet: '<img src="{$header_fields->order_id_barcode}" />' },
]

/**
 * "Insert tag" snippets for `radiology_all_report` — the combined radiology
 * report. `reports` is the collection of selected studies; `$report->body_html`
 * is each study's complete report body (its issued certificate HTML). Two body
 * tags: repeating (sequential) and page-break (each study on a new page).
 */
const RADIOLOGY_ALL_REPORT_SNIPPETS: PrintTemplateSnippet[] = [
  // The two distinct one-shot body tags (§5) — each renders EVERY selected
  // study's body in a SINGLE tag, no {foreach} needed.
  {
    label: 'All report bodies — continuous (single tag)',
    snippet: '{$reports_body|noescape}',
  },
  {
    label: 'All report bodies — each on a new page (single tag)',
    snippet: '{$reports_body_paged|noescape}',
  },
  // Advanced: iterate studies yourself for a custom per-study layout.
  {
    label: 'Body — per-study loop (repeating)',
    snippet: '{foreach $reports as $report}\n  {$report->body_html|noescape}\n{/foreach}',
  },
  {
    label: 'Body — per-study loop (each on a new page)',
    snippet:
      '{foreach $reports as $report}\n  <div style="page-break-after: always;">{$report->body_html|noescape}</div>\n{/foreach}',
  },
  { label: 'Study — RAD id', snippet: '{$report->study_no}' },
  { label: 'Study — test name', snippet: '{$report->test_name}' },
  { label: 'Study — modality', snippet: '{$report->modality}' },
  { label: 'Study — body part', snippet: '{$report->body_part}' },
  { label: 'Study — report date', snippet: '{$report->report_date}' },
  { label: 'Study — patient name', snippet: '{$report->patient->full_name}' },
  { label: 'Study — patient salutation', snippet: '{$report->patient->salutation}' },
  { label: 'Study — patient age', snippet: '{$report->patient->age}' },
  { label: 'Study — patient gender', snippet: '{$report->patient->gender}' },
  { label: 'Study — patient phone', snippet: '{$report->patient->phone}' },
  { label: 'Study — patient UHID', snippet: '{$report->patient->uhid}' },
  { label: 'Study — order code', snippet: '{$report->order_code}' },
  { label: 'Study — external order id', snippet: '{$report->external_order_id}' },
  { label: 'Study — order date & time', snippet: '{$report->order_date_time}' },
  { label: 'Study — referred by', snippet: '{$report->refer_by_name}' },
  { label: 'Study — referring panel', snippet: '{$report->referring_panel_name}' },
  { label: 'Study — order barcode image', snippet: '<img src="{$report->order_id_barcode}" />' },
  { label: 'Study — gross amount', snippet: '{$report->gross_amount}' },
  { label: 'Study — discount amount', snippet: '{$report->discount_amount}' },
  { label: 'Study — net amount', snippet: '{$report->net_amount}' },
  { label: 'Study — paid amount', snippet: '{$report->paid_amount}' },
  { label: 'Study — balance amount', snippet: '{$report->balance_amount}' },
  { label: 'Study — reporting doctor name', snippet: '{$report->reporting_doctor->full_name}' },
  { label: 'Study — reporting doctor type', snippet: '{$report->reporting_doctor->type}' },
  { label: 'Study — reporting doctor salutation', snippet: '{$report->reporting_doctor->salutation}' },
  { label: 'Study — reporting doctor gender', snippet: '{$report->reporting_doctor->gender}' },
  { label: 'Study — reporting doctor first name', snippet: '{$report->reporting_doctor->first_name}' },
  { label: 'Study — reporting doctor last name', snippet: '{$report->reporting_doctor->last_name}' },
  { label: 'Study — reporting doctor registration no', snippet: '{$report->reporting_doctor->registration_no}' },
  { label: 'Study — reporting doctor designation', snippet: '{$report->reporting_doctor->designation}' },
  { label: 'Study — reporting doctor signature image', snippet: '<img src="{$report->reporting_doctor->signature}" />' },
  { label: 'Header — patient name', snippet: '{$header_fields->patient->full_name}' },
  { label: 'Header — patient salutation', snippet: '{$header_fields->patient->salutation}' },
  { label: 'Header — patient age', snippet: '{$header_fields->client_age}' },
  { label: 'Header — patient gender', snippet: '{$header_fields->client_gender}' },
  { label: 'Header — patient phone', snippet: '{$header_fields->client_phone}' },
  { label: 'Header — patient UHID', snippet: '{$header_fields->client_uhid}' },
  { label: 'Header — order code', snippet: '{order_code}' },
  { label: 'Header — external order id', snippet: '{$header_fields->external_order_id}' },
  { label: 'Header — order date & time', snippet: '{$header_fields->order_date_time}' },
  { label: 'Header — referred by', snippet: '{$header_fields->refer_by_name}' },
  { label: 'Header — referring panel', snippet: '{$header_fields->referring_panel_name}' },
  { label: 'Header — order barcode image', snippet: '<img src="{$header_fields->order_id_barcode}" />' },
]

const SNIPPETS_BY_TYPE: Record<string, PrintTemplateSnippet[]> = {
  lab_all_report: LAB_ALL_REPORT_SNIPPETS,
  patient_lab_all_report: LAB_ALL_REPORT_SNIPPETS,
  radiology_all_report: RADIOLOGY_ALL_REPORT_SNIPPETS,
}

/** Verbatim Latte snippets for `type`, or `undefined` for flat-only types. */
export function printTemplateSnippetsFor(
  type: string,
): PrintTemplateSnippet[] | undefined {
  return SNIPPETS_BY_TYPE[type]
}
