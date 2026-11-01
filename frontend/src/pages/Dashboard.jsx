import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { fmtDate, fmtTime, useApi } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import AppointmentTable from '../components/AppointmentTable.jsx';

function Stat({ icon, color, label, value }) {
  return (
    <div className="col-sm-6 col-xl">
      <div className="card shadow-sm stat-card h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`icon bg-${color}-subtle text-${color}`}><i className={`bi ${icon}`} /></div>
          <div>
            <div className="fs-3 fw-semibold lh-1">{value}</div>
            <div className="text-muted small">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Upcoming({ items, role }) {
  if (!items.length) return <p className="text-muted small mb-0">Nothing scheduled.</p>;
  return (
    <ul className="list-unstyled mb-0">
      {items.map((a) => (
        <li key={a.id} className="mb-2">
          <Link to={`/appointments/${a.id}`} className="text-decoration-none">
            <div className="fw-medium">{fmtDate(a.date)} · {fmtTime(a.time)}</div>
            <div className="text-muted small">{role === 'patient' ? `Dr. ${a.doctor_name}` : a.patient_name}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const state = useApi('/me/dashboard');

  return (
    <>
      <PageHeader title={`Welcome, ${user.full_name}`}>
        {user.role === 'doctor' && (
          <Link to="/availability" className="btn btn-outline-primary">
            <i className="bi bi-clock me-1" /> Working hours
          </Link>
        )}
        {user.role !== 'doctor' && (
          <Link to="/appointments/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1" /> Book appointment
          </Link>
        )}
      </PageHeader>
      <Async state={state}>
        {({ counts, recent, upcoming }) => (
          <>
            <div className="row g-3 mb-4">
              {user.role === 'admin' && (
                <>
                  <Stat icon="bi-person-badge" color="primary" label="Doctors" value={counts.doctors} />
                  <Stat icon="bi-people" color="info" label="Patients" value={counts.patients} />
                </>
              )}
              <Stat icon="bi-calendar" color="secondary" label="Appointments" value={counts.total} />
              <Stat icon="bi-hourglass-split" color="warning" label="Pending" value={counts.pending} />
              <Stat icon="bi-check2-circle" color="success" label="Completed" value={counts.completed} />
            </div>
            <div className="row g-3">
              <div className="col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-white"><strong>Coming up</strong></div>
                  <div className="card-body"><Upcoming items={upcoming} role={user.role} /></div>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="card shadow-sm h-100">
                  <div className="card-header bg-white d-flex justify-content-between">
                    <strong>Latest appointments</strong>
                    <Link to="/appointments">View all</Link>
                  </div>
                  <AppointmentTable appointments={recent} />
                </div>
              </div>
            </div>
          </>
        )}
      </Async>
    </>
  );
}
