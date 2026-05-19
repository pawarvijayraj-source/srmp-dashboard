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
