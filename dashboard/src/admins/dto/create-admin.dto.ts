import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength, Matches, IsEmail } from "class-validator";

export class createAdminDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'The name of the admin', example: 'John Doe' })
    name!: string

    @IsNotEmpty()
    @IsEmail({}, { message: 'Invalid email format. Please enter a valid email (e.g., user@example.com)' })
    @ApiProperty({ description: 'The email of the admin', example: 'john.doe@example.com' })
    email!: string


    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    @Matches(/[A-Za-z]/, { message: 'Password must contain at least one alphabet letter.' })
    @Matches(/[0-9]/, { message: 'Password must contain at least one number.' })
    @Matches(/[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/\\~`%]/, { message: 'Password must contain at least one special character.' })
    @ApiProperty({ description: 'The password of the admin', example: 'SecurePassword123' })
    password!: string
}