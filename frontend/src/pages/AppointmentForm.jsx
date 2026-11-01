import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, Field, PageHeader, SelectField, TextField, useFormState } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

const STATUSES = ['Pending', 'Completed', 'Cancelled'].map((s) => ({ value: s, label: s }));
const todayStr = () => new Date().toLocaleDateString('en-CA');

function Form({ existing, doctors, patients }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const isAdmin = user.role === 'admin';
  const isDoctor = user.role === 'doctor';

  const form = useFormState({
    doctor_id: params.get('doctor') || '',
    patient_id: '',
    date: '',
    time: '',
    reason: '',
    status: 'Pending',
    notes: '',
  });

  useEffect(() => {
    if (existing) form.setValues({ ...existing, time: existing.time || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const onSubmit = form.submit(async (v) => {
    const body = isDoctor
      ? { status: v.status, notes: v.notes }
      : { ...v, doctor_id: Number(v.doctor_id), patient_id: v.patient_id ? Number(v.patient_id) : undefined, time: v.time || null };
    if (existing) {
      await api(`/appointments/${existing.id}`, { method: 'PUT', body });
      toast('Appointment updated');
      navigate(`/appointments/${existing.id}`);
    } else {
      await api('/appointments', { method: 'POST', body });
      toast('Appointment booked');
      navigate('/appointments');
    }
  });

  const p = { values: form.values, onChange: form.onChange, errors: form.errors };
  const doctorOptions = doctors.map((d) => ({ value: d.id, label: `Dr. ${d.full_name} — ${d.department}` }));
  const patientOptions = patients.map((x) => ({ value: x.id, label: x.full_name }));

  return (
    <form className="card shadow-sm" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
      <div className="card-body p-4">
        {form.formError && <div className="alert alert-danger">{form.formError}</div>}

        {isDoctor ? (
          <p className="text-muted">
            {existing.patient_name} on {existing.date}
          </p>
        ) : (
          <>
            {isAdmin && (
              <SelectField label="Patient" name="patient_id" placeholder="Select patient…" options={patientOptions} {...p} />
            )}
            <SelectField label="Doctor" name="doctor_id" placeholder="Select doctor…" options={doctorOptions} {...p} />
            <div className="row">
              <div className="col-md-6">
                <TextField label="Date" name="date" type="date" min={existing ? undefined : todayStr()} required {...p} />
              </div>
              <div className="col-md-6"><TextField label="Time" name="time" type="time" {...p} /></div>
            </div>
            <Field label="Reason" error={form.errors.reason}>
              <textarea className="form-control" name="reason" rows={3} value={form.values.reason} onChange={form.onChange} />
            </Field>
          </>
        )}

        {(isDoctor || (isAdmin && existing)) && (
          <>
            <SelectField label="Status" name="status" options={STATUSES} {...p} />
            <Field label="Notes / prescription" error={form.errors.notes}>
              <textarea className="form-control" name="notes" rows={6} value={form.values.notes} onChange={form.onChange} />
            </Field>
          </>
        )}

        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={form.saving}>
            {form.saving ? 'Saving…' : existing ? 'Save changes' : 'Book appointment'}
          </button>
          <Link to={existing ? `/appointments/${existing.id}` : '/appointments'} className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}

/** Loads the lookup data the form needs, then renders it. */
export default function AppointmentForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const existing = useApi(id ? `/appointments/${id}` : null);
  const doctors = useApi(user.role === 'doctor' ? null : '/doctors');
  const patients = useApi(user.role === 'admin' ? '/patients' : null);

  const waiting =
    (id && existing.loading) ||
    (user.role !== 'doctor' && doctors.loading) ||
    (user.role === 'admin' && patients.loading);
  const error = existing.error || doctors.error || patients.error;

  return (
    <>
      <PageHeader title={id ? 'Edit appointment' : 'Book appointment'} />
      <Async state={{ loading: waiting, error, data: waiting ? null : true }}>
        {() => (
          <Form
            existing={existing.data}
            doctors={doctors.data || []}
            patients={patients.data || []}
          />
        )}
      </Async>
    </>
  );
}
