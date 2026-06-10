import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, MinLength } from "class-validator";

export class updateAdminDto {
    password(password: string, password1: any) {
        throw new Error('Method not implemented.');
    }

    @IsString()
    @ApiProperty({ description: 'you want to update the name to', example: 'John Doe' })
    name: string | undefined;

    @IsString()
    @ApiProperty({ description: 'you want to update the email to', example: 'john.doe@example.com' })
    email: string | undefined;


    @IsString()
    @ApiProperty({ description: 'you want to update the password', example: '123' })
    oldPassword?: string
    @IsString()
    @ApiProperty({ description: 'Enter your new password', example: '10293' })
    newPassword?: string

}