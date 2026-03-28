import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType({ description: 'Данные для создания отзыва' })
export class CreateFeedbackInput {
    @Field({ description: 'Имя автора отзыва' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @Field({ description: 'Email автора отзыва' })
    @IsEmail()
    @MaxLength(255)
    email: string;

    @Field({ description: 'Текст сообщения' })
    @IsString()
    @IsNotEmpty()
    message: string;
}
