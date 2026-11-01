import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, toFormData } from '../api.js';
import { useApi } from '../hooks.js';
import { AccountFields, DoctorFields } from '../components/ProfileFields.jsx';
import { Async, PageHeader, useFormState } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

const EMPTY = {
  username: '', password: '', first_name: '', last_name: '', email: '',
  department: '', phone: '', education: 'MBBS',
};

function Form({ id, doctor }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [photo, setPhoto] = useState(null);
  const form = useFormState(EMPTY);
  const editing = Boolean(id);

  useEffect(() => {
    if (doctor) form.setValues({ ...EMPTY, ...doctor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor]);

  const onSubmit = form.submit(async (values) => {
    const body = toFormData({ ...values, photo });
    await api(editing ? `/doctors/${id}` : '/doctors', { method: editing ? 'PUT' : 'POST', body });
    toast(editing ? 'Doctor updated' : 'Doctor added');
    navigate('/doctors');
  });

  return (
    <form className="card shadow-sm" style={{ maxWidth: 680 }} onSubmit={onSubmit}>
      <div className="card-body p-4">
        {form.formError && <div className="alert alert-danger">{form.formError}</div>}
        <AccountFields {...form} withAccount={!editing} />
        <DoctorFields {...form} onPhoto={setPhoto} currentPhoto={doctor?.photo_url} />
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={form.saving}>{form.saving ? 'Saving…' : 'Save'}</button>
          <Link to="/doctors" className="btn btn-outline-secondary">Cancel</Link>
        </div>
      </div>
    </form>
  );
}

export default function DoctorForm() {
  const { id } = useParams();
  const state = useApi(id ? `/doctors/${id}` : null);
  return (
    <>
      <PageHeader title={id ? 'Edit doctor' : 'Add doctor'} />
      {id ? <Async state={state}>{(doctor) => <Form id={id} doctor={doctor} />}</Async> : <Form />}
    </>
  );
}
