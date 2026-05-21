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
// Special rule: "2026-27" → MAR'27, "2027-28" → MAR'28
export function parseTargetMonth(str) {
  if (!str || str === '') return null;
  
  // Handle financial year format
  if (str.trim() === '2026-27') return new Date(2027, 2, 1); // MAR 2027
  if (str.trim() === '2027-28') return new Date(2028, 2, 1); // MAR 2028
  if (str.trim() === '2025-26') return new Date(2026, 2, 1); // MAR 2026
  
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

  // ── Mojni / Drawing detection ──────────────────────────────
  // "Drawing Prepared" column contains:
  //   "Yes"          → drawing done, Mojni received
  //   "Mojni Pending" → Mojni not yet received, drawing blocked
  //   blank          → unknown — do NOT flag as Mojni pending
  const drawingRaw = (row.drawing_prepared || '').toString().trim().toLowerCase();
  const mojniPending = drawingRaw === 'mojni pending' || drawingRaw === 'mojni_pending';

  if (mojniPending) {
    alerts.push({
      level: ALERT_LEVELS.RED,
      pendingOwner: PENDING_OWNERS.ENGINEERING,
      action: 'Mojni not received — drawing blocked',
      priority: 2,
    });
  }

  // ── NOC available but commissioning not progressed ─────────
  const nocAvailable = (row.pwdnh_noc_available || row.policerevenue_noc_available || '').toLowerCase();
  const commissionedDate = row.commissioned_ro_20262027_date || '';
  if (nocAvailable.includes('available') && commissionedDate === '') {
    const days = daysSince(row.noc_applied_date || row.noc_applied_yes);
    if (days && days > SLA.NOC_AVAILABLE_IDLE_AMBER) {
      alerts.push({
        level: days > SLA.NOC_AVAILABLE_IDLE_RED ? ALERT_LEVELS.RED : ALERT_LEVELS.AMBER,
        pendingOwner: PENDING_OWNERS.VIJAYRAJ,
        action: `NOC available but commissioning not progressed — ${days} days idle`,
        priority: 2,
      });
    }
  }

  // ── Zero letters sent — only flag commissionable cases with specific target ──
  const letters = parseInt(row.letter_send_total || '0') || 0;
  if (letters === 0 && isCommissionable && isSpecificMonth) {
    const tMonth = parseTargetMonth(targetMonthStr2);
    if (tMonth) {
      const monthsAway = (tMonth - new Date()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAway <= 4) {
        alerts.push({
          level: ALERT_LEVELS.AMBER,
          pendingOwner: PENDING_OWNERS.VIJAYRAJ,
          action: 'Zero escalation letters sent — neglected case',
          priority: 4,
        });
      }
    }
  }

  // ── Commissioning target month ─────────────────────────────
  // Only flag COMMISSIONABLE cases with specific month targets (not just year)
  const isCommissionable = (row.commissionable_yes_no || '').toUpperCase() === 'COMMISSIONABLE';
  const targetMonthStr2 = (row.target_month_of_commissioning || '').trim();
  const isSpecificMonth = targetMonthStr2 && 
    targetMonthStr2 !== 'Not applicable' && 
    targetMonthStr2 !== 'NA' &&
    targetMonthStr2 !== ''; // skip pure year ranges

  if (isCommissionable && isSpecificMonth) {
    const targetMonth = parseTargetMonth(targetMonthStr2);
    if (targetMonth) {
      const monthsAway = (targetMonth - new Date()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAway < 0 && monthsAway > -6) {
        alerts.push({
          level: ALERT_LEVELS.RED,
          pendingOwner: PENDING_OWNERS.VIJAYRAJ,
          action: `Commissioning target ${targetMonthStr2} passed — push now`,
          priority: 1,
        });
      } else if (monthsAway >= 0 && monthsAway <= SLA.COMMISSIONING_TARGET_AMBER_MONTHS) {
        alerts.push({
          level: ALERT_LEVELS.AMBER,
          pendingOwner: PENDING_OWNERS.VIJAYRAJ,
          action: `Commissioning target ${targetMonthStr2} — ${Math.round(monthsAway * 30)} days away`,
          priority: 3,
        });
      }
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
