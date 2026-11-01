import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Async, Avatar, ConfirmButton, PageHeader } from '../components/ui.jsx';
import { useToast } from '../toast.jsx';

export default function DoctorList() {
  const { user } = useAuth();
  const toast = useToast();
  const state = useApi('/doctors');
  const isAdmin = user.role === 'admin';

  const remove = async (d) => {
    try {
      await api(`/doctors/${d.id}`, { method: 'DELETE' });
      toast('Doctor deleted');
      state.reload();
    } catch (e) {
      toast(e.message, 'danger');
    }
  };

  return (
    <>
      <PageHeader title="Doctors">
        {isAdmin && (
          <Link to="/doctors/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1" /> Add doctor
          </Link>
        )}
      </PageHeader>
      <Async state={state}>
        {(doctors) =>
          doctors.length === 0 ? (
            <p className="text-muted">No doctors yet.</p>
          ) : (
            <div className="card shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Doctor</th><th>Department</th><th>Phone</th><th>Email</th><th /></tr>
                  </thead>
                  <tbody>
                    {doctors.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Avatar person={d} /> Dr. {d.full_name}
                          </div>
                        </td>
                        <td>{d.department}</td>
                        <td>{d.phone || '—'}</td>
                        <td>{d.email || '—'}</td>
                        <td className="text-end text-nowrap">
                          {isAdmin ? (
                            <>
                              <Link to={`/doctors/${d.id}`} className="btn btn-sm btn-outline-primary me-1">View</Link>
                              <Link to={`/doctors/${d.id}/edit`} className="btn btn-sm btn-outline-secondary me-1">Edit</Link>
                              <ConfirmButton
                                message={`Delete Dr. ${d.full_name}? Their login and appointments will be removed too.`}
                                onConfirm={() => remove(d)}
                              >
                                Delete
                              </ConfirmButton>
                            </>
                          ) : (
                            <Link to={`/appointments/new?doctor=${d.id}`} className="btn btn-sm btn-primary">
                              Book
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      </Async>
    </>
  );
}
