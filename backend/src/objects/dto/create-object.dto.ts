import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateObjectDto {
    @ApiProperty({ description: 'Название объекта' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({ description: 'Год создания', minimum: 1000 })
    @IsInt()
    @Min(1000)
    year: number;

    @ApiPropertyOptional({ description: 'URL изображения' })
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'alt-текст изображения' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    imageAlt?: string;

    @ApiPropertyOptional({ description: 'Подпись к изображению' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    imageCaption?: string;

    @ApiPropertyOptional({ description: 'Описание объекта' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'ID категории' })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @ApiPropertyOptional({
        description: 'Факты об объекте',
        type: [String],
    })
    @IsOptional()
    @IsString({ each: true })
    facts?: string[];
}
