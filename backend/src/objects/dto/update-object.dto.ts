import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
} from 'class-validator';

export class UpdateObjectDto {
    @ApiPropertyOptional({ description: 'Название объекта' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ description: 'Год создания', minimum: 1800 })
    @IsOptional()
    @IsInt()
    @Min(1800)
    year?: number;

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
