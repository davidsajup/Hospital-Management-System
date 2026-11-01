import { useState } from 'react';
import { usePagedList } from '../hooks.js';
import { Async, PageHeader } from '../components/ui.jsx';
import { EmptyState, Pagination, SearchBox } from '../components/Paging.jsx';

const ACTIONS = ['login', 'login_failed', 'register', 'view', 'create', 'update', 'delete'];
const ENTITIES = ['session', 'doctor', 'patient', 'appointment', 'availability'];
const ACTION_STYLE = {
  login: 'secondary', login_failed: 'danger', register: 'info', view: 'primary',
  create: 'success', update: 'warning', delete: 'danger',
};

export default function AuditLog() {
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const { state, setPage, q, setQ } = usePagedList('/audit', { action, entity }, 20);

  return (
    <>
      <PageHeader title="Audit log" />
      <p className="text-muted">Every sign-in, change, and staff access to patient records. Entries cannot be edited or deleted.</p>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search person or detail…" />
        <select className="form-select w-auto" aria-label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="form-select w-auto" aria-label="Entity" value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="">All records</option>
          {ENTITIES.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div className="card shadow-sm">
        <Async state={state}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState>No matching entries.</EmptyState>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Detail</th></tr>
                    </thead>
                    <tbody>
                      {data.items.map((e) => (
                        <tr key={e.id}>
                          <td className="text-nowrap">{new Date(e.at).toLocaleString()}</td>
                          <td>{e.actor_name} <span className="text-muted small">({e.actor_role})</span></td>
                          <td><span className={`badge text-bg-${ACTION_STYLE[e.action] || 'light'}`}>{e.action}</span></td>
                          <td>{e.entity}{e.entity_id ? ` #${e.entity_id}` : ''}</td>
                          <td className="text-muted">{e.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination data={data} onPage={setPage} />
              </>
            )
          }
        </Async>
      </div>
    </>
  );
}
