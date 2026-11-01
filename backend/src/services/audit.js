import { db } from '../db.js';
import { likeTerm, offsetOf, pageOf } from '../paging.js';

/**
 * Records an action. `actor` is the signed-in user, or a plain
 * { username } for events before sign-in (failed logins).
 */
export function audit(actor, action, entity, entityId = null, summary = '') {
  try {
    const name = actor.full_name || `${actor.first_name ?? ''} ${actor.last_name ?? ''}`.trim() || actor.username;
    db.prepare(
      `INSERT INTO audit_log (actor_id, actor_name, actor_role, action, entity, entity_id, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(actor.id ?? null, name, actor.role ?? 'anonymous', action, entity, entityId, summary);
  } catch (err) {
    // Never let logging take down the request it describes.
    console.error('audit log write failed', err);
  }
}

export function listAudit({ q, action, entity, page, pageSize }) {
  const where = ['1 = 1'];
  const args = [];
  if (q) {
    where.push(`(LOWER(actor_name) LIKE ? ESCAPE '\\' OR LOWER(summary) LIKE ? ESCAPE '\\')`);
    args.push(likeTerm(q), likeTerm(q));
  }
  if (action) {
    where.push('action = ?');
    args.push(action);
  }
  if (entity) {
    where.push('entity = ?');
    args.push(entity);
  }
  const clause = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS n FROM audit_log WHERE ${clause}`).get(...args).n;
  const items = db
    .prepare(`SELECT * FROM audit_log WHERE ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...args, pageSize, offsetOf({ page, pageSize }));
  return pageOf(items, total, { page, pageSize });
}
