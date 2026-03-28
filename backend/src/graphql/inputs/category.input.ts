import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType({ description: 'Данные для создания категории' })
export class CreateCategoryInput {
    @Field({ description: 'Название категории (уникальное)' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @Field({ nullable: true, description: 'Описание категории' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}

@InputType({ description: 'Данные для обновления категории (все поля опциональны)' })
export class UpdateCategoryInput {
    @Field({ nullable: true, description: 'Новое название категории' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @Field({ nullable: true, description: 'Новое описание категории' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}
