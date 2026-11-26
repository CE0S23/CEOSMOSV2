import { Matches, ValidationOptions } from 'class-validator';

/**
 * Correo, nombre de usuario, contraseña, códigos y tokens no admiten espacios
 * en ninguna posición (1.4.0). La app ya bloquea la barra espaciadora y limpia lo
 * pegado; esta regla es la defensa del lado del servidor.
 */
export const SIN_ESPACIOS = /^\S*$/;

export function SinEspacios(campo: string, options?: ValidationOptions) {
  return Matches(SIN_ESPACIOS, {
    message: `${campo} must not contain spaces`,
    ...options,
  });
}
