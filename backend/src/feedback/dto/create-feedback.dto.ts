import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
    @ApiProperty({ description: 'Имя автора сообщения' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({ description: 'E-mail автора' })
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty({ description: 'Текст сообщения' })
    @IsString()
    @IsNotEmpty()
    message: string;
}
