import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { usePagedList } from '../hooks.js';
import { Async, Avatar, ConfirmButton, PageHeader } from '../components/ui.jsx';
import { EmptyState, Pagination, SearchBox } from '../components/Paging.jsx';
import { useToast } from '../toast.jsx';

export default function PatientList() {
  const toast = useToast();
  const { state, page, setPage, q, setQ } = usePagedList('/patients');

  const remove = async (p) => {
    try {
      await api(`/patients/${p.id}`, { method: 'DELETE' });
      toast('Patient deleted');
      state.reload();
    } catch (e) {
      toast(e.message, 'danger');
    }
  };

  return (
    <>
      <PageHeader title="Patients">
        <Link to="/patients/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> Add patient
        </Link>
      </PageHeader>
      <div className="mb-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, phone, email, blood group…" />
      </div>
      <div className="card shadow-sm">
        <Async state={state}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState>{q ? 'No patients match your search.' : 'No patients yet.'}</EmptyState>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th>Patient</th><th>Age</th><th>Gender</th><th>Blood</th><th>Phone</th><th /></tr>
                    </thead>
                    <tbody>
                      {data.items.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2"><Avatar person={p} /> {p.full_name}</div>
                          </td>
                          <td>{p.age}</td>
                          <td className="text-capitalize">{p.gender}</td>
                          <td>{p.blood_group}</td>
                          <td>{p.phone}</td>
                          <td className="text-end text-nowrap">
                            <Link to={`/patients/${p.id}`} className="btn btn-sm btn-outline-primary me-1">View</Link>
                            <Link to={`/patients/${p.id}/edit`} className="btn btn-sm btn-outline-secondary me-1">Edit</Link>
                            <ConfirmButton
                              message={`Delete ${p.full_name}? Their login and appointments will be removed too.`}
                              onConfirm={() => remove(p)}
                            >
                              Delete
                            </ConfirmButton>
                          </td>
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
