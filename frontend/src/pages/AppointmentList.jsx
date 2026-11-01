import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import AppointmentTable from '../components/AppointmentTable.jsx';

const FILTERS = ['All', 'Pending', 'Completed', 'Cancelled'];

export default function AppointmentList() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const state = useApi(filter === 'All' ? '/appointments' : `/appointments?status=${filter}`);

  return (
    <>
      <PageHeader title={user.role === 'patient' ? 'My appointments' : 'Appointments'}>
        {user.role !== 'doctor' && (
          <Link to="/appointments/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1" /> Book appointment
          </Link>
        )}
      </PageHeader>
      <ul className="nav nav-pills mb-3">
        {FILTERS.map((f) => (
          <li className="nav-item" key={f}>
            <button className={`nav-link ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          </li>
        ))}
      </ul>
      <div className="card shadow-sm">
        <Async state={state}>{(list) => <AppointmentTable appointments={list} />}</Async>
      </div>
    </>
  );
}
