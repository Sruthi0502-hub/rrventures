import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinDate, MinLength } from "class-validator";


export class UpdateSuperAdminDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'enter your name' })
    name!: string

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ example: 'enter your email' })
    email!: string



}
