import {
  IsString,
  IsIn,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'COMPLETADA'])
  status?: 'PENDIENTE' | 'COMPLETADA';

  @IsOptional()
  @IsIn(['BAJA', 'MEDIA', 'ALTA'])
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'COMPLETADA'])
  status?: 'PENDIENTE' | 'COMPLETADA';

  @IsOptional()
  @IsIn(['BAJA', 'MEDIA', 'ALTA'])
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class GetTasksQueryDto {
  @IsOptional()
  @IsIn(['PENDIENTE', 'COMPLETADA'])
  status?: 'PENDIENTE' | 'COMPLETADA';

  @IsOptional()
  @IsIn(['BAJA', 'MEDIA', 'ALTA'])
  priority?: 'BAJA' | 'MEDIA' | 'ALTA';
}
