import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto, RegisterDto, ResetPasswordDto, VerifyEmailDto } from '../../auth/dto/auth.dto';
import { UpdateProfileDto } from '../../users/dto/users.dto';
import { CreateAdminUserDto, UpdateUserPasswordDto } from '../../admin/dto/admin-users.dto';

// 1.4.0 · Campos de usuario sin espacios (defensa en la API).
describe('Campos sin espacios', () => {
  const errores = async (cls: any, plano: object) =>
    (await validate(plainToInstance(cls, plano))).map((e) => e.property);

  const clave = 'Clave#2026x';

  it.each([' qa@ejemplo.com', 'qa@ejemplo.com ', 'qa @ejemplo.com'])(
    'login rechaza el correo con espacios %#',
    async (email) => {
      expect(await errores(LoginDto, { email, password: clave })).toContain('email');
    },
  );

  it.each(['Clave 2026#x', ' Clave#2026x', 'Clave#2026x '])(
    'login rechaza la contraseña con espacios %#',
    async (password) => {
      expect(await errores(LoginDto, { email: 'qa@ejemplo.com', password })).toContain('password');
    },
  );

  it('login válido sin espacios pasa', async () => {
    expect(await errores(LoginDto, { email: 'qa@ejemplo.com', password: clave })).toEqual([]);
  });

  it('registro rechaza usuario y contraseña con espacios', async () => {
    const e = await errores(RegisterDto, { email: 'qa@ejemplo.com', username: 'qa usuario', password: 'Clave #2026' });
    expect(e).toEqual(expect.arrayContaining(['username', 'password']));
  });

  it('código de verificación y token no admiten espacios', async () => {
    expect(await errores(VerifyEmailDto, { email: 'qa@ejemplo.com', code: 'AB 12C' })).toContain('code');
    expect(await errores(ResetPasswordDto, { token: 'abc def', newPassword: clave })).toContain('token');
  });

  it('perfil y administración rechazan espacios', async () => {
    expect(await errores(UpdateProfileDto, { username: ' qa' })).toContain('username');
    expect(await errores(CreateAdminUserDto, { email: 'qa@ejemplo.com', username: 'qa\tx', password: clave })).toContain('username');
    expect(await errores(UpdateUserPasswordDto, { newPassword: 'Clave# 2026' })).toContain('newPassword');
  });
});
