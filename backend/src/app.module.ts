import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ObjectsModule } from './objects/objects.module';
import { CategoriesModule } from './categories/categories.module';
import { PeriodsModule } from './periods/periods.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AppGraphQLModule } from './graphql/graphql.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.register({ ttl: 30_000, max: 100, isGlobal: true }),
        AuthModule.forRootAsync(),
        DatabaseModule,
        CategoriesModule,
        PeriodsModule,
        ObjectsModule,
        FeedbackModule,
        AppGraphQLModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
