export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`);
export const forbidden = (msg = 'You do not have access to this resource') => new HttpError(403, msg);

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.name === 'ZodError') {
    const details = {};
    for (const issue of err.issues) details[issue.path.join('.') || '_'] = issue.message;
    return res.status(400).json({ error: 'Validation failed', details });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  if (err?.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed: users\.username/.test(err.message)) {
    return res.status(409).json({ error: 'Validation failed', details: { username: 'Username already taken' } });
  }
  if (err?.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed.*appointments/.test(err.message)) {
    return res.status(409).json({ error: 'That doctor already has an appointment at this date and time' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
