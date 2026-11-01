import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApi } from '../hooks.js';
import { Async } from './ui.jsx';
import { useToast } from '../toast.jsx';

// Monday first, Sunday last. Values match the API (0 = Sunday).
const DAYS = [
  [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday'],
];
const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

function Editor({ doctorId, initial }) {
  const toast = useToast();
  const [rules, setRules] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setRules(initial), [initial]);

  const change = (index, patch) => setRules((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const add = (weekday) =>
    setRules((rs) => [...rs, { weekday, start_time: '09:00', end_time: '17:00', slot_minutes: 30 }]);
  const remove = (index) => setRules((rs) => rs.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const d = await api(`/doctors/${doctorId}/availability`, { method: 'PUT', body: { rules } });
      setRules(d.rules);
      toast('Working hours saved');
    } catch (e) {
      setError(e.details?.rules || Object.values(e.details || {})[0] || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card shadow-sm mb-3">
        <ul className="list-group list-group-flush">
          {DAYS.map(([weekday, name]) => {
            const blocks = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === weekday);
            return (
              <li key={weekday} className="list-group-item">
                <div className="row align-items-start g-2">
                  <div className="col-md-2 fw-medium pt-1">{name}</div>
                  <div className="col-md-10">
                    {blocks.length === 0 && <span className="text-muted small">Not working</span>}
                    {blocks.map(({ r, i }) => (
                      <div key={i} className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <input type="time" className="form-control form-control-sm w-auto" aria-label={`${name} start`} value={r.start_time} onChange={(e) => change(i, { start_time: e.target.value })} />
                        <span>to</span>
                        <input type="time" className="form-control form-control-sm w-auto" aria-label={`${name} end`} value={r.end_time} onChange={(e) => change(i, { end_time: e.target.value })} />
                        <select className="form-select form-select-sm w-auto" aria-label={`${name} slot length`} value={r.slot_minutes} onChange={(e) => change(i, { slot_minutes: Number(e.target.value) })}>
                          {SLOT_OPTIONS.map((m) => <option key={m} value={m}>{m} min slots</option>)}
                        </select>
                        <button type="button" className="btn btn-sm btn-outline-danger" aria-label={`Remove ${name} hours`} onClick={() => remove(i)}>
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-link p-0" onClick={() => add(weekday)}>
                      <i className="bi bi-plus" /> Add hours
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save working hours'}
      </button>
    </>
  );
}

export default function AvailabilityEditor({ doctorId }) {
  const state = useApi(`/doctors/${doctorId}/availability`);
  return <Async state={state}>{(d) => <Editor doctorId={doctorId} initial={d.rules} />}</Async>;
}
