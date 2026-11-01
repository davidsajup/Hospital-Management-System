import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import { DoctorCard } from '../components/ProfileCards.jsx';

export default function DoctorDetail() {
  const { id } = useParams();
  const state = useApi(`/doctors/${id}`);
  return (
    <>
      <PageHeader title="Doctor">
        <Link to="/doctors" className="btn btn-outline-secondary">Back</Link>
        <Link to={`/doctors/${id}/edit`} className="btn btn-primary">Edit</Link>
      </PageHeader>
      <Async state={state}>{(doctor) => <DoctorCard doctor={doctor} />}</Async>
    </>
  );
}
