import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { usePagedList } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import { Pagination, SearchBox } from '../components/Paging.jsx';
import AppointmentTable from '../components/AppointmentTable.jsx';

const FILTERS = ['All', 'Pending', 'Completed', 'Cancelled'];

export default function AppointmentList() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { state, page, setPage, q, setQ } = usePagedList('/appointments', {
    status: filter === 'All' ? '' : filter,
    from,
    to,
  });

  return (
    <>
      <PageHeader title={user.role === 'patient' ? 'My appointments' : 'Appointments'}>
        {user.role !== 'doctor' && (
          <Link to="/appointments/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1" /> Book appointment
          </Link>
        )}
      </PageHeader>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
        <ul className="nav nav-pills">
          {FILTERS.map((f) => (
            <li className="nav-item" key={f}>
              <button className={`nav-link ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            </li>
          ))}
        </ul>
        <SearchBox value={q} onChange={setQ} placeholder="Search name or reason…" />
        <div className="d-flex align-items-center gap-2">
          <input type="date" className="form-control form-control-sm" aria-label="From date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-muted">to</span>
          <input type="date" className="form-control form-control-sm" aria-label="To date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card shadow-sm">
        <Async state={state}>
          {(data) => (
            <>
              <AppointmentTable appointments={data.items} />
              <Pagination data={data} onPage={setPage} />
            </>
          )}
        </Async>
      </div>
    </>
  );
}
