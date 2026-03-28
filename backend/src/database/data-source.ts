import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { parse } from 'pg-connection-string';

config();

const url = process.env.DATABASE_URL ?? '';
const conn = parse(url);
const isProduction = process.env.NODE_ENV === 'production';
const sslDisabled =
    process.env.DATABASE_SSL_DISABLE === '1' || url.includes('sslmode=disable');

export default new DataSource({
    type: 'postgres',
    host: conn.host ?? 'localhost',
    port: Number(conn.port ?? 5432),
    username: conn.user ?? 'postgres',
    password: conn.password ?? '',
    database: (conn.database as string) ?? 'leningrad',
    ssl: sslDisabled ? false : isProduction ? { rejectUnauthorized: false } : false,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/database/migrations/*.js'],
});
