import { useEffect } from 'react';
import { fmtTime, useApi } from '../hooks.js';
import { Field } from './ui.jsx';

/** Grid of a doctor's free times for one date. Taken times are shown disabled. */
export default function SlotPicker({ doctorId, date, value, onChange, error, refreshKey = 0 }) {
  const path = doctorId && date ? `/doctors/${doctorId}/slots?date=${date}&r=${refreshKey}` : null;
  const { data, loading, error: loadError } = useApi(path);
  const slots = data?.slots ?? [];

  // Drop a selection that is no longer offered (doctor/date changed, or someone else took it).
  useEffect(() => {
    if (value && data && !slots.some((s) => s.time === value && s.available)) onChange('');
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  let body;
  if (!doctorId || !date) {
    body = <div className="text-muted small">Choose a doctor and a date to see available times.</div>;
  } else if (loading) {
    body = <div className="text-muted small">Loading times…</div>;
  } else if (loadError) {
    body = <div className="text-danger small">{loadError.message}</div>;
  } else if (slots.length === 0) {
    body = <div className="text-muted small">This doctor has no working hours on that day. Try another date.</div>;
  } else {
    body = (
      <div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label="Available times">
        {slots.map((s) => (
          <button
            key={s.time}
            type="button"
            role="radio"
            aria-checked={value === s.time}
            disabled={!s.available}
            className={`btn btn-sm ${value === s.time ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChange(s.time)}
            title={s.available ? '' : 'Already booked'}
          >
            {fmtTime(s.time)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Field label="Time" error={error}>
      {body}
    </Field>
  );
}
