export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="input-group" style={{ maxWidth: 340 }}>
      <span className="input-group-text bg-white"><i className="bi bi-search" /></span>
      <input
        className="form-control"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Pagination({ data, onPage }) {
  if (!data || data.total === 0) return null;
  const { page, pageSize, total, totalPages } = data;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-top">
      <span className="text-muted small">
        {first}–{last} of {total}
      </span>
      <div className="btn-group btn-group-sm">
        <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <i className="bi bi-chevron-left" /> Prev
        </button>
        <button className="btn btn-outline-secondary disabled">
          Page {page} / {totalPages}
        </button>
        <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ children = 'Nothing to show.' }) {
  return <p className="text-muted text-center p-4 mb-0">{children}</p>;
}
