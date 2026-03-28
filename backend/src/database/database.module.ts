import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parse } from 'pg-connection-string';
import { join } from 'path';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.get<string>('DATABASE_URL') ?? '';
                const conn = parse(url);
                const isProduction = config.get('NODE_ENV') === 'production';
                const forceSynchronize =
                    config.get<string>('TYPEORM_SYNCHRONIZE') === '1' ||
                    config.get<string>('DB_SYNCHRONIZE') === '1';
                const sslDisabled =
                    config.get<string>('DATABASE_SSL_DISABLE') === '1' ||
                    url.includes('sslmode=disable');
                return {
                    type: 'postgres',
                    host: conn.host ?? 'localhost',
                    port: Number(conn.port ?? 5432),
                    username: conn.user ?? 'postgres',
                    password: conn.password ?? '',
                    database: (conn.database as string) ?? 'leningrad',
                    ssl: sslDisabled ? false : isProduction ? { rejectUnauthorized: false } : false,
                    autoLoadEntities: true,
                    synchronize: forceSynchronize ? true : !isProduction,
                    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
                    migrationsRun: isProduction,
                    logging: isProduction ? ['error'] : ['error', 'warn', 'schema', 'migration'],
                    logger: 'advanced-console',
                };
            },
        }),
    ],
})
export class DatabaseModule {}
