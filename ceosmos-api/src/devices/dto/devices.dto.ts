import { IsIn, IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';

// host:puerto (IPv4 o nombre) para TCP; dirección MAC para BLE.
export const DEVICE_ADDRESS =
  /^([A-Za-z0-9.-]{1,63}:\d{2,5}|([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2})$/;

export class CreateDeviceDto {
  @IsString()
  @Length(1, 40)
  name: string;

  @IsIn(['WEARABLE', 'TV'])
  type: 'WEARABLE' | 'TV';

  @IsIn(['TCP', 'BLE'])
  transport: 'TCP' | 'BLE';

  @Matches(DEVICE_ADDRESS, { message: 'Dirección inválida (host:puerto o MAC)' })
  address: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  name?: string;

  @IsOptional()
  @Matches(DEVICE_ADDRESS, { message: 'Dirección inválida (host:puerto o MAC)' })
  address?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  /** La app lo envía al recibir datos del dispositivo. */
  @IsOptional()
  @IsIn([true])
  seen?: true;
}
