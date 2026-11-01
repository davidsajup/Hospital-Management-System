import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { TextField, useFormState } from '../components/ui.jsx';

// Set VITE_DEMO=true and VITE_DEMO_PASSWORD at build time to show one-click demo logins.
const DEMO = import.meta.env.VITE_DEMO === 'true';
const DEMO_ACCOUNTS = [['Admin', 'demo.admin'], ['Doctor', 'dr.mehta'], ['Patient', 'demo.patient']];

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
          {DEMO && (
            <div className="border-top mt-4 pt-3">
              <div className="text-muted small mb-2">Try the demo as:</div>
              <div className="d-flex gap-2">
                {DEMO_ACCOUNTS.map(([label, username]) => (
                  <button
                    key={username}
                    type="button"
                    className="btn btn-outline-secondary btn-sm flex-fill"
                    disabled={form.saving}
                    onClick={form.submit(async () => {
                      await login(username, import.meta.env.VITE_DEMO_PASSWORD);
                      navigate('/');
                    })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
