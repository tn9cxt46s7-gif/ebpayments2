import { IsEmail, IsString, MinLength, MaxLength, Length, IsNumber, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-zА-Яа-я])(?=.*\d).+$/, {
    message: 'Пароль должен содержать хотя бы одну букву и одну цифру',
  })
  password: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[\p{L} '-]{2,40}$/u, { message: 'Имя может содержать только буквы, 2-40 символов' })
  firstName: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[\p{L} '-]{2,40}$/u, { message: 'Фамилия может содержать только буквы, 2-40 символов' })
  lastName: string;

  @ApiProperty({ example: 'LV' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'Код страны — 2 заглавные латинские буквы, например LV' })
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
