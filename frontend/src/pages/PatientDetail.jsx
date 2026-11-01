import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import { PatientCard } from '../components/ProfileCards.jsx';
import AppointmentTable from '../components/AppointmentTable.jsx';

export default function PatientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const state = useApi(`/patients/${id}`);
  const appts = useApi(`/appointments?patient_id=${id}&pageSize=50`);
  const isAdmin = user.role === 'admin';

  return (
    <>
      <PageHeader title="Patient">
        <Link to={isAdmin ? '/patients' : '/appointments'} className="btn btn-outline-secondary">Back</Link>
        {isAdmin && <Link to={`/patients/${id}/edit`} className="btn btn-primary">Edit</Link>}
      </PageHeader>
      <Async state={state}>{(patient) => <PatientCard patient={patient} />}</Async>
      <h2 className="h5 mt-4">Appointments</h2>
      <div className="card shadow-sm">
        <Async state={appts}>{(data) => <AppointmentTable appointments={data.items} />}</Async>
      </div>
    </>
  );
}
