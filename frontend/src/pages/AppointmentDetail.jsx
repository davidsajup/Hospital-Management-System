import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmtDate, fmtTime, useApi } from '../hooks.js';
import { Async, ConfirmButton, PageHeader, StatusBadge } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

function Row({ label, children }) {
  return (
    <div className="row py-2 border-bottom">
      <div className="col-sm-3 text-muted">{label}</div>
      <div className="col-sm-9 pre-wrap">{children || '—'}</div>
    </div>
  );
}

export default function AppointmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const state = useApi(`/appointments/${id}`);

  const act = async (fn, message) => {
    try {
      await fn();
      toast(message);
    } catch (e) {
      toast(e.message, 'danger');
    }
  };

  const cancel = () =>
    act(async () => {
      await api(`/appointments/${id}`, { method: 'PUT', body: { status: 'Cancelled' } });
      await state.reload();
    }, 'Appointment cancelled');

  const remove = () =>
    act(async () => {
      await api(`/appointments/${id}`, { method: 'DELETE' });
      navigate('/appointments');
    }, 'Appointment deleted');

  return (
    <>
      <PageHeader title="Appointment">
        <Link to="/appointments" className="btn btn-outline-secondary">Back</Link>
        {(user.role === 'admin' || user.role === 'doctor') && (
          <Link to={`/appointments/${id}/edit`} className="btn btn-primary">
            {user.role === 'doctor' ? 'Update status / notes' : 'Edit'}
          </Link>
        )}
      </PageHeader>
      <Async state={state}>
        {(a) => (
          <div className="card shadow-sm">
            <div className="card-body">
              <Row label="Patient">
                {user.role === 'patient' ? a.patient_name : <Link to={`/patients/${a.patient_id}`}>{a.patient_name}</Link>}
              </Row>
              <Row label="Doctor">Dr. {a.doctor_name} <span className="text-muted">({a.doctor_department})</span></Row>
              <Row label="Date">{fmtDate(a.date)}</Row>
              <Row label="Time">{fmtTime(a.time)}</Row>
              <Row label="Status"><StatusBadge status={a.status} /></Row>
              <Row label="Reason">{a.reason}</Row>
              <Row label="Doctor's notes">{a.notes}</Row>

              <div className="d-flex gap-2 mt-3">
                {user.role === 'patient' && a.status === 'Pending' && (
                  <ConfirmButton message="Cancel this appointment?" onConfirm={cancel}>
                    Cancel appointment
                  </ConfirmButton>
                )}
                {user.role === 'admin' && (
                  <ConfirmButton message="Permanently delete this appointment?" onConfirm={remove}>
                    Delete
                  </ConfirmButton>
                )}
              </div>
            </div>
          </div>
        )}
      </Async>
    </>
  );
}
