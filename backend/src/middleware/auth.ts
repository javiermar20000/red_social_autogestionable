import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source.js';
import { RolUsuario, User } from '../entities/User.js';
import { AdminGlobal } from '../entities/AdminGlobal.js';
import { runWithContext } from '../utils/rls.js';

const { JWT_SECRET = 'devsecret' } = process.env;

export interface AuthInfo {
  user?: User;
  admin?: AdminGlobal;
  tenantId?: string | null;
  isAdminGlobal: boolean;
}

export interface AuthRequest extends Request {
  auth?: AuthInfo;
}

interface TokenPayload {
  kind: 'user' | 'admin';
  id: string;
  tenantId?: string | null;
  role?: RolUsuario;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Falta token' });
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.kind === 'admin') {
      const admin = await runWithContext({ isAdmin: true }, (manager) =>
        manager.getRepository(AdminGlobal).findOne({ where: { id: payload.id } })
      );
      if (!admin) return res.status(401).json({ message: 'Admin no encontrado' });
      req.auth = { admin, isAdminGlobal: true, tenantId: null };
      return next();
    }
    const user = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(User).findOne({ where: { id: payload.id } })
    );
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
    req.auth = { user, tenantId: user.tenantId, isAdminGlobal: false };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export const requireRole = (roles: Array<'admin' | RolUsuario>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ message: 'No autenticado' });
    if (auth.isAdminGlobal && roles.includes('admin')) {
      return next();
    }
    if (auth.user && roles.includes(auth.user.rol)) {
      return next();
    }
    return res.status(403).json({ message: 'No autorizado' });
  };
};

export const optionalAuthMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.kind === 'admin') {
      const admin = await runWithContext({ isAdmin: true }, (manager) =>
        manager.getRepository(AdminGlobal).findOne({ where: { id: payload.id } })
      );
      if (admin) req.auth = { admin, isAdminGlobal: true, tenantId: null };
      return next();
    }
    const user = await runWithContext({ isAdmin: true }, (manager) =>
      manager.getRepository(User).findOne({ where: { id: payload.id } })
    );
    if (user) req.auth = { user, tenantId: user.tenantId, isAdminGlobal: false };
  } catch (err) {
    // ignoramos token inválido en el modo opcional
  }
  return next();
};
