import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';

@Module({})
export class StorageModule {
    static forRootAsync(): DynamicModule {
        return {
            module: StorageModule,
            imports: [ConfigModule],
            providers: [StorageService],
            exports: [StorageService],
            global: true,
        };
    }
}
