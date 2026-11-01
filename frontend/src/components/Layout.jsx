import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Spinner } from './ui.jsx';

const NAV = {
  admin: [
    ['/', 'bi-speedometer2', 'Dashboard'],
    ['/doctors', 'bi-person-badge', 'Doctors'],
    ['/patients', 'bi-people', 'Patients'],
    ['/appointments', 'bi-calendar-check', 'Appointments'],
    ['/audit', 'bi-shield-check', 'Audit log'],
  ],
  doctor: [
    ['/', 'bi-speedometer2', 'Dashboard'],
    ['/appointments', 'bi-calendar-check', 'Appointments'],
    ['/availability', 'bi-clock', 'Working hours'],
    ['/profile', 'bi-person-circle', 'My profile'],
  ],
  patient: [
    ['/', 'bi-speedometer2', 'Dashboard'],
    ['/doctors', 'bi-person-badge', 'Doctors'],
    ['/appointments', 'bi-calendar-check', 'My appointments'],
    ['/profile', 'bi-person-circle', 'My profile'],
  ],
};

/** Wraps every signed-in page. Redirects to /login when there is no session. */
export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <i className="bi bi-hospital me-2" />
          HMS
        </div>
        <nav className="nav flex-column">
          {NAV[user.role].map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-link">
              <i className={`bi ${icon} me-2`} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="small text-white-50 mb-2">
            {user.full_name} · <span className="text-capitalize">{user.role}</span>
          </div>
          <button
            className="btn btn-sm btn-outline-light w-100"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <i className="bi bi-box-arrow-right me-1" /> Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

/** Route guard: renders children only for the listed roles. */
export function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) {
    return <div className="alert alert-warning">You do not have access to this page.</div>;
  }
  return children;
}
