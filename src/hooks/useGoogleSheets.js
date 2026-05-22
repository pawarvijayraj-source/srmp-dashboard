import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { normaliseStatus } from '../config/columnMaps';
import { getModule1Alert, getModule2Alert } from '../logic/alertRules';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// ── Normalise Adv Sr No for matching ────────────────────────
function normaliseAdvSrNo(val) {
  if (!val || val === '') return null;
  return String(val).trim().replace(/\s+/g, '').toUpperCase();
}

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

      const [res23, res18, resLoi, resWb, resLec23, resLec18, resFvc23, resFvc18] = await Promise.all([
        axios.get(`${APPS_SCRIPT_URL}?action=dsb2023`),
        axios.get(`${APPS_SCRIPT_URL}?action=dsb2018`),
        axios.get(`${APPS_SCRIPT_URL}?action=loi`),
        axios.get(`${APPS_SCRIPT_URL}?action=writeback`),
        axios.get(`${APPS_SCRIPT_URL}?action=lec2023`),
        axios.get(`${APPS_SCRIPT_URL}?action=lec2018`),
        axios.get(`${APPS_SCRIPT_URL}?action=fvc2023`),
        axios.get(`${APPS_SCRIPT_URL}?action=fvc2018`),
      ]);

      // ── Step 0: Build LEC and FVC lookup maps ─────────────
      const lecRows = [
        ...(resLec23.data?.rows || []).map(r => ({ ...r, _lecSource: 'LEC_2023' })),
        ...(resLec18.data?.rows || []).map(r => ({ ...r, _lecSource: 'LEC_2018' })),
      ];

      const fvcRows = [
        ...(resFvc23.data?.rows || []).map(r => ({ ...r, _fvcSource: 'FVC_2023' })),
        ...(resFvc18.data?.rows || []).map(r => ({ ...r, _fvcSource: 'FVC_2018' })),
      ];

      // Build lookup by Adv Sr No
      const lecByAdvSrNo = new Map();
      lecRows.forEach(r => {
        const advKey = normaliseAdvSrNo(r.adv_sr_no || r.advertisement_sr_no || r.advt_sr_no || '');
        if (advKey) lecByAdvSrNo.set(advKey, r);
      });

      const fvcByAdvSrNo = new Map();
      fvcRows.forEach(r => {
        const advKey = normaliseAdvSrNo(r.adv_sr_no || r.advertisement_sr_no || r.advt_sr_no || '');
        if (advKey) fvcByAdvSrNo.set(advKey, r);
      });

      // ── Step 1: Process LOI Pending rows ──────────────────
      const rawLoi = (resLoi.data?.rows || []).filter(r => r.location);

      // Build LOI lookup map by Adv Sr No
      const loiByAdvSrNo = new Map();
      rawLoi.forEach(r => {
        const key = normaliseAdvSrNo(r.adv_sr_no_of_location);
        if (key) loiByAdvSrNo.set(key, r);
      });

      // Build LOI lookup map by location name (fallback)
      const loiByLocation = new Map();
      rawLoi.forEach(r => {
        const loc = (r.location || '').trim().toLowerCase();
        if (loc) loiByLocation.set(loc, r);
      });

      // Process LOI rows with alerts
      const loi = rawLoi.map(r => {
        r._source = 'LOI_PENDING';
        r._alert = getModule2Alert(r);
        return r;
      });

      // ── Step 2: Process DSB rows ───────────────────────────
      const processDSB = (rows, source) =>
        rows
          .filter(r => r.location_current_status || r.advt_srno || r.adv_sr_no)
          .map(r => {
            const normStatus = normaliseStatus(r.location_current_status || '');
            r._normalisedStatus = normStatus;
            r._source = source;

            // Check if this case exists in LOI Pending
            const advKey = normaliseAdvSrNo(r.adv_sr_no || r.advt_srno);
            const loiMatch = advKey ? loiByAdvSrNo.get(advKey) : null;

            if (loiMatch) {
              // Case has progressed to Module 2
              r._inLOIPending = true;
              r._loiRecord = loiMatch; // attach LOI data for cross-enrichment
              r._alert = {
                level: 'green',
                pendingOwner: null,
                action: 'Progressed to Module 2 — see LOI tracker',
                priority: 20,
              };
            } else {
              r._inLOIPending = false;
              r._alert = getModule1Alert(r, source);
            }

            return r;
          });

      const dsb2023 = processDSB(res23.data?.rows || [], 'DSB_2023');
      const dsb2018 = processDSB(res18.data?.rows || [], 'DSB_2018');

      // ── Step 3: Filter DSB for active M1 only ─────────────
      // Exclude cases that have progressed to LOI Pending (Module 2)
      const dsb2023Active = dsb2023.filter(r => !r._inLOIPending);
      const dsb2018Active = dsb2018.filter(r => !r._inLOIPending);

      const writeback = (resWb.data?.rows || []);

      setData({
        dsb2023: dsb2023Active,
        dsb2018: dsb2018Active,
        dsb2023All: dsb2023, // keep full list for reference
        dsb2018All: dsb2018,
        loi,
        loiByAdvSrNo,
        loiByLocation,
        lecByAdvSrNo,
        lecRows,
        fvcByAdvSrNo,
        fvcRows,
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
