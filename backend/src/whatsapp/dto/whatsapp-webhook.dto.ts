import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class WebhookKeyDto {
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  participant?: string;
}

class ExtendedTextMessageDto {
  @IsString()
  text: string;
}

class WebhookMessageDto {
  @IsOptional()
  @IsString()
  conversation?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExtendedTextMessageDto)
  extendedTextMessage?: ExtendedTextMessageDto;
}

class WebhookDataDto {
  @ValidateNested()
  @Type(() => WebhookKeyDto)
  key: WebhookKeyDto;

  @IsOptional()
  @IsString()
  pushName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookMessageDto)
  message?: WebhookMessageDto;

  @IsOptional()
  @IsString()
  messageType?: string;

  @IsNumber()
  messageTimestamp: number;
}

export class WhatsAppWebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsString()
  @IsNotEmpty()
  instance: string;

  @ValidateNested()
  @Type(() => WebhookDataDto)
  data: WebhookDataDto;
}
