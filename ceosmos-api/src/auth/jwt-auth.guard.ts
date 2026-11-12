import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    if (err || !user) {
      // P11-D05: no se devuelve el mensaje interno de passport-jwt ("jwt malformed",
      // "invalid signature", "jwt expired"); los errores propios (sesión revocada) sí.
      throw err ?? new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
