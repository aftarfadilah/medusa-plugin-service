import {MigrationInterface, QueryRunner} from "typeorm";

export class initialService1666791604741 implements MigrationInterface {
    name = "initialService1666791604741"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS company
            (
                "id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "work_day_from" timestamp WITH time zone NOT NULL,
                "work_day_to" timestamp WITH time zone NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_company_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS calendar
            (
                "id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "color" character varying NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_calendar_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS calendar_timeperiod
            (
                id character varying NOT NULL,
                "title" character varying NOT NULL,
                "type" text NOT NULL,
                "from" timestamp WITH time zone NOT NULL,
                "to" timestamp WITH time zone NOT NULL,
                "calendar_id" character varying NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_calendar_timeperiod_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS location
            (
                "id" character varying NOT NULL,
                "title" character varying NOT NULL,
                "company_id" character varying,
                "calendar_id" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "address_1" character varying,
                "address_2" character varying,
                "city" character varying,
                "country_code" character varying,
                "province" character varying,
                "postal_code" character varying,
                "phone" character varying,
                "code" character varying NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb,
                CONSTRAINT "PK_location_id" PRIMARY KEY ("id"));
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS division
            (
                "location_id" character varying NOT NULL,
                "calendar_id" character varying NOT NULL,
                CONSTRAINT "PK_location_calendar_id" PRIMARY KEY ("location_id", "calendar_id")
            );
        `);
        await queryRunner.query(`CREATE INDEX "IDX_division_location_id" ON "division" ("location_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_division_calendar_id" ON "division" ("calendar_id") `);

        await queryRunner.query(`ALTER TABLE "division" ADD CONSTRAINT "FK_division_location_id" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "division" ADD CONSTRAINT "FK_division_calendar_id" FOREIGN KEY ("calendar_id") REFERENCES "calendar"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "calendar_timeperiod" ADD CONSTRAINT "FK_calendar_timeperiod_calendar_id" FOREIGN KEY ("calendar_id") REFERENCES "calendar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "location" ADD CONSTRAINT "FK_location_country_code_country" FOREIGN KEY ("country_code") REFERENCES "country"("iso_2") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "location" ADD CONSTRAINT "FK_location_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" DROP CONSTRAINT "FK_location_company_id"`);
        await queryRunner.query(`ALTER TABLE "location" DROP CONSTRAINT "FK_location_country_code_country"`);
        await queryRunner.query(`ALTER TABLE "calendar_timeperiod" DROP CONSTRAINT "FK_calendar_timeperiod_calendar_id"`);
        await queryRunner.query(`ALTER TABLE "division" DROP CONSTRAINT "FK_division_calendar_id"`);
        await queryRunner.query(`ALTER TABLE "division" DROP CONSTRAINT "FK_division_location_id"`);
        await queryRunner.query(`DROP INDEX "IDX_division_location_id"`);
        await queryRunner.query(`DROP INDEX "IDX_division_calendar_id"`);
        await queryRunner.query(`
            DROP TABLE company;
            DROP TABLE location;
            DROP TABLE division;
            DROP TABLE calendar;
            DROP TABLE calendar_timeperiod;
        `);
    }

}
