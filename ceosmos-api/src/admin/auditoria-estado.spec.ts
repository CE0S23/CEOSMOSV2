import { AdminUsersController } from './admin.controller';
import { AUDIT_ACTION_KEY } from '../common/audit/audit.decorator';
import { AUDIT_ACTIONS } from '../common/audit/audit-log.service';

// 1.4.0 · Regresión: bloquear/desbloquear un usuario no quedaba en la bitácora.
describe('Bitácora de administración', () => {
  const accion = (m: keyof AdminUsersController) =>
    Reflect.getMetadata(AUDIT_ACTION_KEY, AdminUsersController.prototype[m]);

  it('cambiar el estado (bloquear/desbloquear) se audita', () => {
    expect(accion('setStatus')).toBe('USER_STATUS_CHANGE');
    expect(AUDIT_ACTIONS).toContain('USER_STATUS_CHANGE');
  });

  it('las demás acciones de administración siguen auditadas', () => {
    expect(accion('changeRole')).toBe('ROLE_CHANGE');
    expect(accion('deleteUser')).toBe('USER_DELETE');
    expect(accion('changePassword')).toBe('PASSWORD_CHANGE');
  });
});
