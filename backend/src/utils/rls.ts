import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source.js';

export interface RlsContext {
  tenantId?: string | null;
  isAdmin?: boolean;
}

export const runWithContext = async <T>(ctx: RlsContext, fn: (manager: EntityManager) => Promise<T>): Promise<T> => {
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const adminFlag = ctx.isAdmin ? 'true' : 'false';
    await runner.query(`SET LOCAL app.is_admin_global = '${adminFlag}'`);

    if (ctx.tenantId === null || ctx.tenantId === undefined) {
      // DEFAULT limpia el valor del GUC, evita error de sintaxis con NULL
      await runner.query('SET LOCAL app.tenant_id TO DEFAULT');
    } else {
      let tenantNumeric: string;
      try {
        tenantNumeric = BigInt(ctx.tenantId).toString();
      } catch (_err) {
        throw new Error('tenantId inválido, debe ser numérico');
      }
      await runner.query(`SET LOCAL app.tenant_id = ${tenantNumeric}`);
    }
    const result = await fn(runner.manager);
    await runner.commitTransaction();
    return result;
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
  }
};
