import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCustomizationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'RRventures' })
  companyName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'info@rrventures.com' })
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'Premium marketing and real estate services.' })
  companyDescription?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '+1 (555) 123-4567' })
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '123 Business St, New York, NY 10001' })
  contactAddress?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '© 2026 RRventures. All rights reserved.' })
  footerText?: string;
}
