import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesApiController } from './categories.api.controller';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Category])],
    controllers: [CategoriesController, CategoriesApiController],
    providers: [CategoriesService],
    exports: [CategoriesService, TypeOrmModule],
})
export class CategoriesModule {}
