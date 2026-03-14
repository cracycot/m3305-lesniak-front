import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodsController } from './periods.controller';
import { PeriodsService } from './periods.service';
import { Period } from './entities/period.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Period])],
    controllers: [PeriodsController],
    providers: [PeriodsService],
    exports: [PeriodsService],
})
export class PeriodsModule {}
