import { useState } from 'react';

export function Spinner() {
  return (
    <div className="text-center py-5" role="status" aria-label="Loading">
      <div className="spinner-border text-primary" />
    </div>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="alert alert-danger">{error.message || 'Something went wrong'}</div>;
}

/** Loading / error / content gate for a useApi result. */
export function Async({ state, children }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error) return <ErrorBox error={state.error} />;
  return children(state.data);
}

export function PageHeader({ title, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <h1 className="h3 mb-0">{title}</h1>
      <div className="d-flex gap-2">{children}</div>
    </div>
  );
}

const STATUS_STYLE = { Pending: 'warning', Completed: 'success', Cancelled: 'secondary' };
export const StatusBadge = ({ status }) => (
  <span className={`badge text-bg-${STATUS_STYLE[status] || 'light'}`}>{status}</span>
);

export function Avatar({ person, size = 40 }) {
  const initials = (person.full_name || person.username || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.4 };
  return person.photo_url ? (
    <img src={person.photo_url} alt="" className="rounded-circle object-fit-cover" style={style} />
  ) : (
    <span
      className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fw-semibold"
      style={style}
    >
      {initials}
    </span>
  );
}

/** Labelled form control with inline server-side validation message. */
export function Field({ label, error, children, hint }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-medium">{label}</label>
      {children}
      {hint && <div className="form-text">{hint}</div>}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

export function TextField({ label, name, values, onChange, errors, type = 'text', ...rest }) {
  return (
    <Field label={label} error={errors?.[name]}>
      <input
        className={`form-control ${errors?.[name] ? 'is-invalid' : ''}`}
        type={type}
        name={name}
        value={values[name] ?? ''}
        onChange={onChange}
        {...rest}
      />
    </Field>
  );
}

export function SelectField({ label, name, values, onChange, errors, options, placeholder }) {
  return (
    <Field label={label} error={errors?.[name]}>
      <select
        className={`form-select ${errors?.[name] ? 'is-invalid' : ''}`}
        name={name}
        value={values[name] ?? ''}
        onChange={onChange}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function PhotoField({ onChange, errors, current }) {
  return (
    <Field label="Photo" error={errors?.photo} hint="JPEG, PNG or WebP, up to 2 MB">
      {current && <div className="mb-2"><Avatar person={{ photo_url: current }} size={64} /></div>}
      <input
        className="form-control"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files[0] || null)}
      />
    </Field>
  );
}

/** Button that asks for confirmation (in a modal-free, accessible way) before running. */
export function ConfirmButton({ children, onConfirm, message, className = 'btn btn-outline-danger btn-sm' }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(message)) return;
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </button>
  );
}

/** Form state + submit handler that maps API field errors onto inputs. */
export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const submit = (fn) => async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');
    try {
      await fn(values);
    } catch (err) {
      setErrors(err.details || {});
      setFormError(Object.keys(err.details || {}).length ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return { values, setValues, set, onChange, errors, formError, saving, submit };
}
