import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePeriodDto {
    @ApiProperty({ description: 'Название периода' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Начальный год' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    startYear?: number;

    @ApiPropertyOptional({ description: 'Конечный год' })
    @IsOptional()
    @IsInt()
    @Min(1800)
    endYear?: number;

    @ApiPropertyOptional({ description: 'Описание периода' })
    @IsOptional()
    @IsString()
    description?: string;
}
