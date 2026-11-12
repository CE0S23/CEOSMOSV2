import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

export const CONTENT_KEY = /^[A-Za-z0-9:_-]{1,80}$/;

/** Tamaño máximo de metadata serializada (P11-D04). La app envía ~300 bytes. */
export const METADATA_MAX_BYTES = 4096;

export function MaxJsonBytes(max: number, options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'maxJsonBytes',
      validator: {
        validate: (v: unknown) =>
          v == null || Buffer.byteLength(JSON.stringify(v)) <= max,
        defaultMessage: () => `metadata no puede superar ${max} bytes`,
      },
    },
    options,
  );
}

export class CreateFocusSessionDto {
  @Matches(CONTENT_KEY, { message: 'contentKey inválido' })
  contentKey: string;

  @IsIn(['FOCUS', 'RELAX', 'INSPIRE'])
  mode: 'FOCUS' | 'RELAX' | 'INSPIRE';

  @IsISO8601({ strict: true })
  startedAt: string;

  @IsISO8601({ strict: true })
  endedAt: string;

  @IsInt()
  @Min(0)
  durationSeconds: number;

  @IsInt()
  @Min(5)
  @Max(180)
  targetMinutes: number;

  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsObject()
  @MaxJsonBytes(METADATA_MAX_BYTES)
  metadata?: Record<string, unknown>;

  /** UUID v4 que genera la app una sola vez por sesión: los reintentos no duplican (P11-D01). */
  @IsOptional()
  @IsUUID('4', { message: 'clientId debe ser un UUID v4' })
  clientId?: string;
}

export class ListFocusSessionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** P12-O1: id de la última sesión recibida; la página siguiente empieza después. */
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{1,80}$/)
  cursor?: string;
}
