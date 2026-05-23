// ============================================================
// COLUMN MAPS — Header-name based mapping for all sheets
// Edit only this file when Nisar adds/renames columns
// ============================================================

export const DSB_2023_COLUMNS = {
  srNo: 'sr_no',
  location: 'total_location_529_responce_529_locations_online_application_received_2346_advertisment_dt_28062023_last_date_27092023_date_extension_17102023_corrigendum_date_11082023_closing_date_10112023',
  district: 'district',
  salesArea: 'sales_area',
  advSrNo: 'adv_sr_no',
  status: 'location_current_status',
  remarks: 'remarks',
  courtCase: 'complaint_court_case',
  marketClass: 'main_category',
  roKsk: 'ro_ksk',
  typeOfSite: 'type_of_site_a_b',
  drawDate: 'lot_draw_date_04122023071220230812202032612202327122023210224092024locaitons_draw_done_293',
  drawResultDate: 'draw_result_date',
  isdDocReceived: 'draw_isd_doc_received_yes',
  advocateReportYes: 'draw_advocate_report_yes',
  ascDone: 'single_asc_done',
  lecTriggered: 'draw_lec_triggered',
  lecDone: 'draw_lec_done',
  fvcTriggered: 'draw_fvc_triggered',
  fvcDone: 'draw_fvc_done',
  loiIssued: 'draw_loi_issued',
  loiNoteInitiated: 'loi_note_initiated',
  loiNoteApproved: 'loi_note_approved_date',
  loiLetterSent: 'loi_letter_sent_date_after_loi_mso_approved',
  applicantName: 'name',
  applicantMobile: 'loi_applicant_mobile_number',
  applicantEmail: 'loi_applicant_email_id',
  g3LoiIssued: 'group_3_loi_issued',
  nilSelection: 'nil_salection',
  singleApplication: 'single_application',
  source: '_source',
};

export const DSB_2018_COLUMNS = {
  srNo: 'sr_no',
  location: 'location_details',
  district: 'district',
  salesArea: 'sales_area',
  advSrNo: 'advt_srno',
  status: 'location_current_status',
  remarks: 'remarks',
  courtCase: 'complaint_court_case',
  marketClass: 'market_class',
  roKsk: 'ro_ksk',
  typeOfSite: 'type_of_site',
  applicantName: 'name_of_successful_candidate',
  applicantMobile: 'mobile_no',
  source: '_source',
};

export const LOI_COLUMNS = {
  srNo: 'sr_no',
  location: 'location',
  district: 'district_name',
  doName: 'do_name',
  salesArea: 'retail_sales_area',
  roKsk: 'ro_or_ksk',
  marketingPlan: 'marketing_plan',
  marketClass: 'market_class',
  nhNo: 'nh_no',
  typeOfSite: 'type_of_site',
  commissionable: 'commissionable_yes_no',
  nonCommissionableReason: 'if_no_brief_reasons_for_non_commissionable',
  fyCommissioning: 'financial_year_of_expected_commissioning',
  targetMonthCommissioning: 'target_month_of_commissioning',
  targetMonthNoc: 'target_month_of_obtaining_noc',
  naAvailable: 'na_availbale',
  pwdNocAvailable: 'pwdnh_noc_available',
  drawingPrepared: 'drawing_prepared',
  pesoCaStatus: 'peso_ca_status',
  ioObtained: 'io_obtained_yes_no',
  developmentNoteInitiated: 'development_note_initiated_yesno',
  developmentNoteApproved: 'development_note_approved_yesno',
  loiIssued: 'loi_issued_as_on_date_01042026',
  loiHolderName: 'loi_holder_name',
  loiApplicantMobile: 'loi_applicant_mobile_number',
  letterSendTotal: 'letter_send_total',
  remarks: 'remarks_04052026',
  nocAppliedDate: 'noc_applied_yes',
  mojiniYes: 'mojini_yes',
  advSrNoOfLocation: 'adv_sr_no_of_location',
  commissionedDate: 'commissioned_ro_20262027_date',
  legalClearanceYesno: 'legal_clearance_obtained_yesno',
  noDaysFromNocApplied: 'no_of_days_from_noc_applied',
  source: '_source',
};

export const WRITEBACK_COLUMNS = {
  advSrNo: 'adv_sr_no',
  loiRefNo: 'loi_ref_no',
  moduleId: 'module_id',
  macroStage: 'macro_stage',
  currentMicroStage: 'current_micro_stage',
  previousMicroStage: 'previous_micro_stage',
  pendingOwner: 'pending_owner',
  responsibilityType: 'responsibility_type',
  stageStartDate: 'current_stage_start_date',
  targetDueDate: 'target_due_date',
  lastMeaningfulProgress: 'last_meaningful_progress_date',
  nextReviewDate: 'next_review_date',
  riskLevel: 'risk_level',
  escalationReason: 'escalation_reason',
  exceptionFlag: 'exception_flag',
  exceptionType: 'exception_type',
  remarks: 'remarks',
  updatedBy: 'updated_by',
  updatedOn: 'updated_on',
};

// Status value normalisation map — handles inconsistent capitalisation
export const STATUS_NORMALISE = {
  'loi issued': 'LOI Issued',
  'draw of lots': 'Draw of Lots',
  'isd & doc pending': 'ISD & DOC Pending',
  'isd pending': 'ISD & DOC Pending',
  'group 3': 'Group 3',
  'group3': 'Group 3',
  'group_3': 'Group 3',
  'group 3 ': 'Group 3',
  'group3 ': 'Group 3',
  'asc pending': 'ASC Pending',
  'lec pending': 'LEC Pending',
  'fvc pending': 'FVC Pending',
  'court case': 'Court Case',
  'nil selection': 'NIL Selection',
  'nil salection': 'NIL Selection',
  'dropped': 'Dropped',
  'drop location': 'Dropped',
  'cancelled': 'Cancelled',
  'commissioned': 'Commissioned',
  'no offer against our advertisement': 'NIL Selection',
};

export function normaliseStatus(raw) {
  if (!raw) return '';
  return STATUS_NORMALISE[raw.toLowerCase().trim()] || raw.trim();
}

// RSA name normalisation — maps all sheet variants to canonical names
export const RSA_NORMALISE = {
  'beed rsa': 'Beed RSA',
  'beed sa': 'Beed RSA',
  'buldhana rsa': 'Buldhana RSA',
  'buldhana sa': 'Buldhana RSA',
  'dhule rsa': 'Dhule RSA',
  'dhule  rsa': 'Dhule RSA',
  'jalgaon north rsa': 'Jalgaon North RSA',
  'jalgaon south rsa': 'Jalgaon South RSA',
  'nandurbar rsa': 'Nandurbar RSA',
  'aurangabad east rsa': 'Aurangabad East RSA',
  'aurangabad east rsa ': 'Aurangabad East RSA',
  'aurangabad south rsa': 'Aurangabad South RSA',
  'aurangabad north & west rsa': 'Aurangabad N&W RSA',
  'aurangabad n&w rsa': 'Aurangabad N&W RSA',
  'aurangabad north and west rsa': 'Aurangabad N&W RSA',
};

export const RSA_LIST = [
  'Beed RSA',
  'Buldhana RSA',
  'Dhule RSA',
  'Jalgaon North RSA',
  'Jalgaon South RSA',
  'Nandurbar RSA',
  'Aurangabad East RSA',
  'Aurangabad South RSA',
  'Aurangabad N&W RSA',
];

export function normaliseRSA(raw) {
  if (!raw) return '';
  return RSA_NORMALISE[raw.trim().toLowerCase()] || raw.trim();
}

// Find a value in a row by trying multiple possible header keys
export function getField(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return '';
}
