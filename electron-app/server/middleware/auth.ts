import { Request, Response, NextFunction } from 'express';
import { getSession } from '../../lib/authentication';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  (req as any).user = session.user;
  next();
}

export function requireRole(role: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = await getSession(req);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (session.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    (req as any).user = session.user;
    next();
  };
}

