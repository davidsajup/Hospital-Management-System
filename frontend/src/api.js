export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

/**
 * JSON in/out; pass a FormData body for uploads.
 * A 401 on any non-auth call tells the app the session has ended.
 */
export async function api(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('hms:unauthorized'));
    }
    throw new ApiError(res.status, data?.error || res.statusText, data?.details);
  }
  return data;
}

/** Builds multipart form data from a plain object, skipping empty/undefined values. */
export function toFormData(values) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') continue;
    fd.append(key, value);
  }
  return fd;
}
