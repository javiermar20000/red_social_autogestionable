import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminGlobal } from '../entities/AdminGlobal.js';
import { EstadoRegistroUsuario, RolUsuario, User } from '../entities/User.js';
import { runWithContext } from '../utils/rls.js';

const { JWT_SECRET = 'devsecret' } = process.env;

export const registerUser = async (email: string, password: string, nombre: string, role: RolUsuario | 'admin' = RolUsuario.VISITANTE) => {
  if (!nombre) {
    throw new Error('El nombre es obligatorio');
  }
  const passwordHash = await bcrypt.hash(password, 10);

  if (role === 'admin') {
    const admin = await runWithContext({ isAdmin: true }, async (manager) => {
      const adminRepo = manager.getRepository(AdminGlobal);
      const exists = await adminRepo.findOne({ where: { email } });
      if (exists) throw new Error('Correo ya registrado como admin');
      const record = adminRepo.create({ email, passwordHash, nombre });
      return adminRepo.save(record);
    });
    return { admin };
  }

  const user = await runWithContext({ isAdmin: true }, async (manager) => {
    const repo = manager.getRepository(User);
    const existing = await repo.findOne({ where: { email } });
    if (existing) throw new Error('Correo ya registrado');
    const estado = role === RolUsuario.VISITANTE ? EstadoRegistroUsuario.ACTIVO : EstadoRegistroUsuario.PENDIENTE_VALIDACION;
    const record = repo.create({ email, passwordHash, nombre, rol: role, estadoRegistro: estado, tenantId: null });
    return repo.save(record);
  });
  return { user };
};

export const loginUser = async (email: string, password: string) => {
  const admin = await runWithContext({ isAdmin: true }, (manager) =>
    manager.getRepository(AdminGlobal).findOne({ where: { email, activo: true } })
  );
  if (admin) {
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new Error('Credenciales inválidas');
    const token = jwt.sign({ kind: 'admin', id: admin.id }, JWT_SECRET, { expiresIn: '1d' });
    return { token, admin };
  }

  const user = await runWithContext({ isAdmin: true }, (manager) =>
    manager.getRepository(User).findOne({ where: { email, activo: true } })
  );
  if (!user) throw new Error('Credenciales inválidas');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Credenciales inválidas');
  const token = jwt.sign({ kind: 'user', id: user.id, tenantId: user.tenantId, role: user.rol }, JWT_SECRET, {
    expiresIn: '1d',
  });
  return { token, user };
};
