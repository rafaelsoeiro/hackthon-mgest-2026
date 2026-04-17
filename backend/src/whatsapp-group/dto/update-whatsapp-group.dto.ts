import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SystemCode } from '@prisma/client';

export class UpdateWhatsAppGroupDto {
  @IsOptional()
  @IsBoolean()
  isMonitored?: boolean;

  @IsOptional()
  @IsEnum(SystemCode)
  systemHint?: SystemCode;
}
