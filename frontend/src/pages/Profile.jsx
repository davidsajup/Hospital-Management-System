import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import { DoctorCard, PatientCard } from '../components/ProfileCards.jsx';

export default function Profile() {
  const { user } = useAuth();
  const state = useApi('/me/profile');
  return (
    <>
      <PageHeader title="My profile">
        <Link to="/profile/edit" className="btn btn-primary">Edit profile</Link>
      </PageHeader>
      <Async state={state}>
        {(p) => (user.role === 'doctor' ? <DoctorCard doctor={p} /> : <PatientCard patient={p} />)}
      </Async>
    </>
  );
}
