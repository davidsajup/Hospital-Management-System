import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, Field, PageHeader, SelectField, TextField, useFormState } from '../components/ui.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import { useToast } from '../toast.jsx';

const STATUSES = ['Pending', 'Completed', 'Cancelled'].map((s) => ({ value: s, label: s }));
const todayStr = () => new Date().toLocaleDateString('en-CA');

function Form({ existing, doctors, patients }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [slotsKey, setSlotsKey] = useState(0);
  const isAdmin = user.role === 'admin';
  const isDoctor = user.role === 'doctor';
  const editing = Boolean(existing);

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
    try {
      if (editing) {
        await api(`/appointments/${existing.id}`, { method: 'PUT', body });
        toast('Appointment updated');
        navigate(`/appointments/${existing.id}`);
      } else {
        await api('/appointments', { method: 'POST', body });
        toast('Appointment booked');
        navigate('/appointments');
      }
    } catch (err) {
      if (err.status === 409) setSlotsKey((k) => k + 1); // someone took the slot: refetch the grid
      throw err;
    }
  });

  const p = { values: form.values, onChange: form.onChange, errors: form.errors };
  const doctorOptions = doctors.map((d) => ({ value: d.id, label: `Dr. ${d.full_name} — ${d.department}` }));
  const patientOptions = patients.map((x) => ({ value: x.id, label: x.full_name }));

  return (
    <form className="card shadow-sm" style={{ maxWidth: 680 }} onSubmit={onSubmit}>
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
            <TextField label="Date" name="date" type="date" min={editing ? undefined : todayStr()} required {...p} />
            {editing ? (
              <TextField label="Time" name="time" type="time" {...p} />
            ) : (
              <SlotPicker
                doctorId={form.values.doctor_id}
                date={form.values.date}
                value={form.values.time}
                onChange={(t) => form.set('time', t)}
                error={form.errors.time}
                refreshKey={slotsKey}
              />
            )}
            <Field label="Reason" error={form.errors.reason}>
              <textarea className="form-control" name="reason" rows={3} value={form.values.reason} onChange={form.onChange} />
            </Field>
          </>
        )}

        {(isDoctor || (isAdmin && editing)) && (
          <>
            <SelectField label="Status" name="status" options={STATUSES} {...p} />
            <Field label="Notes / prescription" error={form.errors.notes}>
              <textarea className="form-control" name="notes" rows={6} value={form.values.notes} onChange={form.onChange} />
            </Field>
          </>
        )}

        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={form.saving || (!editing && !form.values.time)}>
            {form.saving ? 'Saving…' : editing ? 'Save changes' : 'Book appointment'}
          </button>
          <Link to={editing ? `/appointments/${existing.id}` : '/appointments'} className="btn btn-outline-secondary">
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
  const doctors = useApi(user.role === 'doctor' ? null : '/doctors?pageSize=100');
  const patients = useApi(user.role === 'admin' ? '/patients?pageSize=100' : null);

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
            doctors={doctors.data?.items || []}
            patients={patients.data?.items || []}
          />
        )}
      </Async>
    </>
  );
}
