import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, toFormData } from '../api.js';
import { AccountFields, PatientFields } from '../components/ProfileFields.jsx';
import { useFormState } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [photo, setPhoto] = useState(null);
  const form = useFormState({
    username: '', password: '', first_name: '', last_name: '', email: '',
    gender: 'male', date_of_birth: '', phone: '', blood_group: '',
  });

  const onSubmit = form.submit(async (values) => {
    await api('/auth/register', { method: 'POST', body: toFormData({ ...values, photo }) });
    toast('Registration successful. Please sign in.');
    navigate('/login');
  });

  return (
    <div className="auth-wrap">
      <form className="card shadow-sm w-100" style={{ maxWidth: 640 }} onSubmit={onSubmit}>
        <div className="card-body p-4">
          <h1 className="h4 mb-3">Patient registration</h1>
          {form.formError && <div className="alert alert-danger">{form.formError}</div>}
          <AccountFields {...form} withAccount />
          <PatientFields {...form} onPhoto={setPhoto} />
          <button className="btn btn-primary w-100" disabled={form.saving}>
            {form.saving ? 'Creating…' : 'Create account'}
          </button>
          <p className="text-center mt-3 mb-0">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
