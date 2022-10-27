import {MigrationInterface, QueryRunner} from "typeorm";

export class initialService1666791604741 implements MigrationInterface {
    name = "initialService1666791604741"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "APPOINTMENT_STATUS_ENUM" AS ENUM
            (
                'not_paid', 'awaiting', 'authorized', 'partially_authorized', 'captured',
                'partially_captured', 'refunded', 'partially_refunded', 'canceled', 'requires_action'
            );

            CREATE TABLE IF NOT EXISTS appointment
            (
                "id" character varying NOT NULL,
                "location" text NULL,
                "status" "APPOINTMENT_STATUS_ENUM" NOT NULL,
                "notified_via_email_at" timestamp WITH time zone NULL,
                "notified_via_sms_at" timestamp WITH time zone NULL,
                "from" timestamp WITH time zone NOT NULL,
                "to" timestamp WITH time zone NOT NULL,
                "order_id" character varying NOT NULL,
                "code" character varying NOT NULL,
                "is_confirmed" boolean NOT NULL DEFAULT FALSE,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_appointment_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS company
            (
                "id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "location_id" character varying NOT NULL,
                "work_day_from" timestamp WITH time zone NOT NULL,
                "work_day_to" timestamp WITH time zone NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_company_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS division
            (
                "id" character varying NOT NULL,
                "company_id" character varying NOT NULL,
                "calendar_id" character varying NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                CONSTRAINT "PK_division_id" PRIMARY KEY ("id")
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
                "customer_id" character varying,
                "company" character varying,
                "first_name" character varying,
                "last_name" character varying,
                "address_1" character varying,
                "address_2" character varying,
                "city" character varying,
                "country_code" character varying,
                "province" character varying,
                "postal_code" character varying,
                "phone" character varying,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb,
                CONSTRAINT "PK_location_id" PRIMARY KEY ("id"))
        `);

        await queryRunner.query(`ALTER TABLE "location" ADD CONSTRAINT "FK_location_country_code_country" FOREIGN KEY ("country_code") REFERENCES "country"("iso_2") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" DROP CONSTRAINT "FK_location_country_code_country"`);
        await queryRunner.query(`
            DROP TABLE appointment;
            DROP TABLE company;
            DROP TABLE location;
            DROP TABLE division;
            DROP TABLE calendar;
            DROP TABLE calendar_timeperiod;

            DROP TYPE "APPOINTMENT_STATUS_ENUM";
        `);
    }

}
