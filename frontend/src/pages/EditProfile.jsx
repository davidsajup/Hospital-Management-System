import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, toFormData } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { AccountFields, DoctorFields, PatientFields } from '../components/ProfileFields.jsx';
import { Async, PageHeader, useFormState } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

function Form({ profile }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [photo, setPhoto] = useState(null);
  const form = useFormState(profile);

  useEffect(() => form.setValues(profile), [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = form.submit(async (values) => {
    await api('/me/profile', { method: 'PUT', body: toFormData({ ...values, photo }) });
    toast('Profile updated');
    // Name changes show in the sidebar after the next page load.
    navigate('/profile');
  });

  const Fields = user.role === 'doctor' ? DoctorFields : PatientFields;
  return (
    <form className="card shadow-sm" style={{ maxWidth: 680 }} onSubmit={onSubmit}>
      <div className="card-body p-4">
        {form.formError && <div className="alert alert-danger">{form.formError}</div>}
        <AccountFields {...form} />
        <Fields {...form} onPhoto={setPhoto} currentPhoto={profile.photo_url} />
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={form.saving}>{form.saving ? 'Saving…' : 'Save'}</button>
          <Link to="/profile" className="btn btn-outline-secondary">Cancel</Link>
        </div>
      </div>
    </form>
  );
}

export default function EditProfile() {
  const state = useApi('/me/profile');
  return (
    <>
      <PageHeader title="Edit profile" />
      <Async state={state}>{(profile) => <Form profile={profile} />}</Async>
    </>
  );
}
