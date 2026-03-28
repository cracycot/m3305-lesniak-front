import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

@InputType({ description: 'Данные для создания периода' })
export class CreatePeriodInput {
    @Field({ description: 'Название периода' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @Field(() => Int, { nullable: true, description: 'Начальный год (>= 1800)' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    startYear?: number;

    @Field(() => Int, { nullable: true, description: 'Конечный год (>= 1800)' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    endYear?: number;

    @Field({ nullable: true, description: 'Описание периода' })
    @IsOptional()
    @IsString()
    description?: string;
}

@InputType({ description: 'Данные для обновления периода (все поля опциональны)' })
export class UpdatePeriodInput {
    @Field({ nullable: true, description: 'Новое название периода' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @Field(() => Int, { nullable: true, description: 'Новый начальный год' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    startYear?: number;

    @Field(() => Int, { nullable: true, description: 'Новый конечный год' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    endYear?: number;

    @Field({ nullable: true, description: 'Новое описание периода' })
    @IsOptional()
    @IsString()
    description?: string;
}
