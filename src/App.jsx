import { useState, useMemo, useCallback } from 'react';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { ALERT_LEVELS, isMyAction, isCourtCase, isNeglected, isCancellation, getCancellationAction, parseTargetMonth, parseFlexDate } from './logic/alertRules';
import './App.css';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// ── Helpers ─────────────────────────────────────────────────
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
  if (row.location && row.location.trim()) return row.location.trim();
  const key = Object.keys(row).find(k =>
    !k.startsWith('_') && row[k] &&
    typeof row[k] === 'string' && row[k].length > 5 &&
    (k.startsWith('total_loc') || k.startsWith('total_location'))
  );
  if (key) return row[key].trim();
  return 'Unknown location';
}

function yesNo(val) {
  if (!val || val === '') return null;
  const v = val.toString().toLowerCase().trim();
  if (v === 'yes' || v === 'y' || v === 'available' || v === 'obtained' || v === 'done') return true;
  if (v === 'no' || v === 'n' || v === 'not available' || v === 'pending') return false;
  return null;
}

function StatusDot({ val, label }) {
  const result = yesNo(val);
  const raw = val || '';
  const color = result === true ? '#4CAF7D' : result === false ? '#E24B4A' : '#999';
  const icon = result === true ? '✅' : result === false ? '❌' : '⏳';
  const display = raw && raw !== '' && raw.toLowerCase() !== 'not applicable' && raw !== 'NA' ? raw : (result === true ? 'Yes' : 'Pending');
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{icon} {display}</span>
    </div>
  );
}

// ── EXPANDED SEARCH CARD ─────────────────────────────────────
function CaseDetailCard({ row }) {
  if (!row) return null;
  const alert = row._alert;
  const isLOI = row._source === 'LOI_PENDING';
  const location = getLocation(row);

  return (
    <div style={{
      background: '#fff', border: `1px solid ${alertColor(alert?.level)}`,
      borderRadius: 10, padding: 12, marginTop: 6,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', lineHeight: 1.3 }}>
            {location.length > 80 ? location.slice(0, 80) + '…' : location}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            {row.district || row.district_name || ''} · {row.sales_area || row.retail_sales_area || ''} · {row._source}
          </div>
        </div>
        {alert && (
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 12,
            background: alertColor(alert.level), color: '#fff', marginLeft: 8, whiteSpace: 'nowrap',
          }}>
            {alert.level?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Identity */}
      <div style={{ background: '#F8FAFC', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {(row.adv_sr_no || row.advt_srno || row.adv_sr_no_of_location) && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: '#999' }}>Adv Sr No: </span>
              <span style={{ color: '#1F4E79', fontWeight: 600 }}>{row.adv_sr_no || row.advt_srno || row.adv_sr_no_of_location}</span>
            </div>
          )}
          {(row.loi_issued_as_on_date_01042026 || row.loi_issued_date) && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: '#999' }}>LOI Date: </span>
              <span style={{ color: '#1F4E79', fontWeight: 600 }}>{row.loi_issued_as_on_date_01042026 || row.loi_issued_date}</span>
            </div>
          )}
          {row.type_of_site && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: '#999' }}>Site Type: </span>
              <span style={{ color: '#1F4E79', fontWeight: 600 }}>{row.type_of_site}</span>
            </div>
          )}
          {(row.market_class || row.main_category) && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: '#999' }}>Market Class: </span>
              <span style={{ color: '#1F4E79', fontWeight: 600 }}>{row.market_class || row.main_category}</span>
            </div>
          )}
          {row.marketing_plan && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: '#999' }}>Mktg Plan: </span>
              <span style={{ color: '#1F4E79', fontWeight: 600 }}>{row.marketing_plan}</span>
            </div>
          )}
          {(row.financial_year_of_expected_commissioning) && (
            <div style={{ fontSize: 11 }}>
              <span style={{ color: '#999' }}>Target FY: </span>
              <span style={{ color: '#1F4E79', fontWeight: 600 }}>{row.financial_year_of_expected_commissioning}</span>
            </div>
          )}
        </div>
      </div>

      {/* Regulatory Status — LOI cases only */}
      {isLOI && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Regulatory Status
          </div>
          <StatusDot val={row.na_availbale} label="NA" />
          <StatusDot val={row.pwdnh_noc_available} label="NH/SH NOC" />
          <StatusDot val={row.peso_ca_status} label="PESO CA" />
          <StatusDot val={row.na_availbale} label="DM NOC" />
          <StatusDot val={row.legal_clearance_obtained_yesno} label="Legal Clearance" />
        </div>
      )}

      {/* Commercial Status — LOI cases only */}
      {isLOI && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Commercial Status
          </div>
          <StatusDot val={row.io_obtained_yes_no} label="IO Obtained" />
          <StatusDot val={row.development_note_approved_yesno} label="Dev Note Approved" />
          {row.target_month_of_commissioning && row.target_month_of_commissioning !== 'Not applicable' && row.target_month_of_commissioning !== 'NA' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: 11, color: '#666' }}>Target Commissioning</span>
              <span style={{ fontSize: 11, color: '#EF9F27', fontWeight: 600 }}>📅 {row.target_month_of_commissioning}</span>
            </div>
          )}
          {row.letter_send_total && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: 11, color: '#666' }}>Letters Sent</span>
              <span style={{ fontSize: 11, color: parseInt(row.letter_send_total) === 0 ? '#E24B4A' : '#555', fontWeight: 600 }}>
                {row.letter_send_total || '0'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Module 1 status */}
      {!isLOI && row._normalisedStatus && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Current Status
          </div>
          <div style={{ fontSize: 12, color: alertColor(alert?.level), fontWeight: 600 }}>
            {row._normalisedStatus}
          </div>
          {alert?.action && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{alert.action}</div>
          )}
        </div>
      )}

      {/* Alert */}
      {alert?.action && (
        <div style={{
          background: alertBg(alert.level), borderRadius: 6,
          padding: '5px 8px', marginBottom: 8, fontSize: 11,
          color: alertColor(alert.level), fontWeight: 500,
        }}>
          ⚡ {alert.action}
        </div>
      )}

      {/* Candidate */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#1F4E79', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          LOI Holder / Candidate
        </div>
        {(row.loi_holder_name || row.name || row.loi_applicant_name) && (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
            {row.loi_holder_name || row.name || row.loi_applicant_name}
          </div>
        )}
        {(row.loi_applicant_mobile_number || row.mobile_no) && (
          <div style={{ fontSize: 12, color: '#378ADD', marginTop: 2 }}>
            📞 {row.loi_applicant_mobile_number || row.mobile_no}
          </div>
        )}
        {row.remarks_04052026 && (
          <div style={{ fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
            📝 {row.remarks_04052026.slice(0, 100)}{row.remarks_04052026.length > 100 ? '…' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SEARCH PANEL ─────────────────────────────────────────────
// ── FORMAT DATE FOR DISPLAY ──────────────────────────────────
function formatDueDate(str) {
  if (!str || str.trim() === '') return null;
  // Expected: DDMMYY HHMM
  const clean = str.replace(/\s+/g, ' ').trim();
  const parts = clean.split(' ');
  if (parts[0] && parts[0].length === 6) {
    const dd = parts[0].slice(0, 2);
    const mm = parts[0].slice(2, 4);
    const yy = parts[0].slice(4, 6);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthName = months[parseInt(mm, 10) - 1] || mm;
    const time = parts[1] ? `${parts[1].slice(0,2)}:${parts[1].slice(2,4)}` : '';
    return `${dd} ${monthName} '${yy}${time ? ' ' + time : ''}`;
  }
  return str;
}

function isDueDateOverdue(str) {
  if (!str || str.trim() === '') return false;
  const clean = str.replace(/\s+/g, ' ').trim();
  const parts = clean.split(' ');
  if (parts[0] && parts[0].length === 6) {
    const dd = parseInt(parts[0].slice(0, 2));
    const mm = parseInt(parts[0].slice(2, 4)) - 1;
    const yy = 2000 + parseInt(parts[0].slice(4, 6));
    const hh = parts[1] ? parseInt(parts[1].slice(0, 2)) : 23;
    const min = parts[1] ? parseInt(parts[1].slice(2, 4)) : 59;
    const due = new Date(yy, mm, dd, hh, min);
    return due < new Date();
  }
  return false;
}

// ── MEETING NOTE FORM ────────────────────────────────────────
function MeetingNoteForm({ row, existingNotes, onSaved }) {
  const [note, setNote] = useState('');
  const [action, setAction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const advSrNo = row.adv_sr_no || row.advt_srno || row.adv_sr_no_of_location || '';
  const location = getLocation(row);

  const handleSave = useCallback(async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const payload = {
        action: 'upsert_writeback',
        data: {
          adv_sr_no: advSrNo,
          loi_ref_no: location.slice(0, 50),
          module_id: 'MEETING_NOTE',
          macro_stage: 'VISITOR_NOTE',
          current_micro_stage: new Date().toISOString(),
          previous_micro_stage: '',
          pending_owner: 'Vijayraj',
          responsibility_type: 'PERSONAL',
          current_stage_start_date: new Date().toLocaleDateString('en-GB'),
          target_due_date: dueDate.trim(),
          last_meaningful_progress_date: new Date().toLocaleDateString('en-GB'),
          next_review_date: dueDate.trim(),
          risk_level: dueDate.trim() ? 'TRACKED' : 'BACKGROUND',
          escalation_reason: action.trim(),
          exception_flag: '',
          exception_type: 'MEETING_NOTE',
          remarks: note.trim(),
          updated_by: 'Vijayraj',
          updated_on: new Date().toISOString(),
        }
      };

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSaved(true);
      setNote('');
      setAction('');
      setDueDate('');
      setTimeout(() => { setSaved(false); if (onSaved) onSaved(); }, 2000);
    } catch (e) {
      console.error('Save failed', e);
    }
    setSaving(false);
  }, [note, action, dueDate, advSrNo, location, onSaved]);

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px dashed #E8ECF0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1F4E79', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        📝 Add Meeting Note
      </div>

      {/* Previous notes */}
      {existingNotes && existingNotes.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Last {existingNotes.length} meeting{existingNotes.length > 1 ? 's' : ''}</div>
          {existingNotes.slice(0, 3).map((n, i) => {
            const dueDate = n.targetduedate || n.target_due_date || '';
            const overdue = isDueDateOverdue(dueDate);
            const noteText = n.remarks || '';
            const actionText = n.escalationreason || n.escalation_reason || '';
            const updatedOn = n.updatedon || n.updated_on || '';
            return (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: 6, padding: '6px 8px', marginBottom: 4, borderLeft: `3px solid ${dueDate ? (overdue ? '#E24B4A' : '#378ADD') : '#ddd'}` }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>
                  {updatedOn ? new Date(updatedOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
                  {dueDate && (
                    <span style={{ marginLeft: 8, color: overdue ? '#E24B4A' : '#378ADD', fontWeight: 700 }}>
                      {overdue ? '🔴 Overdue' : '📅'} {formatDueDate(dueDate)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#333' }}>{noteText}</div>
                {actionText && (
                  <div style={{ fontSize: 10, color: '#EF9F27', marginTop: 2 }}>⚡ {actionText}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Meeting notes... (e.g. Candidate says DM NOC will come by 30th)"
        rows={2}
        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, resize: 'none', boxSizing: 'border-box', outline: 'none', marginBottom: 5 }}
      />
      <input
        value={action}
        onChange={e => setAction(e.target.value)}
        placeholder="Action to take... (optional)"
        style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, boxSizing: 'border-box', outline: 'none', marginBottom: 5 }}
      />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          placeholder="Due: DDMMYY HHMM (optional)"
          style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !note.trim()}
          style={{
            padding: '5px 14px', borderRadius: 6, border: 'none', cursor: note.trim() ? 'pointer' : 'not-allowed',
            background: saved ? '#4CAF7D' : '#1F4E79', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>
          {saved ? '✅ Saved!' : saving ? '...' : 'Save'}
        </button>
      </div>
      {dueDate && (
        <div style={{ fontSize: 10, color: '#378ADD', marginTop: 3 }}>
          📅 Will appear in To-Do list: {formatDueDate(dueDate)}
        </div>
      )}
    </div>
  );
}

// ── SEARCH PANEL ─────────────────────────────────────────────
function SearchPanel({ allRows, writeback }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();

    const matches = allRows.filter(r => {
      const loc = getLocation(r).toLowerCase();
      const dist = (r.district || r.district_name || '').toLowerCase();
      const adv = (r.adv_sr_no || r.advt_srno || r.adv_sr_no_of_location || '').toLowerCase();
      return loc.includes(q) || dist.includes(q) || adv.includes(q);
    });

    // Deduplicate — prefer LOI_PENDING over DSB records
    const seen = new Map();
    matches.forEach(r => {
      const loc = getLocation(r).trim().toLowerCase().slice(0, 50);
      if (!seen.has(loc)) {
        seen.set(loc, r);
      } else if (r._source === 'LOI_PENDING') {
        seen.set(loc, r);
      }
    });

    return Array.from(seen.values()).slice(0, 6);
  }, [query, allRows]);

  // Get meeting notes for selected row
  const meetingNotes = useMemo(() => {
    if (!selected || !writeback) return [];
    const advKey = (selected.adv_sr_no || selected.advt_srno || selected.adv_sr_no_of_location || '').trim().toUpperCase();
    const locKey = getLocation(selected).trim().toLowerCase().slice(0, 50);
    return writeback
      .filter(n => {
        const nModuleId = n.moduleid || n.module_id || '';
        if (nModuleId !== 'MEETING_NOTE') return false;
        const nAdv = (n.advsrno || n.adv_sr_no || '').trim().toUpperCase();
        const nLoc = (n.loirefno || n.loi_ref_no || '').trim().toLowerCase();
        return (advKey && nAdv === advKey) || (locKey && nLoc.includes(locKey.slice(0, 20)));
      })
      .sort((a, b) => new Date(b.updatedon || b.updated_on) - new Date(a.updatedon || a.updated_on));
  }, [selected, writeback, refreshKey]);

  return (
    <div>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setSelected(null); }}
        placeholder="🔍 Type location, district or Adv Sr No..."
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: '1px solid #ddd', fontSize: 13, outline: 'none',
          boxSizing: 'border-box', marginBottom: 6,
        }}
      />
      {!selected && results.map((row, i) => {
        const alert = row._alert;
        return (
          <div key={i}
            onClick={() => setSelected(row)}
            style={{
              background: alertBg(alert?.level),
              borderLeft: `3px solid ${alertColor(alert?.level)}`,
              borderRadius: 8, padding: '7px 10px', marginBottom: 5,
              cursor: 'pointer',
            }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#1F4E79' }}>
              {getLocation(row).slice(0, 65)}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {row.district || row.district_name} · {row.sales_area || row.retail_sales_area} · {row._source}
            </div>
            <div style={{ fontSize: 11, color: alertColor(alert?.level), marginTop: 2 }}>
              {alert?.action}
            </div>
          </div>
        );
      })}
      {selected && (
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          <button
            onClick={() => setSelected(null)}
            style={{ fontSize: 11, color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 6, padding: 0 }}>
            ← Back to results
          </button>
          <CaseDetailCard row={selected} />
          <MeetingNoteForm
            row={selected}
            existingNotes={meetingNotes}
            onSaved={() => setRefreshKey(k => k + 1)}
          />
        </div>
      )}
      {query.length >= 2 && results.length === 0 && !selected && (
        <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 16 }}>
          No results for "{query}"
        </div>
      )}
    </div>
  );
}

// ── MAY-JUNE WATCHLIST ───────────────────────────────────────
function CommissioningWatchlist({ loi }) {
  const targetMonths = ['MAY\'26', 'JUN\'26'];

  const cases = useMemo(() => {
    return loi.filter(r => {
      const t = (r.target_month_of_commissioning || '').toString().trim().toUpperCase();
      return targetMonths.some(m => t === m || t.includes(m.replace("'", '')));
    }).sort((a, b) => {
      const scoreRow = (r) => {
        let s = 0;
        if (yesNo(r.na_availbale)) s += 30;
        if (yesNo(r.pwdnh_noc_available)) s += 25;
        if (yesNo(r.peso_ca_status)) s += 20;
        if (yesNo(r.io_obtained_yes_no)) s += 15;
        if (yesNo(r.development_note_approved_yesno)) s += 10;
        return s;
      };
      return scoreRow(b) - scoreRow(a);
    });
  }, [loi]);

  const mayCount = cases.filter(r => (r.target_month_of_commissioning || '').toUpperCase().includes('MAY')).length;
  const junCount = cases.filter(r => (r.target_month_of_commissioning || '').toUpperCase().includes('JUN')).length;

  if (cases.length === 0) return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79', marginBottom: 8 }}>🎯 May-June Commissioning</div>
      <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 16 }}>No cases targeted for May-June</div>
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E8ECF0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1F4E79' }}>🎯 May-June Target</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 11, background: '#FFF0F0', color: '#E24B4A', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            MAY: {mayCount}
          </span>
          <span style={{ fontSize: 11, background: '#FFF8F0', color: '#EF9F27', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            JUN: {junCount}
          </span>
        </div>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {cases.map((row, i) => {
          const naOk = yesNo(row.na_availbale);
          const nhOk = yesNo(row.pwdnh_noc_available);
          const pesoOk = yesNo(row.peso_ca_status);
          const ioOk = yesNo(row.io_obtained_yes_no);
          const devOk = yesNo(row.development_note_approved_yesno);
          const score = [naOk, nhOk, pesoOk, ioOk, devOk].filter(Boolean).length;
          const isMay = (row.target_month_of_commissioning || '').toUpperCase().includes('MAY');

          return (
            <div key={i} style={{
              border: `1px solid ${isMay ? '#FFDDD0' : '#FFE8C0'}`,
              borderRadius: 8, padding: '8px 10px', marginBottom: 6,
              background: isMay ? '#FFF8F6' : '#FFFDF5',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1F4E79' }}>
                    {getLocation(row).slice(0, 55)}{getLocation(row).length > 55 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                    {row.district_name} · {row.retail_sales_area}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 8 }}>
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700,
                    background: isMay ? '#E24B4A' : '#EF9F27', color: '#fff',
                  }}>
                    {row.target_month_of_commissioning}
                  </span>
                </div>
              </div>

              {/* Milestone dots */}
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'NA', val: naOk },
                  { label: 'NH NOC', val: nhOk },
                  { label: 'PESO', val: pesoOk },
                  { label: 'IO', val: ioOk },
                  { label: 'Dev Note', val: devOk },
                ].map(({ label, val }) => (
                  <span key={label} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 10,
                    background: val === true ? '#E8F5E9' : val === false ? '#FFEBEE' : '#F5F5F5',
                    color: val === true ? '#4CAF7D' : val === false ? '#E24B4A' : '#999',
                    fontWeight: 500,
                  }}>
                    {val === true ? '✅' : val === false ? '❌' : '⏳'} {label}
                  </span>
                ))}
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 10,
                  background: score >= 4 ? '#E8F5E9' : score >= 2 ? '#FFF8E1' : '#FFEBEE',
                  color: score >= 4 ? '#4CAF7D' : score >= 2 ? '#EF9F27' : '#E24B4A',
                  fontWeight: 700, marginLeft: 'auto',
                }}>
                  {score}/5 ready
                </span>
              </div>

              {row.remarks_04052026 && (
                <div style={{ fontSize: 10, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
                  📝 {row.remarks_04052026.slice(0, 80)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RSA HEALTH ROW ───────────────────────────────────────────
function RSAHealthRow({ rsa, rows1, rows2 }) {
  const allRows = [...rows1, ...rows2];
  const red = allRows.filter(r => r._alert?.level === ALERT_LEVELS.RED).length;
  const amber = allRows.filter(r => r._alert?.level === ALERT_LEVELS.AMBER).length;
  const green = allRows.filter(r => r._alert?.level === ALERT_LEVELS.GREEN).length;
  const total = allRows.length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', background: '#F8FAFC', borderRadius: 8, marginBottom: 5,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1F4E79' }}>{rsa}</div>
        <div style={{ fontSize: 10, color: '#999' }}>{total} cases</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {red > 0 && <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#E24B4A', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{red}</span>}
        {amber > 0 && <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#EF9F27', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{amber}</span>}
        {green > 0 && <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#4CAF7D', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{green}</span>}
      </div>
    </div>
  );
}

// ── ACTION CARD ──────────────────────────────────────────────
function ActionCard({ row }) {
  const alert = row._alert;
  const location = getLocation(row);
  const district = row.district || row.district_name || '';
  const rsa = row.sales_area || row.retail_sales_area || '';

  return (
    <div style={{
      borderLeft: `4px solid ${alertColor(alert.level)}`,
      background: alertBg(alert.level),
      borderRadius: 8, padding: '9px 11px', marginBottom: 7,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#1F4E79', flex: 1 }}>
          {location.length > 60 ? location.slice(0, 60) + '…' : location}
        </div>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 12,
          background: alertColor(alert.level), color: '#fff', marginLeft: 6, whiteSpace: 'nowrap',
        }}>
          {alert.level?.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>{alert.action}</div>
      <div style={{ fontSize: 10, color: '#999', marginTop: 3, display: 'flex', gap: 10 }}>
        {district && <span>{district}</span>}
        {rsa && <span>{rsa}</span>}
        {alert.pendingOwner && <span>👤 {alert.pendingOwner}</span>}
        <span>📋 {row._source === 'LOI_PENDING' ? 'M2' : 'M1'}</span>
      </div>
      {alert.daysElapsed && (
        <div style={{ marginTop: 5 }}>
          <div style={{ height: 3, background: '#ddd', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (alert.daysElapsed / alert.maxDays) * 100)}%`, background: alertColor(alert.level), borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{alert.daysElapsed} / {alert.maxDays} days</div>
        </div>
      )}
    </div>
  );
}

// ── METRIC CARD ──────────────────────────────────────────────
function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #E8ECF0', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || '#1F4E79' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── RSA LIST ─────────────────────────────────────────────────
const RSA_LIST = [
  'Beed', 'Jalgaon North', 'Aurangabad South', 'Dhule',
  'Aurangabad N&W', 'Jalgaon South', 'Aurangabad East',
  'Buldhana', 'Nandurbar',
];

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const { dsb2023, dsb2018, loi, lecByAdvSrNo, fvcByAdvSrNo, writeback, loading, error, lastFetched, refresh } = useGoogleSheets();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedStage, setSelectedStage] = useState(null);
  const [todoRefreshKey, setTodoRefreshKey] = useState(0);
  const [todoPendingActions, setTodoPendingActions] = useState({}); // tracks optimistic UI state

  const allModule1 = useMemo(() => [...dsb2023, ...dsb2018], [dsb2023, dsb2018]);
  const allRows = useMemo(() => [...allModule1, ...loi], [allModule1, loi]);

  const myActions = useMemo(() => {
    return allRows.filter(r => {
      const alert = r._alert;
      if (!alert) return false;
      if (alert.level === ALERT_LEVELS.GREY) return false;
      if (alert.priority >= 20) return false;
      if (isCourtCase(alert) || isNeglected(alert)) return false;
      if (r._source === 'LOI_PENDING' && isCancellation(r)) return false;
      const drawingRaw = (r.drawing_prepared || '').toString().trim().toLowerCase();
      const hasDownstream = drawingRaw === 'yes' || drawingRaw.startsWith('yes') ||
        (r.noc_applied_yes && r.noc_applied_yes !== '') ||
        (r.peso_ca_status && r.peso_ca_status !== '') ||
        r.io_obtained_yes_no === 'YES';
      if (alert.action && alert.action.includes('Mojni not received') && hasDownstream) return false;
      return isMyAction(alert);
    }).sort((a, b) => (a._alert?.priority || 99) - (b._alert?.priority || 99));
  }, [allRows]);

  // Court cases bucket
  const courtCases = useMemo(() =>
    allRows.filter(r => isCourtCase(r._alert)),
    [allRows]
  );

  // Neglected cases bucket
  const neglectedCases = useMemo(() =>
    allRows.filter(r => isNeglected(r._alert)),
    [allRows]
  );

  // Cancellation watchlist
  const cancellationCases = useMemo(() =>
    loi.filter(r => isCancellation(r))
      .sort((a, b) => {
        const letters_a = parseInt(a.letter_send_total || '0') || 0;
        const letters_b = parseInt(b.letter_send_total || '0') || 0;
        return letters_b - letters_a;
      }),
    [loi]
  );

  // My To-Do — only today and next 2 days, exclude completed/parked
  const myTodos = useMemo(() => {
    if (!writeback) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    twoDaysLater.setHours(23, 59, 59, 999);

    const parseDate = (str) => {
      if (!str || str.length < 6) return null;
      const dd = parseInt(str.slice(0, 2));
      const mm = parseInt(str.slice(2, 4)) - 1;
      const yy = 2000 + parseInt(str.slice(4, 6));
      const hh = str.length >= 10 ? parseInt(str.slice(7, 9)) : 0;
      const min = str.length >= 10 ? parseInt(str.slice(9, 11)) : 0;
      return new Date(yy, mm, dd, hh, min);
    };

    return writeback
      .filter(n => {
        const moduleId = n.moduleid || n.module_id || '';
        if (moduleId !== 'MEETING_NOTE') return false;
        const dueDate = n.targetduedate || n.target_due_date || '';
        if (!dueDate || dueDate.trim() === '') return false;
        // Exclude completed or parked
        const status = (n.risklevel || n.risk_level || '').toUpperCase();
        if (status === 'COMPLETED' || status === 'PARKED') return false;
        // Only show overdue + today + next 2 days
        const d = parseDate(dueDate);
        if (!d) return false;
        return d <= twoDaysLater; // includes overdue
      })
      .sort((a, b) => {
        const da = parseDate(a.targetduedate || a.target_due_date || '') || new Date(9999,0,1);
        const db = parseDate(b.targetduedate || b.target_due_date || '') || new Date(9999,0,1);
        return da - db;
      });
  }, [writeback]);

  // Mojni count — based on Drawing Prepared column
  const mojniPending = useMemo(() =>
    loi.filter(r => {
      const d = (r.drawing_prepared || '').toString().trim().toLowerCase();
      return d === 'mojni pending' || d === 'mojni_pending';
    }).length,
    [loi]
  );

  // Top bar: only count Smart Actions bucket (exclude court, neglected, cancellation)
  const redCount = myActions.filter(r => r._alert?.level === ALERT_LEVELS.RED).length;
  const amberCount = myActions.filter(r => r._alert?.level === ALERT_LEVELS.AMBER).length;
  const commissioningTarget = loi.filter(r => (r.financial_year_of_expected_commissioning || '').includes('2026-27')).length;

  const visibleActions = useMemo(() => {
    if (activeTab === 'm1') return myActions.filter(r => r._source !== 'LOI_PENDING');
    if (activeTab === 'm2') return myActions.filter(r => r._source === 'LOI_PENDING');
    return myActions;
  }, [activeTab, myActions]);

  const tabs = [
    { id: 'all', label: 'All Cases' },
    { id: 'm1', label: 'Module 1' },
    { id: 'm2', label: 'Module 2' },
    { id: 'actions', label: `My Actions (${myActions.length})` },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 28 }}>⏳</div>
      <div style={{ fontSize: 15, color: '#1F4E79', fontWeight: 600 }}>Loading SRMP Dashboard...</div>
      <div style={{ fontSize: 12, color: '#999' }}>Fetching live data from Google Sheets</div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 28 }}>⚠️</div>
      <div style={{ fontSize: 15, color: '#E24B4A', fontWeight: 600 }}>Failed to load</div>
      <div style={{ fontSize: 12, color: '#999' }}>{error}</div>
      <button onClick={refresh} style={{ padding: '7px 18px', borderRadius: 8, background: '#1F4E79', color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#F0F4FA', minHeight: '100vh', padding: 10 }}>

      {/* TOP BAR */}
      <div style={{
        background: '#1F4E79', color: '#fff', borderRadius: 12,
        padding: '10px 18px', marginBottom: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>SRMP Operations Dashboard</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>
            IOCL Aurangabad · Vijayraj · {lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {redCount > 0 && <span style={{ background: '#E24B4A', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>🔴 {redCount} critical</span>}
          {amberCount > 0 && <span style={{ background: '#EF9F27', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>🟡 {amberCount} overdue</span>}
          <button onClick={refresh} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer' }}>↻ Refresh</button>
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <MetricCard label="Total active cases" value={allRows.length} sub={`M1: ${allModule1.length} · M2: ${loi.length}`} />
        <MetricCard label="My actions today" value={myActions.length} sub={`${redCount} red · ${amberCount} amber`} color="#E24B4A" />
        <MetricCard label="FY 2026-27 target" value={commissioningTarget} sub="Commissioning cases" />
        <MetricCard label="Court cases" value={courtCases.length} sub="Frozen — legal" color="#E24B4A" />
        <MetricCard label="May-June target" value={loi.filter(r => { const t = (r.target_month_of_commissioning || '').toUpperCase(); return t.includes('MAY') || t.includes('JUN'); }).length} sub="Commissioning cases" color="#EF9F27" />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11,
            background: activeTab === t.id ? '#1F4E79' : '#fff',
            color: activeTab === t.id ? '#fff' : '#555',
            fontWeight: activeTab === t.id ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN GRID — Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>

        {/* MY ACTIONS */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>⚡ Smart Actions</span>
            <span style={{ fontSize: 11, color: '#E24B4A', fontWeight: 600 }}>{visibleActions.length} cases</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {visibleActions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4CAF7D', padding: 20, fontSize: 13 }}>✅ All clear</div>
            ) : (
              visibleActions.map((row, i) => <ActionCard key={i} row={row} />)
            )}
          </div>
        </div>

        {/* MY TO-DO */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>✅ My To-Do</span>
            <span style={{ fontSize: 11, color: myTodos.filter(n => { const d = n.targetduedate || n.target_due_date || ''; const k = `${n.advsrno||n.adv_sr_no||''}_${d}`; return !todoPendingActions[k] && isDueDateOverdue(d); }).length > 0 ? '#E24B4A' : '#888', fontWeight: 600 }}>
              {myTodos.filter(n => { const d = n.targetduedate||n.target_due_date||''; const k = `${n.advsrno||n.adv_sr_no||''}_${d}`; return !todoPendingActions[k]; }).length} tasks · today+2d
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#bbb', marginBottom: 8 }}>Showing overdue + today + next 2 days only</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {myTodos.filter(n => { const d = n.targetduedate||n.target_due_date||''; const k = `${n.advsrno||n.adv_sr_no||''}_${d}`; return !todoPendingActions[k]; }).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20, fontSize: 12 }}>
                No tasks due today or next 2 days<br/>
                <span style={{ fontSize: 11 }}>Search location → add note with due date</span>
              </div>
            ) : (
              myTodos.map((n, i) => {
                const dueDate = n.targetduedate || n.target_due_date || '';
                const overdue = isDueDateOverdue(dueDate);
                const noteText = n.remarks || '';
                const actionText = n.escalationreason || n.escalation_reason || '';
                const locationRef = n.loirefno || n.loi_ref_no || n.advsrno || n.adv_sr_no || '';
                const todoKey = `${n.advsrno || n.adv_sr_no || ''}_${dueDate}`;
                const pendingStatus = todoPendingActions[todoKey];

                if (pendingStatus === 'COMPLETED' || pendingStatus === 'PARKED') return null;

                const handleAction = async (newStatus) => {
                  setTodoPendingActions(prev => ({ ...prev, [todoKey]: newStatus }));
                  try {
                    await fetch(APPS_SCRIPT_URL, {
                      method: 'POST',
                      mode: 'no-cors',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'upsert_writeback',
                        data: {
                          adv_sr_no: n.advsrno || n.adv_sr_no || '',
                          loi_ref_no: locationRef,
                          module_id: 'MEETING_NOTE',
                          macro_stage: 'VISITOR_NOTE',
                          current_micro_stage: n.currentmicrostage || n.current_micro_stage || '',
                          previous_micro_stage: '',
                          pending_owner: 'Vijayraj',
                          responsibility_type: 'PERSONAL',
                          current_stage_start_date: n.currentstagestartdate || '',
                          target_due_date: dueDate,
                          last_meaningful_progress_date: new Date().toLocaleDateString('en-GB'),
                          next_review_date: newStatus === 'PARKED' ? '' : dueDate,
                          risk_level: newStatus,
                          escalation_reason: actionText,
                          exception_flag: '',
                          exception_type: 'MEETING_NOTE',
                          remarks: noteText,
                          updated_by: 'Vijayraj',
                          updated_on: new Date().toISOString(),
                        }
                      }),
                    });
                  } catch(e) {
                    setTodoPendingActions(prev => { const next = {...prev}; delete next[todoKey]; return next; });
                    console.error('Save failed', e);
                  }
                };

                return (
                  <div key={i} style={{
                    borderLeft: `3px solid ${overdue ? '#E24B4A' : '#378ADD'}`,
                    background: overdue ? '#FFF0F0' : '#F0F6FF',
                    borderRadius: 8, padding: '8px 10px', marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79' }}>
                          {locationRef.slice(0, 45)}
                        </div>
                        <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>{noteText}</div>
                        {actionText && <div style={{ fontSize: 10, color: '#EF9F27', marginTop: 2 }}>⚡ {actionText}</div>}
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: overdue ? '#E24B4A' : '#378ADD' }}>
                          {overdue ? '🔴' : '📅'} {formatDueDate(dueDate)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                      <button onClick={() => handleAction('COMPLETED')} style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 10, border: 'none',
                        background: '#E8F5E9', color: '#4CAF7D', cursor: 'pointer', fontWeight: 600,
                      }}>✅ Done</button>
                      <button onClick={() => handleAction('PARKED')} style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 10, border: 'none',
                        background: '#F3E5F5', color: '#9C27B0', cursor: 'pointer', fontWeight: 600,
                      }}>🅿️ Park</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RSA HEALTH GRID */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>🗺️ RSA Health</span>
            <span style={{ fontSize: 11, color: '#888' }}>{RSA_LIST.length} RSAs</span>
          </div>
          <div>
            {RSA_LIST.map(rsa => {
              const rows1 = dsb2023.filter(r => (r.sales_area || '').trim() === rsa);
              const rows2 = [...dsb2018.filter(r => (r.sales_area || '').trim() === rsa), ...loi.filter(r => (r.retail_sales_area || '').trim() === rsa)];
              return <RSAHealthRow key={rsa} rsa={rsa} rows1={rows1} rows2={rows2} />;
            })}
          </div>
        </div>

      </div>

      {/* MAIN GRID — Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>

        {/* M1 PIPELINE */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>📊 M1 Pipeline</span>
            {selectedStage && <span onClick={() => setSelectedStage(null)} style={{ fontSize: 11, color: '#378ADD', cursor: 'pointer' }}>← Back</span>}
          </div>

          {!selectedStage ? (
            // Stage list view
            ['Draw of Lots', 'ISD & DOC Pending', 'Group 3', 'ASC Pending', 'LEC Pending', 'FVC Pending', 'LOI Issued'].map(s => {
              const count = allModule1.filter(r => r._normalisedStatus === s).length;
              const max = Math.max(1, ...['Draw of Lots', 'ISD & DOC Pending', 'Group 3', 'ASC Pending', 'LEC Pending', 'FVC Pending', 'LOI Issued'].map(st => allModule1.filter(r => r._normalisedStatus === st).length));
              const color = s === 'LOI Issued' ? '#4CAF7D' : '#2E75B6';
              return (
                <div key={s} onClick={() => count > 0 && setSelectedStage(s)}
                  style={{ marginBottom: 7, cursor: count > 0 ? 'pointer' : 'default', padding: '4px 6px', borderRadius: 6, transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (count > 0) e.currentTarget.style.background = '#F0F4FA'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: '#555' }}>{s}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#1F4E79' }}>{count}</span>
                      {count > 0 && <span style={{ fontSize: 9, color: '#aaa' }}>▶</span>}
                    </div>
                  </div>
                  <div style={{ height: 3, background: '#EEF2F7', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })
          ) : (
            // Drill-down case list
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1F4E79', marginBottom: 8, padding: '4px 6px', background: '#F0F4FA', borderRadius: 6 }}>
                {selectedStage} — {allModule1.filter(r => r._normalisedStatus === selectedStage).length} cases
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {allModule1
                  .filter(r => r._normalisedStatus === selectedStage)
                  .map((row, i) => {
                    const alert = row._alert;
                    const loc = getLocation(row);
                    const district = row.district || '';
                    const rsa = row.sales_area || '';
                    const adv = row.adv_sr_no || row.advt_srno || '';
                    const advKey = adv.trim().toUpperCase();
                    const lecData = lecByAdvSrNo ? lecByAdvSrNo.get(advKey) : null;
                    const fvcData = fvcByAdvSrNo ? fvcByAdvSrNo.get(advKey) : null;
                    const enrichData = selectedStage === 'FVC Pending' ? fvcData : lecData;
                    const pendency = enrichData ? parseInt(enrichData.pendency_of_days || enrichData.pendency || '0') : null;
                    const lastDate = enrichData ? (enrichData.lec_last_date || enrichData.lec_letter_last_date || enrichData.fvc_last_date || '') : null;
                    const letterSent = enrichData ? (enrichData.lec_letter_sent_on || enrichData.fvc_letter_sent_on || enrichData.letter_send || '') : null;
                    const fileReceived = enrichData ? (enrichData.lec_file_received_in_office_yesno || enrichData.file_received || '') : null;
                    const m1 = enrichData ? (enrichData.m1 || enrichData['m1'] || '') : null;
                    const m2 = enrichData ? (enrichData.m2 || enrichData['m2'] || '') : null;
                    const m3 = enrichData ? (enrichData.m3 || enrichData['m3'] || '') : null;
                    const enrichRemarks = enrichData ? (enrichData.remarks || '') : null;
                    return (
                      <div key={i} style={{
                        borderLeft: `3px solid ${alertColor(alert?.level || 'grey')}`,
                        background: alertBg(alert?.level || 'grey'),
                        borderRadius: 6, padding: '7px 9px', marginBottom: 5,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79' }}>
                          {loc.length > 55 ? loc.slice(0, 55) + '…' : loc}
                        </div>
                        <div style={{ fontSize: 10, color: '#888', marginTop: 2, display: 'flex', gap: 8 }}>
                          {district && <span>{district}</span>}
                          {rsa && <span>{rsa}</span>}
                          {adv && <span>#{adv}</span>}
                        </div>
                        {alert?.action && alert.action !== selectedStage && (
                          <div style={{ fontSize: 10, color: alertColor(alert.level), marginTop: 2 }}>
                            {alert.action}
                          </div>
                        )}

                        {/* LEC/FVC enriched data */}
                        {enrichData && (selectedStage === 'LEC Pending' || selectedStage === 'FVC Pending') && (
                          <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid #eee' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                              {letterSent && (
                                <div style={{ fontSize: 10, color: '#666' }}>
                                  📬 Letter: <span style={{ color: '#333' }}>{letterSent}</span>
                                </div>
                              )}
                              {lastDate && (
                                <div style={{ fontSize: 10, color: '#666' }}>
                                  📅 Last date: <span style={{ color: pendency < 0 ? '#E24B4A' : '#333', fontWeight: pendency < 0 ? 700 : 400 }}>{lastDate}</span>
                                </div>
                              )}
                              {pendency !== null && (
                                <div style={{ fontSize: 10, fontWeight: 700, color: pendency < 0 ? '#E24B4A' : '#4CAF7D' }}>
                                  {pendency < 0 ? `🔴 ${Math.abs(pendency)} days overdue` : `🟢 ${pendency} days remaining`}
                                </div>
                              )}
                              {fileReceived && (
                                <div style={{ fontSize: 10, color: '#666' }}>
                                  📁 File: <span style={{ color: fileReceived.toUpperCase().includes('YES') ? '#4CAF7D' : '#E24B4A' }}>{fileReceived}</span>
                                </div>
                              )}
                            </div>
                            {(m1 || m2 || m3) && (
                              <div style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 9, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Committee</div>
                                {m1 && <div style={{ fontSize: 10, color: '#555' }}>M1: {m1}</div>}
                                {m2 && <div style={{ fontSize: 10, color: '#555' }}>M2: {m2}</div>}
                                {m3 && m3 !== 'NA' && <div style={{ fontSize: 10, color: '#555' }}>M3: {m3}</div>}
                              </div>
                            )}
                            {enrichRemarks && enrichRemarks.trim() && (
                              <div style={{ fontSize: 10, color: '#888', marginTop: 3, fontStyle: 'italic' }}>
                                📝 {enrichRemarks.slice(0, 100)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* MAY-JUNE WATCHLIST */}
        <CommissioningWatchlist loi={loi} />

        {/* SEARCH */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10 }}>🔍 Quick Lookup</div>
          <SearchPanel allRows={allRows} writeback={writeback} />
        </div>

      </div>

      {/* MAIN GRID — Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>

        {/* COURT CASES */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>⚖️ Court Cases</span>
            <span style={{ fontSize: 11, background: '#FFF0F0', color: '#E24B4A', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{courtCases.length} frozen</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {courtCases.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4CAF7D', padding: 16, fontSize: 12 }}>✅ No court cases</div>
            ) : courtCases.map((row, i) => (
              <div key={i} style={{ borderLeft: '3px solid #E24B4A', background: '#FFF0F0', borderRadius: 8, padding: '7px 10px', marginBottom: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79' }}>{getLocation(row).slice(0, 55)}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                  {row.district || row.district_name} · {row.sales_area || row.retail_sales_area} · {row._source}
                </div>
                <div style={{ fontSize: 10, color: '#E24B4A', marginTop: 2 }}>
                  {row.remarks_court_case || row.complaint_court_case || row['remarks_court_case'] || 'Legal hold — check status'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NEGLECTED CASES */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>😴 Neglected Cases</span>
            <span style={{ fontSize: 11, background: '#FFFBF0', color: '#EF9F27', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{neglectedCases.length} cases</span>
          </div>
          <div style={{ fontSize: 10, color: '#999', marginBottom: 8 }}>LOI &gt; 1 year · No DM NOC · Review every 15 days</div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {neglectedCases.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4CAF7D', padding: 16, fontSize: 12 }}>✅ No neglected cases</div>
            ) : neglectedCases.map((row, i) => (
              <div key={i} style={{ borderLeft: '3px solid #EF9F27', background: '#FFFBF0', borderRadius: 8, padding: '7px 10px', marginBottom: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79' }}>{getLocation(row).slice(0, 55)}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                  {row.district || row.district_name} · {row.retail_sales_area}
                </div>
                <div style={{ fontSize: 10, color: '#EF9F27', marginTop: 2 }}>{row._alert?.action}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                  Letters: {row.letter_send_total || '0'} · {row.target_month_of_commissioning || 'No target'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CANCELLATION WATCHLIST */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E8ECF0' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1F4E79', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>❌ Cancellation Watchlist</span>
            <span style={{ fontSize: 11, background: '#F5F5F5', color: '#888', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{cancellationCases.length} cases</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {cancellationCases.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 16, fontSize: 12 }}>No non-commissionable cases</div>
            ) : cancellationCases.map((row, i) => {
              const letters = parseInt(row.letter_send_total || '0') || 0;
              const momDate = row.mom_date || '';
              const action = row._alert?.action || getCancellationAction(row);
              const isCritical = action.includes('seek FO');
              const isMom = action.includes('MOM now') || action.includes('MOM done');
              return (
                <div key={i} style={{
                  borderLeft: `3px solid ${isCritical ? '#E24B4A' : isMom ? '#EF9F27' : '#999'}`,
                  background: isCritical ? '#FFF0F0' : isMom ? '#FFFBF0' : '#F8F8F8',
                  borderRadius: 8, padding: '7px 10px', marginBottom: 5,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1F4E79' }}>{getLocation(row).slice(0, 55)}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                    {row.district_name} · {row.retail_sales_area}
                  </div>
                  <div style={{ fontSize: 10, color: isCritical ? '#E24B4A' : isMom ? '#EF9F27' : '#666', marginTop: 2, fontWeight: 500 }}>
                    ⚡ {action}
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                    Letters: {letters} {momDate ? `· MOM: ${momDate.split('/')[0]}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
