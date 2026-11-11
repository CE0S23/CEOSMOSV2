import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const CONTENT_KEY = /^[A-Za-z0-9:_-]{1,80}$/;

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
  metadata?: Record<string, unknown>;
}

export class ListFocusSessionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
