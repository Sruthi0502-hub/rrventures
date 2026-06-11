import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAdDto {
  @IsString()
  @ApiProperty({ example: 'Ad title' })
  title!: string;

  @IsString()
  @ApiProperty({ example: 'Ad description' })
  description!: string;
}
