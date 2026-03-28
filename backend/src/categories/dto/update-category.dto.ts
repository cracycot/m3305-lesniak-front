import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
    @ApiPropertyOptional({ description: 'Название категории', maxLength: 255 })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional({ description: 'Описание категории', maxLength: 2000 })
    @IsString()
    @IsOptional()
    @MaxLength(2000)
    description?: string;
}
