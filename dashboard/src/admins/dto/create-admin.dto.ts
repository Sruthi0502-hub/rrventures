import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";

export class createAdminDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The name of the admin', example: 'John Doe' })
    name!: string

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The email of the admin', example: 'john.doe@example.com' })
    email!: string

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The password of the admin', example: 'SecurePassword123' })
    password!: string


}