import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { fmtDate, fmtTime } from '../hooks.js';
import { StatusBadge } from './ui.jsx';

export default function AppointmentTable({ appointments }) {
  const { user } = useAuth();
  if (!appointments.length) return <p className="text-muted p-4 mb-0">No appointments yet.</p>;

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {user.role !== 'patient' && <th>Patient</th>}
            {user.role !== 'doctor' && <th>Doctor</th>}
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              {user.role !== 'patient' && <td>{a.patient_name}</td>}
              {user.role !== 'doctor' && <td>Dr. {a.doctor_name}</td>}
              <td>{fmtDate(a.date)}</td>
              <td>{fmtTime(a.time)}</td>
              <td><StatusBadge status={a.status} /></td>
              <td className="text-end">
                <Link to={`/appointments/${a.id}`} className="btn btn-sm btn-outline-primary">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
