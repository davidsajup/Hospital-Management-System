import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth.js';
import { parsePaging } from '../paging.js';
import { listAudit } from '../services/audit.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const filters = z.object({
  action: z.string().max(30).optional(),
  entity: z.string().max(30).optional(),
});

router.get('/', (req, res) => {
  res.json(listAudit({ ...filters.parse(req.query), ...parsePaging(req.query) }));
});

export default router;
