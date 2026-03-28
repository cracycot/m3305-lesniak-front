import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthController } from './auth.controller';

export interface AuthModuleOptions {
    connectionUri?: string;
    apiKey?: string;
}

@Module({})
export class AuthModule {
    /**
     * Создаёт модуль аутентификации с настройками из переменных окружения.
     * Вызывается в AppModule.
     */
    static forRootAsync(): DynamicModule {
        return {
            module: AuthModule,
            imports: [ConfigModule],
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useFactory: (config: ConfigService) => new AuthService(config),
                    inject: [ConfigService],
                },
                AuthGuard,
                RolesGuard,
            ],
            exports: [AuthService, AuthGuard, RolesGuard],
            global: true,
        };
    }
}
