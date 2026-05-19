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
