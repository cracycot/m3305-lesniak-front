import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711600000000 implements MigrationInterface {
    name = 'InitialSchema1711600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "category" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                CONSTRAINT "UQ_category_name" UNIQUE ("name"),
                CONSTRAINT "PK_category" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "period" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "startYear" integer,
                "endYear" integer,
                "description" text,
                CONSTRAINT "PK_period" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "historical_object" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "year" integer NOT NULL,
                "imageUrl" character varying,
                "imageAlt" character varying,
                "imageCaption" character varying,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "categoryId" integer,
                CONSTRAINT "PK_historical_object" PRIMARY KEY ("id"),
                CONSTRAINT "FK_historical_object_category" FOREIGN KEY ("categoryId")
                    REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "object_fact" (
                "id" SERIAL NOT NULL,
                "text" text NOT NULL,
                "objectId" integer,
                CONSTRAINT "PK_object_fact" PRIMARY KEY ("id"),
                CONSTRAINT "FK_object_fact_object" FOREIGN KEY ("objectId")
                    REFERENCES "historical_object"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "object_period" (
                "historicalObjectId" integer NOT NULL,
                "periodId" integer NOT NULL,
                CONSTRAINT "PK_object_period" PRIMARY KEY ("historicalObjectId", "periodId"),
                CONSTRAINT "FK_object_period_object" FOREIGN KEY ("historicalObjectId")
                    REFERENCES "historical_object"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_object_period_period" FOREIGN KEY ("periodId")
                    REFERENCES "period"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_object_period_object" ON "object_period" ("historicalObjectId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_object_period_period" ON "object_period" ("periodId")
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "feedback" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "message" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_feedback" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "object_period"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "object_fact"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "historical_object"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "period"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "feedback"`);
    }
}
