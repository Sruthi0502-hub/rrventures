import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsEmail, MinLength, Matches } from "class-validator"

export class loginDto {
    @IsNotEmpty()
    @IsEmail({}, { message: 'Invalid email format. Please enter a valid email (e.g., user@example.com)' })
    @ApiProperty({ example: 'enter your email' })
    email!: string


    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @Matches(/[A-Za-z]/, { message: 'Password must contain at least one alphabet letter.' })
    @Matches(/[0-9]/, { message: 'Password must contain at least one number.' })
    @Matches(/[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/\\~`%]/, { message: 'Password must contain at least one special character.' })
    @ApiProperty({ example: 'enter your password' })
    password!: string
}
