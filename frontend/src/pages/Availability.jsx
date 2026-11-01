import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import AvailabilityEditor from '../components/AvailabilityEditor.jsx';

/** Doctors reach this at /availability (their own); admins at /doctors/:id/availability. */
export default function Availability() {
  const { id } = useParams();
  const { user } = useAuth();
  const own = useApi(user.role === 'doctor' ? '/me/profile' : null);
  const doctor = useApi(user.role === 'admin' ? `/doctors/${id}` : null);

  return (
    <>
      <PageHeader title="Working hours">
        {user.role === 'admin' && <Link to={`/doctors/${id}`} className="btn btn-outline-secondary">Back</Link>}
      </PageHeader>
      <p className="text-muted">
        Patients can book any free slot inside these hours. Existing appointments are never affected by changes.
      </p>
      <Async state={user.role === 'doctor' ? own : doctor}>
        {(d) => <AvailabilityEditor doctorId={d.id} />}
      </Async>
    </>
  );
}
