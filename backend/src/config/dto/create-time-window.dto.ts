import { IsString, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';

export class CreateTimeWindowDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  startMinute?: number = 0;

  @IsInt()
  @Min(0)
  @Max(23)
  endHour: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  endMinute?: number = 0;

  @IsInt()
  @Min(0)
  boost: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
