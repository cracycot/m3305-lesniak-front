import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parse } from 'pg-connection-string';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.get<string>('DATABASE_URL') ?? '';
                const conn = parse(url);
                const isProduction = config.get('NODE_ENV') === 'production';
                const sslDisabled = url.includes('sslmode=disable');
                return {
                    type: 'postgres',
                    host: conn.host ?? 'localhost',
                    port: Number(conn.port ?? 5432),
                    username: conn.user ?? 'postgres',
                    password: conn.password ?? '',
                    database: (conn.database as string) ?? 'leningrad',
                    ssl: sslDisabled ? false : isProduction ? { rejectUnauthorized: false } : false,
                    autoLoadEntities: true,
                    synchronize: !isProduction,
                };
            },
        }),
    ],
})
export class DatabaseModule {}
