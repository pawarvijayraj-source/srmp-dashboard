// ============================================================
// ALERT RULES — All business logic lives here
// Edit only this file when rules, SLAs, or thresholds change
// ============================================================

export const SLA = {
  ISD_AMBER: 8,
  ISD_RED: 11,
  ISD_EXTENSION_MAX: 20,
  GROUP3_AMBER: 75,
  GROUP3_RED: 85,
  GROUP3_MAX: 90,
  RECTIFICATION_AMBER: 17,
  RECTIFICATION_RED: 22,
  RECTIFICATION_MAX: 21,
  LEC_AMBER: 21,
  LEC_RED: 30,
  FVC_AMBER: 14,
  FVC_RED: 21,
  NOC_AVAILABLE_IDLE_AMBER: 15,
  NOC_AVAILABLE_IDLE_RED: 22,
  COMMISSIONING_TARGET_AMBER_MONTHS: 2,
  NEGLECTED_LOI_AGE_DAYS: 365,
  NEGLECTED_REVIEW_DAYS: 15,
  CANCELLATION_MOM_OVERDUE_DAYS: 30,
  CANCELLATION_LETTER_INTERVAL_DAYS: 30,
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
  FO: 'Field Officer',
};

export function daysSince(dateStr) {
  if (!dateStr || dateStr === '') return null;
  const d = parseFlexDate(dateStr);
  if (!d) return null;
  return Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
}

export function daysUntil(dateStr) {
  if (!dateStr || dateStr === '') return null;
  const d = parseFlexDate(dateStr);
  if (!d) return null;
  return Math.floor((d - new Date()) / (1000 * 60 * 60 * 24));
}

export function parseFlexDate(str) {
  if (!str || str === '') return null;
  const clean = String(str).split('/')[0].split(' ')[0].trim();
  const dmy = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
    return new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  }
  const mdy = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return new Date(parseInt(mdy[3]), parseInt(mdy[1]) - 1, parseInt(mdy[2]));
  const d = new Date(clean);
  if (!isNaN(d)) return d;
  return null;
}

export function isDone(val) {
  if (!val || val === '') return false;
  const v = String(val).toLowerCase().trim();
  if (v === 'yes' || v === 'y') return true;
  if (/\d{2}\.\d{2}\.\d{2,4}/.test(v)) return true;
  if (/^\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}/.test(v)) return true;
  return false;
}

export function parseTargetMonth(str) {
  if (!str || str === '') return null;
  if (str.trim() === '2026-27') return new Date(2027, 2, 1);
  if (str.trim() === '2027-28') return new Date(2028, 2, 1);
  if (str.trim() === '2025-26') return new Date(2026, 2, 1);
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

export function inferModule1Stage(row, source) {
  if (source === 'DSB_2023') {
    const loiLetterSent = isDone(row['petrolpump_dealer_chayan_loi_letter_send_date_after_loi_mso_approved']);
    const loiMsoApproved = isDone(row['petrolpump_dealer_chayan_loi_mso_approved_date']);
    const loiNoteApproved = isDone(row['loi_note_approved_date']);
    const loiNoteInitiated = isDone(row['loi_note_initiated']);
    const fvcDone = isDone(row['fvc_done']) || isDone(row['group_3_fvc_done']);
    const lecDone = isDone(row['lec_done']) || isDone(row['group_3_lec_done']);
    if (loiLetterSent) return { stage: 'LOI_ISSUED', asc: true, lec: true, fvc: true, alert: null };
    if (loiMsoApproved) return { stage: 'LOI_MSO_APPROVED', asc: true, lec: true, fvc: true, alert: { action: 'LOI letter to be issued to candidate', level: ALERT_LEVELS.RED, priority: 1 } };
    if (loiNoteApproved) return { stage: 'LOI_NOTE_APPROVED', asc: true, lec: true, fvc: true, alert: { action: 'LOI MSO approval pending', level: ALERT_LEVELS.AMBER, priority: 2 } };
    if (loiNoteInitiated) return { stage: 'LOI_NOTE_INITIATED', asc: true, lec: true, fvc: true, alert: { action: 'LOI note initiated — approval pending', level: ALERT_LEVELS.AMBER, priority: 2 } };
    if (fvcDone) return { stage: 'FVC_DONE', asc: true, lec: true, fvc: true, alert: { action: 'FVC done — initiate LOI note', level: ALERT_LEVELS.AMBER, priority: 3 } };
    if (lecDone) return { stage: 'LEC_DONE', asc: true, lec: true, fvc: false, alert: null };
    return { stage: null, asc: false, lec: false, fvc: false, alert: null };
  }
  if (source === 'DSB_2018') {
    const loiLetterSent = isDone(row['petrolpump_dealer_chayan_loi_letter_send_date_after_loi_mso_approved']);
    const loiMsoApproved = isDone(row['petrolpump_dealer_chayan_loi_mso_approved_date']);
    const rdbApproval = isDone(row['rdb_loi_approval_date']);
    const rdbNote = isDone(row['rdb_or_unnayan_note']);
    const fvcDone = isDone(row['fvc_done_yesno']) || isDone(row['date_of_conducting_fvc']);
    const lecDone = isDone(row['lec_done_yesno']) || isDone(row['date_of_conducting_lec']);
    if (loiLetterSent) return { stage: 'LOI_ISSUED', asc: true, lec: true, fvc: true, alert: null };
    if (loiMsoApproved) return { stage: 'LOI_MSO_APPROVED', asc: true, lec: true, fvc: true, alert: { action: 'LOI letter to be issued to candidate', level: ALERT_LEVELS.RED, priority: 1 } };
    if (rdbApproval) return { stage: 'RDB_APPROVED', asc: true, lec: true, fvc: true, alert: { action: 'RDB approved — MSO approval pending', level: ALERT_LEVELS.AMBER, priority: 2 } };
    if (rdbNote) return { stage: 'RDB_NOTE', asc: true, lec: true, fvc: true, alert: { action: 'RDB/Unnayan note done — approval pending', level: ALERT_LEVELS.AMBER, priority: 2 } };
    if (fvcDone) return { stage: 'FVC_DONE', asc: true, lec: true, fvc: true, alert: { action: 'FVC done — initiate RDB note', level: ALERT_LEVELS.AMBER, priority: 3 } };
    if (lecDone) return { stage: 'LEC_DONE', asc: true, lec: true, fvc: false, alert: null };
    return { stage: null, asc: false, lec: false, fvc: false, alert: null };
  }
  return { stage: null, asc: false, lec: false, fvc: false, alert: null };
}

export function getModule1Alert(row, source) {
  const status = row._normalisedStatus || '';
  const inferred = inferModule1Stage(row, source);
  if (inferred.alert) return { ...inferred.alert, pendingOwner: PENDING_OWNERS.VIJAYRAJ, bucket: 'actions' };

  switch (status) {
    case 'Court Case':
      return { level: ALERT_LEVELS.RED, pendingOwner: PENDING_OWNERS.LEGAL, action: 'Court case frozen — check legal status', priority: 1, bucket: 'court' };
    case 'Group 3': {
      const days = daysSince(row.draw_result_date || row.lot_draw_date || '');
      let level = days >= SLA.GROUP3_RED ? ALERT_LEVELS.RED : days >= SLA.GROUP3_AMBER ? ALERT_LEVELS.AMBER : ALERT_LEVELS.GREEN;
      return { level, pendingOwner: PENDING_OWNERS.CANDIDATE, action: days ? `Group 3 — ${days} of 90 days elapsed` : 'Group 3 — check land identification', daysElapsed: days, maxDays: SLA.GROUP3_MAX, priority: level === ALERT_LEVELS.RED ? 2 : 4, bucket: 'actions' };
    }
    case 'ISD & DOC Pending': {
      const days = daysSince(row.draw_result_date || '');
      let level = days >= SLA.ISD_RED ? ALERT_LEVELS.RED : days >= SLA.ISD_AMBER ? ALERT_LEVELS.AMBER : ALERT_LEVELS.GREEN;
      return { level, pendingOwner: PENDING_OWNERS.CANDIDATE, action: days ? `ISD pending — ${days} days elapsed` : 'ISD documents awaited', daysElapsed: days, maxDays: SLA.ISD_EXTENSION_MAX, priority: level === ALERT_LEVELS.RED ? 2 : 4, bucket: 'actions' };
    }
    case 'ASC Pending':
      return { level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.ASC, action: 'ASC scrutiny in progress', priority: 5, bucket: 'actions' };
    case 'LEC Pending':
      return { level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.LEC, action: 'LEC site visit pending — follow up with committee', priority: 5, bucket: 'actions' };
    case 'FVC Pending':
      return { level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.FVC, action: 'FVC field verification pending', priority: 5, bucket: 'actions' };
    case 'Draw of Lots':
      return { level: ALERT_LEVELS.BLUE, pendingOwner: PENDING_OWNERS.STATE_OFFICE, action: 'Draw of Lots to be conducted', priority: 6, bucket: 'actions' };
    case 'LOI Issued':
      return { level: ALERT_LEVELS.GREEN, pendingOwner: null, action: 'LOI issued — now in Module 2', priority: 10, bucket: 'none' };
    case 'Commissioned':
      return { level: ALERT_LEVELS.GREEN, pendingOwner: null, action: 'Commissioned ✅', priority: 99, bucket: 'none' };
    case 'NIL Selection':
    case 'Dropped':
    case 'Cancelled':
      return { level: ALERT_LEVELS.GREY, pendingOwner: null, action: status, priority: 99, bucket: 'none' };
    default:
      return { level: ALERT_LEVELS.GREY, pendingOwner: null, action: status || 'Unknown', priority: 99, bucket: 'none' };
  }
}

export function getModule2Alert(row) {
  const commissionable = (row.commissionable_yes_no || '').toUpperCase();
  if (commissionable === 'NON COMMISSIONABLE') {
    return { level: ALERT_LEVELS.GREY, pendingOwner: null, action: getCancellationAction(row), priority: 99, bucket: 'cancellation' };
  }

  const alerts = [];
  const isCommissionable = commissionable === 'COMMISSIONABLE';
  const targetMonthStr = (row.target_month_of_commissioning || '').trim();
  const isSpecificTarget = targetMonthStr && targetMonthStr !== 'Not applicable' && targetMonthStr !== 'NA' && targetMonthStr !== '';

  const drawingRaw = (row.drawing_prepared || '').toString().trim().toLowerCase();
  if (drawingRaw.includes('mojni not received') || drawingRaw === 'mojni pending') {
    alerts.push({ level: ALERT_LEVELS.RED, pendingOwner: PENDING_OWNERS.ENGINEERING, action: 'Mojni not received — drawing blocked', priority: 2, bucket: 'actions' });
  } else if (drawingRaw.includes('mojni received') && drawingRaw.includes('pending')) {
    alerts.push({ level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.ENGINEERING, action: 'Mojni received — drawing pending', priority: 3, bucket: 'actions' });
  }

  const nocAvailable = (row.pwdnh_noc_available || row.policerevenue_noc_available || '').toLowerCase();
  const commissionedDate = row.commissioned_ro_20262027_date || '';
  if (nocAvailable.includes('available') && commissionedDate === '') {
    const days = daysSince(row.noc_applied_date || row.noc_applied_yes);
    if (days && days > SLA.NOC_AVAILABLE_IDLE_AMBER) {
      alerts.push({ level: days > SLA.NOC_AVAILABLE_IDLE_RED ? ALERT_LEVELS.RED : ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.VIJAYRAJ, action: `NOC available — not progressed (${days} days)`, priority: 2, bucket: 'actions' });
    }
  }

  const loiDate = parseFlexDate(row.loi_issued_date || row.loi_issued_as_on_date_01042026);
  const loiAgeDays = loiDate ? Math.floor((new Date() - loiDate) / (1000 * 60 * 60 * 24)) : null;
  const dmNocRaw = (row.na_availbale || '').toLowerCase();
  const dmNocMissing = !dmNocRaw || dmNocRaw === '' || dmNocRaw === 'no' || dmNocRaw === 'n';
  if (isCommissionable && loiAgeDays && loiAgeDays > SLA.NEGLECTED_LOI_AGE_DAYS && dmNocMissing) {
    alerts.push({ level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.VIJAYRAJ, action: `Neglected — LOI ${Math.round(loiAgeDays/365*10)/10} yrs old, no progress`, priority: 5, bucket: 'neglected', loiAgeDays });
  }

  if (isCommissionable && isSpecificTarget) {
    const targetMonth = parseTargetMonth(targetMonthStr);
    if (targetMonth) {
      const monthsAway = (targetMonth - new Date()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAway < 0 && monthsAway > -6) {
        alerts.push({ level: ALERT_LEVELS.RED, pendingOwner: PENDING_OWNERS.VIJAYRAJ, action: `Target ${targetMonthStr} passed — push now`, priority: 1, bucket: 'actions' });
      } else if (monthsAway >= 0 && monthsAway <= SLA.COMMISSIONING_TARGET_AMBER_MONTHS) {
        alerts.push({ level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.VIJAYRAJ, action: `Target ${targetMonthStr} — ${Math.round(monthsAway * 30)} days away`, priority: 3, bucket: 'actions' });
      }
    }
  }

  const letters = parseInt(row.letter_send_total || '0') || 0;
  if (letters === 0 && isCommissionable && isSpecificTarget) {
    const tMonth = parseTargetMonth(targetMonthStr);
    if (tMonth) {
      const monthsAway = (tMonth - new Date()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAway <= 4) {
        alerts.push({ level: ALERT_LEVELS.AMBER, pendingOwner: PENDING_OWNERS.VIJAYRAJ, action: 'Zero letters sent — neglected case', priority: 4, bucket: 'neglected' });
      }
    }
  }

  if (alerts.length === 0) return { level: ALERT_LEVELS.GREEN, pendingOwner: null, action: 'On track', priority: 10, bucket: 'none' };
  return alerts.sort((a, b) => a.priority - b.priority)[0];
}

export function getCancellationAction(row) {
  const letters = parseInt(row.letter_send_total || '0') || 0;
  const momDateRaw = row.mom_date || '';
  const momDate = parseFlexDate(momDateRaw);
  const momAgeDays = momDate ? Math.floor((new Date() - momDate) / (1000 * 60 * 60 * 24)) : null;
  if (momDate && momAgeDays > SLA.CANCELLATION_MOM_OVERDUE_DAYS) return `MOM ${momAgeDays} days ago — seek FO cancellation recommendation`;
  if (momDate) return `MOM done — await ${SLA.CANCELLATION_MOM_OVERDUE_DAYS - momAgeDays} more days`;
  if (letters >= 3) return `${letters} letters sent — conduct MOM now`;
  if (letters > 0) return `${letters}/3 letters sent — send next letter`;
  return 'No letters sent — send first cancellation letter';
}

export function isMyAction(alert) {
  if (!alert) return false;
  if (alert.bucket === 'none' || alert.bucket === 'cancellation' || alert.bucket === 'neglected') return false;
  return alert.pendingOwner === PENDING_OWNERS.VIJAYRAJ || alert.level === ALERT_LEVELS.RED || (alert.level === ALERT_LEVELS.AMBER && alert.priority <= 3);
}

export function isCourtCase(alert) {
  return alert?.bucket === 'court';
}

export function isNeglected(alert) {
  return alert?.bucket === 'neglected';
}

export function isCancellation(row) {
  return (row.commissionable_yes_no || '').toUpperCase() === 'NON COMMISSIONABLE';
}
