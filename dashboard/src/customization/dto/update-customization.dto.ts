import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCustomizationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  companyName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  companyDescription?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  contactAddress?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  footerText?: string;
}
