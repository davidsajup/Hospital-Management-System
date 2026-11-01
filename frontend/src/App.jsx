import { Route, Routes } from 'react-router-dom';
import Layout, { RoleRoute } from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DoctorList from './pages/DoctorList.jsx';
import DoctorForm from './pages/DoctorForm.jsx';
import DoctorDetail from './pages/DoctorDetail.jsx';
import PatientList from './pages/PatientList.jsx';
import PatientForm from './pages/PatientForm.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import AppointmentList from './pages/AppointmentList.jsx';
import AppointmentForm from './pages/AppointmentForm.jsx';
import AppointmentDetail from './pages/AppointmentDetail.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Availability from './pages/Availability.jsx';
import AuditLog from './pages/AuditLog.jsx';

const admin = (el) => <RoleRoute roles={['admin']}>{el}</RoleRoute>;
const only = (roles, el) => <RoleRoute roles={roles}>{el}</RoleRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />

        <Route path="doctors" element={only(['admin', 'patient'], <DoctorList />)} />
        <Route path="doctors/new" element={admin(<DoctorForm />)} />
        <Route path="doctors/:id" element={admin(<DoctorDetail />)} />
        <Route path="doctors/:id/edit" element={admin(<DoctorForm />)} />
        <Route path="doctors/:id/availability" element={admin(<Availability />)} />
        <Route path="availability" element={only(['doctor'], <Availability />)} />
        <Route path="audit" element={admin(<AuditLog />)} />

        <Route path="patients" element={admin(<PatientList />)} />
        <Route path="patients/new" element={admin(<PatientForm />)} />
        <Route path="patients/:id" element={only(['admin', 'doctor'], <PatientDetail />)} />
        <Route path="patients/:id/edit" element={admin(<PatientForm />)} />

        <Route path="appointments" element={<AppointmentList />} />
        <Route path="appointments/new" element={only(['admin', 'patient'], <AppointmentForm />)} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="appointments/:id/edit" element={only(['admin', 'doctor'], <AppointmentForm />)} />

        <Route path="profile" element={only(['doctor', 'patient'], <Profile />)} />
        <Route path="profile/edit" element={only(['doctor', 'patient'], <EditProfile />)} />

        <Route path="*" element={<div className="alert alert-warning">Page not found.</div>} />
      </Route>
    </Routes>
  );
}
