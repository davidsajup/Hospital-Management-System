import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, toFormData } from '../api.js';
import { useApi } from '../hooks.js';
import { AccountFields, PatientFields } from '../components/ProfileFields.jsx';
import { Async, PageHeader, useFormState } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

const EMPTY = {
  username: '', password: '', first_name: '', last_name: '', email: '',
  gender: 'male', date_of_birth: '', phone: '', blood_group: '',
};

function Form({ id, patient }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [photo, setPhoto] = useState(null);
  const form = useFormState(EMPTY);
  const editing = Boolean(id);

  useEffect(() => {
    if (patient) form.setValues({ ...EMPTY, ...patient });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const onSubmit = form.submit(async (values) => {
    const body = toFormData({ ...values, photo });
    await api(editing ? `/patients/${id}` : '/patients', { method: editing ? 'PUT' : 'POST', body });
    toast(editing ? 'Patient updated' : 'Patient added');
    navigate('/patients');
  });

  return (
    <form className="card shadow-sm" style={{ maxWidth: 680 }} onSubmit={onSubmit}>
      <div className="card-body p-4">
        {form.formError && <div className="alert alert-danger">{form.formError}</div>}
        <AccountFields {...form} withAccount={!editing} />
        <PatientFields {...form} onPhoto={setPhoto} currentPhoto={patient?.photo_url} />
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={form.saving}>{form.saving ? 'Saving…' : 'Save'}</button>
          <Link to="/patients" className="btn btn-outline-secondary">Cancel</Link>
        </div>
      </div>
    </form>
  );
}

export default function PatientForm() {
  const { id } = useParams();
  const state = useApi(id ? `/patients/${id}` : null);
  return (
    <>
      <PageHeader title={id ? 'Edit patient' : 'Add patient'} />
      {id ? <Async state={state}>{(patient) => <Form id={id} patient={patient} />}</Async> : <Form />}
    </>
  );
}
