import { IsEmail, IsString, MinLength, Length, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'LV' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  captchaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  captchaAnswer?: number;

  @ApiPropertyOptional({ description: 'Google reCAPTCHA token' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;

  @ApiProperty()
  @IsBoolean()
  gdprConsent: boolean;

  @ApiProperty({ example: 'ru' })
  @IsString()
  locale: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}
