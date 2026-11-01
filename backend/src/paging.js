import { z } from 'zod';

const pagingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional().default(''),
});

/** Reads ?page=&pageSize=&q= from a request query. */
export const parsePaging = (query) => pagingSchema.parse(query);

/** Escapes LIKE wildcards in user input and wraps it for a contains-search. */
export const likeTerm = (q) => `%${q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const offsetOf = ({ page, pageSize }) => (page - 1) * pageSize;

export const pageOf = (items, total, { page, pageSize }) => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
