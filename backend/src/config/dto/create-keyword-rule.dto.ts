import { IsString, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';

export class CreateKeywordRuleDto {
  @IsString()
  pattern: string;

  @IsInt()
  @Min(0)
  @Max(10)
  scoreK: number;

  @IsOptional()
  @IsBoolean()
  forceOverride?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  overrideMinPS?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
