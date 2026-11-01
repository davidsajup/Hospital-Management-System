import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { TextField, useFormState } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const form = useFormState({ username: '', password: '' });

  if (user) return <Navigate to="/" replace />;

  const fieldProps = { values: form.values, onChange: form.onChange, errors: form.errors };

  const onSubmit = form.submit(async ({ username, password }) => {
    await login(username, password);
    navigate('/');
  });

  return (
    <div className="auth-wrap">
      <form className="card shadow-sm w-100" style={{ maxWidth: 420 }} onSubmit={onSubmit}>
        <div className="card-body p-4">
          <h1 className="h4 mb-1"><i className="bi bi-hospital me-2" />Hospital Management</h1>
          <p className="text-muted">Sign in to continue</p>
          {form.formError && <div className="alert alert-danger">{form.formError}</div>}
          <TextField label="Username" name="username" autoComplete="username" autoFocus required {...fieldProps} />
          <TextField label="Password" name="password" type="password" autoComplete="current-password" required {...fieldProps} />
          <button className="btn btn-primary w-100" disabled={form.saving}>
            {form.saving ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center mt-3 mb-0">
            New patient? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
