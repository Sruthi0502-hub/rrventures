import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsEmail, MinLength } from "class-validator"

export class LoginDto {
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({ example: 'enter your email' })
    email!: string


    @IsNotEmpty()
    @ApiProperty({ example: 'enter your password' })
    password!: string
}
