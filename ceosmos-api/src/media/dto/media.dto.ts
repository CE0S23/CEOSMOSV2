import {
  IsString,
  IsIn,
  IsOptional,
  ValidateIf,
  IsNotEmpty,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsIn(['YOUTUBE', 'IMAGE'])
  type: 'YOUTUBE' | 'IMAGE';

  @ValidateIf((o) => o.type === 'YOUTUBE')
  @IsNotEmpty({ message: 'externalId is required when type is YOUTUBE' })
  @IsString()
  @MaxLength(64)
  externalId?: string;

  @ValidateIf((o) => o.type === 'IMAGE')
  @IsNotEmpty({ message: 'url is required when type is IMAGE' })
  @IsString()
  // Blindaje: solo https (rechaza javascript:, data:, file:).
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  thumbnail?: string;
}

export class GetMediaQueryDto {
  @IsOptional()
  @IsIn(['YOUTUBE', 'IMAGE'])
  type?: 'YOUTUBE' | 'IMAGE';
}
