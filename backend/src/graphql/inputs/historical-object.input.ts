import { Field, InputType, Int } from '@nestjs/graphql';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
} from 'class-validator';

@InputType({ description: 'Данные для создания исторического объекта' })
export class CreateHistoricalObjectInput {
    @Field({ description: 'Название объекта' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @Field(() => Int, { description: 'Год создания (>= 1800)' })
    @IsInt()
    @Min(1800)
    year: number;

    @Field({ nullable: true, description: 'URL изображения' })
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @Field({ nullable: true, description: 'alt-текст изображения' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    imageAlt?: string;

    @Field({ nullable: true, description: 'Подпись к изображению' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    imageCaption?: string;

    @Field({ nullable: true, description: 'Описание объекта' })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => Int, { nullable: true, description: 'ID категории' })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @Field(() => [String], { nullable: true, description: 'Список фактов об объекте' })
    @IsOptional()
    @IsString({ each: true })
    facts?: string[];
}

@InputType({ description: 'Данные для обновления исторического объекта (все поля опциональны)' })
export class UpdateHistoricalObjectInput {
    @Field({ nullable: true, description: 'Новое название объекта' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title?: string;

    @Field(() => Int, { nullable: true, description: 'Новый год создания' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    year?: number;

    @Field({ nullable: true, description: 'Новый URL изображения' })
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @Field({ nullable: true, description: 'Новый alt-текст изображения' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    imageAlt?: string;

    @Field({ nullable: true, description: 'Новая подпись к изображению' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    imageCaption?: string;

    @Field({ nullable: true, description: 'Новое описание объекта' })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => Int, { nullable: true, description: 'Новый ID категории (null = убрать категорию)' })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @Field(() => [String], { nullable: true, description: 'Новый список фактов (заменяет все существующие)' })
    @IsOptional()
    @IsString({ each: true })
    facts?: string[];
}
