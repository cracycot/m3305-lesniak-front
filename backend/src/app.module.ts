import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ObjectsModule } from './objects/objects.module';
import { CategoriesModule } from './categories/categories.module';
import { PeriodsModule } from './periods/periods.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        CategoriesModule,
        PeriodsModule,
        ObjectsModule,
        FeedbackModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
