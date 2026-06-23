import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateProjectDto {
    @IsString()
    @ApiProperty({ example: 'Warehouse Framing' })
    title!: string;

    @IsString()
    @ApiProperty({ example: 'Structural Fabrication' })
    category!: string;

    @IsString()
    @ApiProperty({ example: 'Global Logistics Corp' })
    client!: string;

    @IsString()
    @ApiProperty({ example: '2025' })
    year!: string;

    @IsString()
    @ApiProperty({ example: 'Designed and fabricated frameworks.' })
    description!: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'Active', required: false })
    status?: string;

    @IsOptional()
    @ApiProperty({ example: '{"Material Grade":"ASTM A36"}', required: false })
    specifications?: string;
}
