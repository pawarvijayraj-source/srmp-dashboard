#!/bin/bash
# SRMP Dashboard — Complete Setup Script
# Run this from inside your srmp-dashboard folder
# Command: bash setup_srmp_dashboard.sh

echo "🚀 Setting up SRMP Dashboard files..."

# ============================================================
# 1. src/config/columnMaps.js
# ============================================================
cat > src/config/columnMaps.js << 'EOF'
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
  'asc pending': 'ASC Pending',
  'lec pending': 'LEC Pending',
  'fvc pending': 'FVC Pending',
  'court case': 'Court Case',
  'nil selection': 'NIL Selection',
  'dropped': 'Dropped',
  'cancelled': 'Cancelled',
  'commissioned': 'Commissioned',
};

export function normaliseStatus(raw) {
  if (!raw) return '';
  return STATUS_NORMALISE[raw.toLowerCase().trim()] || raw.trim();
}

// Find a value in a row by trying multiple possible header keys
export function getField(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key];
  }
  return '';
}
EOF

echo "✅ columnMaps.js created"

# ============================================================
# 2. src/logic/alertRules.js
# ============================================================
cat > src/logic/alertRules.js << 'EOF'
// ============================================================
// ALERT RULES — All business logic lives here
// Edit only this file when rules, SLAs, or thresholds change
// ============================================================

export const SLA = {
  // Module 1 timers (days)
  ISD_AMBER: 8,
  ISD_RED: 11,
  ISD_EXTENSION_MAX: 20,
  GROUP3_AMBER: 75,
  GROUP3_RED: 85,
  GROUP3_MAX: 90,
  RECTIFICATION_AMBER: 17,
  RECTIFICATION_RED: 22,
  RECTIFICATION_MAX: 21,
  ADVOCATE_AMBER: 21,
  ADVOCATE_RED: 30,
  ASC_AMBER: 14,
  ASC_RED: 21,
  LEC_AMBER: 21,
  LEC_RED: 30,
  FVC_AMBER: 14,
  FVC_RED: 21,

  // Module 2 timers (days)
  MOJNI_AMBER: 30,
  MOJNI_RED: 45,
  NOC_AVAILABLE_IDLE_AMBER: 15,
  NOC_AVAILABLE_IDLE_RED: 22,
  DRAWING_AMBER: 21,
  DRAWING_RED: 30,
  DORMANCY_AMBER: 30,
  DORMANCY_RED: 45,
  NO_LETTERS_RED: 30,
  COMMISSIONING_TARGET_AMBER_MONTHS: 2,
};

export const ALERT_LEVELS = {
  RED: 'red',
  AMBER: 'amber',
  GREEN: 'green',
  GREY: 'grey',
  BLUE: 'blue',
};

export const PENDING_OWNERS = {
  VIJAYRAJ: 'Vijayraj',
  CANDIDATE: 'Candidate',
  STATE_OFFICE: 'State Office',
  ADVOCATE: 'Advocate',
  ASC: 'ASC Committee',
  LEC: 'LEC Committee',
  FVC: 'FVC Team',
  ENGINEERING: 'Engineering',
  LEGAL: 'Legal',
  DM: 'DM Office',
  NH: 'NH Authority',
  DRSH: 'DRSH',
  SRH: 'SRH',
};

// Calculate days between a date string and today
export function daysSince(dateStr) {
  if (!dateStr || dateStr === '') return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  return Math.floor((today - d) / (1000 * 60 * 60 * 24));
}

// Calculate days until a target date
export function daysUntil(dateStr) {
  if (!dateStr || dateStr === '') return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  return Math.floor((d - today) / (1000 * 60 * 60 * 24));
}

// Parse month strings like "JUN'26" or "Jun 2026"
export function parseTargetMonth(str) {
  if (!str || str === '') return null;
  const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const parts = clean.split(/\s+/);
  let month = null, year = null;
  for (const p of parts) {
    if (months[p.slice(0,3)] !== undefined) month = months[p.slice(0,3)];
    if (p.length === 2 && !isNaN(p)) year = 2000 + parseInt(p);
    if (p.length === 4 && !isNaN(p)) year = parseInt(p);
  }
  if (month === null || year === null) return null;
  return new Date(year, month, 1);
}

// ============================================================
// MODULE 1 ALERT ENGINE
// ============================================================

export function getModule1Alert(row, source) {
  const status = row._normalisedStatus || '';
  const today = new Date();

  switch (status) {
    case 'Court Case':
      return {
        level: ALERT_LEVELS.RED,
        pendingOwner: PENDING_OWNERS.LEGAL,
        action: 'Court case frozen — check legal status',
        priority: 1,
      };

    case 'Group 3': {
      const drawDate = row.draw_result_date || row.lot_draw_date || '';
      const days = daysSince(drawDate);
      const g3Single = row.single_g3_locations === 'YES' || row.g3_nil_selection === '';
      let level = ALERT_LEVELS.GREEN;
      if (days >= SLA.GROUP3_RED) level = ALERT_LEVELS.RED;
      else if (days >= SLA.GROUP3_AMBER) level = ALERT_LEVELS.AMBER;
      return {
        level,
        pendingOwner: PENDING_OWNERS.CANDIDATE,
        action: days ? `Group 3 — ${days} of 90 days elapsed` : 'Group 3 — check land identification',
        daysElapsed: days,
        maxDays: SLA.GROUP3_MAX,
        priority: level === ALERT_LEVELS.RED ? 2 : 4,
      };
    }

    case 'ISD & DOC Pending': {
      const resultDate = row.draw_result_date || '';
      const days = daysSince(resultDate);
      let level = ALERT_LEVELS.GREEN;
      if (days >= SLA.ISD_RED) level = ALERT_LEVELS.RED;
      else if (days >= SLA.ISD_AMBER) level = ALERT_LEVELS.AMBER;
      return {
        level,
        pendingOwner: PENDING_OWNERS.CANDIDATE,
        action: days ? `ISD pending — ${days} days elapsed` : 'ISD documents awaited',
        daysElapsed: days,
        maxDays: SLA.ISD_EXTENSION_MAX,
        priority: level === ALERT_LEVELS.RED ? 2 : 4,
      };
    }

    case 'ASC Pending':
      return {
        level: ALERT_LEVELS.AMBER,
        pendingOwner: PENDING_OWNERS.ASC,
        action: 'ASC scrutiny in progress — check for rectification',
        priority: 5,
      };

    case 'LEC Pending':
      return {
        level: ALERT_LEVELS.AMBER,
        pendingOwner: PENDING_OWNERS.LEC,
        action: 'LEC site visit pending — follow up with committee',
        priority: 5,
      };

    case 'FVC Pending':
      return {
        level: ALERT_LEVELS.AMBER,
        pendingOwner: PENDING_OWNERS.FVC,
        action: 'FVC field verification pending',
        priority: 5,
      };

    case 'Draw of Lots':
      return {
        level: ALERT_LEVELS.BLUE,
        pendingOwner: PENDING_OWNERS.STATE_OFFICE,
        action: 'Draw of Lots to be conducted — coordinate with SO',
        priority: 6,
      };

    case 'LOI Issued':
      return {
        level: ALERT_LEVELS.GREEN,
        pendingOwner: null,
        action: 'LOI issued — now in Module 2',
        priority: 10,
      };

    case 'NIL Selection':
    case 'Dropped':
    case 'Cancelled':
      return {
        level: ALERT_LEVELS.GREY,
        pendingOwner: null,
        action: status,
        priority: 99,
      };

    default:
      return {
        level: ALERT_LEVELS.GREY,
        pendingOwner: null,
        action: status || 'Unknown status',
        priority: 99,
      };
  }
}

// ============================================================
// MODULE 2 ALERT ENGINE
// ============================================================

export function getModule2Alert(row) {
  const commissionable = (row.commissionable_yes_no || '').toUpperCase();
  if (commissionable === 'NON COMMISSIONABLE') {
    return {
      level: ALERT_LEVELS.GREY,
      pendingOwner: null,
      action: 'Non-commissionable — to be cancelled',
      priority: 99,
    };
  }

  const alerts = [];

  // Mojni not received
  if (!row.mojini_yes || row.mojini_yes === '' || row.mojini_yes === 'NO') {
    alerts.push({
      level: ALERT_LEVELS.RED,
      pendingOwner: PENDING_OWNERS.ENGINEERING,
      action: 'Mojni not received — drawing blocked',
      priority: 2,
    });
  }

  // NOC available but not progressed
  const nocAvailable = row.pwdnh_noc_available || '';
  const commissionedDate = row.commissioned_ro_20262027_date || '';
  if (nocAvailable.toLowerCase().includes('available') && commissionedDate === '') {
    const days = daysSince(row.noc_applied_yes);
    if (days && days > SLA.NOC_AVAILABLE_IDLE_AMBER) {
      alerts.push({
        level: days > SLA.NOC_AVAILABLE_IDLE_RED ? ALERT_LEVELS.RED : ALERT_LEVELS.AMBER,
        pendingOwner: PENDING_OWNERS.VIJAYRAJ,
        action: `NOC available but commissioning not progressed — ${days} days idle`,
        priority: 2,
      });
    }
  }

  // Zero letters sent and overdue
  const letters = parseInt(row.letter_send_total || '0') || 0;
  if (letters === 0) {
    alerts.push({
      level: ALERT_LEVELS.AMBER,
      pendingOwner: PENDING_OWNERS.VIJAYRAJ,
      action: 'Zero escalation letters sent — neglected case',
      priority: 3,
    });
  }

  // Commissioning target month approaching
  const targetMonth = parseTargetMonth(row.target_month_of_commissioning || '');
  if (targetMonth) {
    const monthsAway = (targetMonth - new Date()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAway < 0) {
      alerts.push({
        level: ALERT_LEVELS.RED,
        pendingOwner: PENDING_OWNERS.VIJAYRAJ,
        action: `Commissioning target month passed — overdue`,
        priority: 1,
      });
    } else if (monthsAway <= SLA.COMMISSIONING_TARGET_AMBER_MONTHS) {
      alerts.push({
        level: ALERT_LEVELS.AMBER,
        pendingOwner: PENDING_OWNERS.VIJAYRAJ,
        action: `Commissioning target in ${Math.round(monthsAway * 30)} days`,
        priority: 3,
      });
    }
  }

  if (alerts.length === 0) {
    return {
      level: ALERT_LEVELS.GREEN,
      pendingOwner: null,
      action: 'On track',
      priority: 10,
    };
  }

  // Return highest priority alert
  return alerts.sort((a, b) => a.priority - b.priority)[0];
}

// ============================================================
// MY ACTIONS TODAY — which cases need Vijayraj's attention
// ============================================================

export function isMyAction(alert) {
  return (
    alert.pendingOwner === PENDING_OWNERS.VIJAYRAJ ||
    alert.level === ALERT_LEVELS.RED ||
    (alert.level === ALERT_LEVELS.AMBER && alert.priority <= 3)
  );
}
EOF

echo "✅ alertRules.js created"

# ============================================================
# 3. src/hooks/useGoogleSheets.js
# ============================================================
cat > src/hooks/useGoogleSheets.js << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { normaliseStatus } from '../config/columnMaps';
import { getModule1Alert, getModule2Alert } from '../logic/alertRules';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export function useGoogleSheets() {
  const [data, setData] = useState({
    dsb2023: [],
    dsb2018: [],
    loi: [],
    writeback: [],
    loading: true,
    error: null,
    lastFetched: null,
  });

  const fetchAll = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [res23, res18, resLoi, resWb] = await Promise.all([
        axios.get(`${APPS_SCRIPT_URL}?action=dsb2023`),
        axios.get(`${APPS_SCRIPT_URL}?action=dsb2018`),
        axios.get(`${APPS_SCRIPT_URL}?action=loi`),
        axios.get(`${APPS_SCRIPT_URL}?action=writeback`),
      ]);

      // Process DSB rows — add normalised status and alert
      const processDSB = (rows, source) =>
        rows
          .filter(r => r.location_current_status || r.advt_srno || r.adv_sr_no)
          .map(r => {
            const normStatus = normaliseStatus(r.location_current_status || '');
            r._normalisedStatus = normStatus;
            r._source = source;
            r._alert = getModule1Alert(r, source);
            return r;
          });

      // Process LOI rows — add alert
      const processLOI = (rows) =>
        rows
          .filter(r => r.location)
          .map(r => {
            r._source = 'LOI_PENDING';
            r._alert = getModule2Alert(r);
            return r;
          });

      const dsb2023 = processDSB(res23.data?.rows || [], 'DSB_2023');
      const dsb2018 = processDSB(res18.data?.rows || [], 'DSB_2018');
      const loi = processLOI(resLoi.data?.rows || []);
      const writeback = resWb.data?.rows || [];

      setData({
        dsb2023,
        dsb2018,
        loi,
        writeback,
        loading: false,
        error: null,
        lastFetched: new Date(),
      });

    } catch (err) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...data, refresh: fetchAll };
}
EOF

echo "✅ useGoogleSheets.js created"

# ============================================================
# 4. src/App.jsx — Main dashboard
# ============================================================
cat > src/App.jsx << 'EOF'
import { useState, useMemo } from 'react';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { ALERT_LEVELS, isMyAction } from './logic/alertRules';
import './App.css';

// ── Helper ──────────────────────────────────────────────────
const alertColor = (level) => ({
  [ALERT_LEVELS.RED]: '#E24B4A',
  [ALERT_LEVELS.AMBER]: '#EF9F27',
  [ALERT_LEVELS.GREEN]: '#4CAF7D',
  [ALERT_LEVELS.BLUE]: '#378ADD',
  [ALERT_LEVELS.GREY]: '#888',
}[level] || '#888');

const alertBg = (level) => ({
  [ALERT_LEVELS.RED]: '#FFF0F0',
  [ALERT_LEVELS.AMBER]: '#FFFBF0',
  [ALERT_LEVELS.GREEN]: '#F0FFF6',
  [ALERT_LEVELS.BLUE]: '#F0F6FF',
  [ALERT_LEVELS.GREY]: '#F5F5F5',
}[level] || '#F5F5F5');

function getLocation(row) {
  return row.location || row.total_location_529_responce_529_locations_online_application_received_2346_advertisment_dt_28062023_last_date_27092023_date_extension_17102023_corrigendum_date_11082023_closing_date_10112023 || row.location_details || 'Unknown location';
}

function getAdvSrNo(row) {
  return row.adv_sr_no || row.advt_srno || row.adv_sr_no_of_location || '';
}

// ── Components ───────────────────────────────────────────────

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '14px 16px',
      border: '1px solid #E8ECF0', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#1F4E79' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ActionCard({ row, module }) {
  const alert = row._alert;
  const location = getLocation(row);
  const district = row.district || row.district_name || '';
  const rsa = row.sales_area || row.retail_sales_area || '';
  const status = row._normalisedStatus || row.commissionable_yes_no || '';

  return (
    <div style={{
      borderLeft: `4px solid ${alertColor(alert.level)}`,
      background: alertBg(alert.level),
      borderRadius: 8, padding: '10px 12px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1F4E79', flex: 1 }}>
          {location.length > 60 ? location.slice(0, 60) + '…' : location}
        </div>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 12,
          background: alertColor(alert.level), color: '#fff', marginLeft: 8, whiteSpace: 'nowrap',
        }}>
          {alert.level?.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{alert.action}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 4, display: 'flex', gap: 12 }}>
        {district && <span>{district}</span>}
        {rsa && <span>{rsa}</span>}
        {alert.pendingOwner && <span>👤 {alert.pendingOwner}</span>}
        <span>📋 {module}</span>
      </div>
      {alert.daysElapsed && (
        <div style={{ marginTop: 6 }}>
          <div style={{
            height: 4, background: '#ddd', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (alert.daysElapsed / alert.maxDays) * 100)}%`,
              background: alertColor(alert.level),
              borderRadius: 2,
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
            {alert.daysElapsed} / {alert.maxDays} days
          </div>
        </div>
      )}
    </div>
  );
}

function RSAHealthRow({ rsa, rows1, rows2 }) {
  const allRows = [...rows1, ...rows2];
  const red = allRows.filter(r => r._alert?.level === ALERT_LEVELS.RED).length;
  const amber = allRows.filter(r => r._alert?.level === ALERT_LEVELS.AMBER).length;
  const green = allRows.filter(r => r._alert?.level === ALERT_LEVELS.GREEN).length;
  const total = allRows.length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, marginBottom: 6,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1F4E79' }}>{rsa}</div>
        <div style={{ fontSize: 10, color: '#999' }}>{total} cases</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {red > 0 && <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#E24B4A', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{red}</span>}
        {amber > 0 && <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#EF9F27', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{amber}</span>}
        {green > 0 && <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4CAF7D', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{green}</span>}
      </div>
    </div>
  );
}

function SearchPanel({ allRows }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return allRows.filter(r => {
      const loc = getLocation(r).toLowerCase();
      const dist = (r.district || r.district_name || '').toLowerCase();
      return loc.includes(q) || dist.includes(q);
    }).slice(0, 5);
  }, [query, allRows]);

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="🔍 Search location or district..."
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: '1px solid #ddd', fontSize: 13, outline: 'none',
          boxSizing: 'border-box', marginBottom: 8,
        }}
      />
      {results.map((row, i) => {
        const alert = row._alert;
        return (
          <div key={i} style={{
            background: alertBg(alert?.level),
            borderLeft: `3px solid ${alertColor(alert?.level)}`,
            borderRadius: 8, padding: '8px 10px', marginBottom: 6,
          }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#1F4E79' }}>
              {getLocation(row).slice(0, 70)}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
              {row.district || row.district_name} · {row.sales_area || row.retail_sales_area} · {row._source}
            </div>
            <div style={{ fontSize: 11, color: alertColor(alert?.level), marginTop: 2 }}>
              {alert?.action}
            </div>
            {row.loi_applicant_mobile_number && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                📞 {row.loi_applicant_mobile_number}
              </div>
            )}
          </div>
        );
      })}
      {query.length >= 2 && results.length === 0 && (
        <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 16 }}>
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────

const RSA_LIST = [
  'Beed RSA', 'Jalgaon North RSA', 'Aurangabad South RSA', 'Dhule RSA',
  'Aurangabad N&W RSA', 'Jalgaon South RSA', 'Aurangabad East RSA',
  'Buldhana RSA', 'Nandurbar RSA',
];

export default function App() {
  const { dsb2023, dsb2018, loi, loading, error, lastFetched, refresh } = useGoogleSheets();
  const [activeTab, setActiveTab] = useState('all');

  const allModule1 = useMemo(() => [...dsb2023, ...dsb2018], [dsb2023, dsb2018]);
  const allRows = useMemo(() => [...allModule1, ...loi], [allModule1, loi]);

  const myActions = useMemo(() =>
    allRows.filter(r => r._alert && isMyAction(r._alert))
      .sort((a, b) => (a._alert?.priority || 99) - (b._alert?.priority || 99)),
    [allRows]
  );

  const redCount = allRows.filter(r => r._alert?.level === ALERT_LEVELS.RED).length;
  const amberCount = allRows.filter(r => r._alert?.level === ALERT_LEVELS.AMBER).length;
  const commissioningTarget = loi.filter(r => r.financial_year_of_expected_commissioning === '2026-27').length;
  const courtCases = allModule1.filter(r => r._normalisedStatus === 'Court Case').length;

  const tabs = [
    { id: 'all', label: 'All Cases' },
    { id: 'm1', label: 'Module 1 — Ad to LOI' },
    { id: 'm2', label: 'Module 2 — LOI to Commissioning' },
    { id: 'actions', label: `My Actions (${myActions.length})` },
  ];

  const visibleActions = useMemo(() => {
    if (activeTab === 'm1') return myActions.filter(r => r._source !== 'LOI_PENDING');
    if (activeTab === 'm2') return myActions.filter(r => r._source === 'LOI_PENDING');
    return myActions;
  }, [activeTab, myActions]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <div style={{ fontSize: 16, color: '#1F4E79', fontWeight: 600 }}>Loading SRMP Dashboard...</div>
      <div style={{ fontSize: 13, color: '#999' }}>Fetching live data from Google Sheets</div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 16, color: '#E24B4A', fontWeight: 600 }}>Failed to load data</div>
      <div style={{ fontSize: 13, color: '#999' }}>{error}</div>
      <button onClick={refresh} style={{ padding: '8px 20px', borderRadius: 8, background: '#1F4E79', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F0F4FA', minHeight: '100vh', padding: 12 }}>

      {/* TOP BAR */}
      <div style={{
        background: '#1F4E79', color: '#fff', borderRadius: 12,
        padding: '12px 20px', marginBottom: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>SRMP Operations Dashboard</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            IOCL Aurangabad Division · Vijayraj ·
            {lastFetched ? ` Updated ${lastFetched.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {redCount > 0 && <span style={{ background: '#E24B4A', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🔴 {redCount} critical</span>}
          {amberCount > 0 && <span style={{ background: '#EF9F27', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🟡 {amberCount} overdue</span>}
          <button onClick={refresh} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <MetricCard label="Total active cases" value={allRows.length} sub={`M1: ${allModule1.length} · M2: ${loi.length}`} />
        <MetricCard label="My actions today" value={myActions.length} sub={`${redCount} red · ${amberCount} amber`} color="#E24B4A" />
        <MetricCard label="FY 2026-27 target" value={commissioningTarget} sub="Commissioning cases" color="#1F4E79" />
        <MetricCard label="Court cases" value={courtCases} sub="Frozen — legal pending" color="#E24B4A" />
        <MetricCard label="DSB 2023 active" value={dsb2023.filter(r => !['LOI Issued','Dropped','Cancelled','NIL Selection'].includes(r._normalisedStatus)).length} sub={`of ${dsb2023.length} total`} />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
            background: activeTab === t.id ? '#1F4E79' : '#fff',
            color: activeTab === t.id ? '#fff' : '#555',
            fontWeight: activeTab === t.id ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* MY ACTIONS */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>⚡ My Actions Today</span>
            <span style={{ fontSize: 12, color: '#E24B4A', fontWeight: 600 }}>{visibleActions.length} pending</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {visibleActions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4CAF7D', padding: 24, fontSize: 14 }}>
                ✅ All clear — no actions needed
              </div>
            ) : (
              visibleActions.map((row, i) => (
                <ActionCard key={i} row={row} module={row._source === 'LOI_PENDING' ? 'M2' : 'M1'} />
              ))
            )}
          </div>
        </div>

        {/* RSA HEALTH */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79', marginBottom: 12 }}>
            🗺️ RSA Health Grid
          </div>
          {RSA_LIST.map(rsa => {
            const rsaKey = rsa.replace(' RSA', '').toLowerCase();
            const rows1 = allModule1.filter(r => (r.sales_area || '').toLowerCase().includes(rsaKey));
            const rows2 = loi.filter(r => (r.retail_sales_area || '').toLowerCase().includes(rsaKey));
            return <RSAHealthRow key={rsa} rsa={rsa} rows1={rows1} rows2={rows2} />;
          })}
          <div style={{ marginTop: 8, fontSize: 10, color: '#bbb', display: 'flex', gap: 12 }}>
            <span>🔴 Critical</span><span>🟡 Overdue</span><span>🟢 On track</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* PIPELINE FUNNEL — M1 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79', marginBottom: 12 }}>📊 M1 Pipeline</div>
          {['Draw of Lots','ISD & DOC Pending','Group 3','ASC Pending','LEC Pending','FVC Pending','LOI Issued'].map(s => {
            const count = allModule1.filter(r => r._normalisedStatus === s).length;
            const max = Math.max(...['Draw of Lots','ISD & DOC Pending','Group 3','ASC Pending','LEC Pending','FVC Pending','LOI Issued'].map(st => allModule1.filter(r => r._normalisedStatus === st).length));
            const pct = max > 0 ? (count / max) * 100 : 0;
            const color = s === 'LOI Issued' ? '#4CAF7D' : s.includes('Court') ? '#E24B4A' : '#2E75B6';
            return (
              <div key={s} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: '#555' }}>{s}</span>
                  <span style={{ fontWeight: 600, color: '#1F4E79' }}>{count}</span>
                </div>
                <div style={{ height: 4, background: '#EEF2F7', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* PIPELINE FUNNEL — M2 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79', marginBottom: 12 }}>📊 M2 Pipeline</div>
          {[
            { label: 'Commissionable', fn: r => r.commissionable_yes_no?.toUpperCase() === 'COMMISSIONABLE' },
            { label: 'Non-Commissionable', fn: r => r.commissionable_yes_no?.toUpperCase() === 'NON COMMISSIONABLE' },
            { label: 'Mojni Pending', fn: r => !r.mojini_yes || r.mojini_yes === '' },
            { label: 'Drawing Ready', fn: r => r.drawing_prepared === 'YES' },
            { label: 'NOC Available', fn: r => (r.pwdnh_noc_available || '').toLowerCase().includes('available') },
            { label: 'IO Obtained', fn: r => r.io_obtained_yes_no === 'YES' },
            { label: 'FY 2026-27 Target', fn: r => r.financial_year_of_expected_commissioning === '2026-27' },
          ].map(({ label, fn }) => {
            const count = loi.filter(fn).length;
            const pct = loi.length > 0 ? (count / loi.length) * 100 : 0;
            return (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: '#555' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#1F4E79' }}>{count}</span>
                </div>
                <div style={{ height: 4, background: '#EEF2F7', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#2E75B6', borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* SEARCH */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79', marginBottom: 12 }}>🔍 Quick Lookup</div>
          <SearchPanel allRows={allRows} />
        </div>

      </div>
    </div>
  );
}
EOF

echo "✅ App.jsx created"

# ============================================================
# 5. src/App.css — Clean styles
# ============================================================
cat > src/App.css << 'EOF'
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #F0F4FA; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
input:focus { border-color: #2E75B6 !important; box-shadow: 0 0 0 2px rgba(46,117,182,0.15); }
button:hover { opacity: 0.9; }
EOF

echo "✅ App.css created"

echo ""
echo "🎉 ALL FILES CREATED SUCCESSFULLY!"
echo ""
echo "Now run: npm run dev"
echo "Then open: http://localhost:5173"
echo ""
