/**
 * Secreto para firmar y verificar los JWT (P11-D06).
 *
 * Antes se usaba `process.env.JWT_SECRET ?? 'changeme'`: si la variable faltaba, la
 * API arrancaba y firmaba con un valor público. Además `JwtModule.register` leía la
 * variable al importar el módulo, antes de que ConfigModule cargara el `.env`.
 * Ahora se lee en tiempo de ejecución y la API no arranca sin un secreto válido.
 */
export const JWT_SECRET_MIN = 32;

export function jwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim() ?? '';
  if (secret.length < JWT_SECRET_MIN || secret === 'changeme') {
    throw new Error(
      `JWT_SECRET no está definido o tiene menos de ${JWT_SECRET_MIN} caracteres; la API no puede arrancar.`,
    );
  }
  return secret;
}
