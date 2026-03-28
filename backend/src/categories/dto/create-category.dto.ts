import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Название категории', maxLength: 255 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Описание категории', maxLength: 2000 })
    @IsString()
    @IsOptional()
    @MaxLength(2000)
    description?: string;
}
