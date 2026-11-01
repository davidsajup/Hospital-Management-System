import { Avatar } from './ui.jsx';
import { fmtDate } from '../hooks.js';

function Row({ label, children }) {
  return (
    <div className="row py-2 border-bottom">
      <div className="col-sm-4 text-muted">{label}</div>
      <div className="col-sm-8 pre-wrap">{children || '—'}</div>
    </div>
  );
}

export function DoctorCard({ doctor }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center gap-3 mb-3">
          <Avatar person={doctor} size={72} />
          <div>
            <h2 className="h5 mb-0">Dr. {doctor.full_name}</h2>
            <span className="text-muted">{doctor.department}</span>
          </div>
        </div>
        <Row label="Username">{doctor.username}</Row>
        <Row label="Email">{doctor.email}</Row>
        <Row label="Phone">{doctor.phone}</Row>
        <Row label="Education">{doctor.education}</Row>
      </div>
    </div>
  );
}

export function PatientCard({ patient }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center gap-3 mb-3">
          <Avatar person={patient} size={72} />
          <div>
            <h2 className="h5 mb-0">{patient.full_name}</h2>
            <span className="text-muted">{patient.age} years · <span className="text-capitalize">{patient.gender}</span></span>
          </div>
        </div>
        <Row label="Username">{patient.username}</Row>
        <Row label="Email">{patient.email}</Row>
        <Row label="Phone">{patient.phone}</Row>
        <Row label="Date of birth">{fmtDate(patient.date_of_birth)}</Row>
        <Row label="Blood group">{patient.blood_group}</Row>
      </div>
    </div>
  );
}
