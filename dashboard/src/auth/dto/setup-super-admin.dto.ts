import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinDate, MinLength } from "class-validator";


export class SetupSuperAdminDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'enter your name' })
    name!: string

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ example: 'enter your email' })
    email!: string


    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'enter your password' })
    password!: string
}
