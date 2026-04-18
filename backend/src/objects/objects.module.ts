import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectsController } from './objects.controller';
import { ObjectsApiController } from './objects.api.controller';
import { ObjectsService } from './objects.service';
import { HistoricalObject } from './entities/historical-object.entity';
import { ObjectFact } from './entities/object-fact.entity';
import { Period } from '../periods/entities/period.entity';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([HistoricalObject, ObjectFact, Period]),
        CategoriesModule,
    ],
    controllers: [ObjectsController, ObjectsApiController],
    providers: [ObjectsService],
    exports: [ObjectsService],
})
export class ObjectsModule {}
