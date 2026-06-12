import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateAdDto {
  @IsString()
  @ApiProperty({ example: 'Summer Launch Campaign' })
  title!: string;

  @IsString()
  @ApiProperty({ example: 'Get 20% off on premium listings.' })
  description!: string;

  @IsNumber()
  @ApiProperty({ example: 49.99 })
  @Type(() => Number)
  price!: number;
}
