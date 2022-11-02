import {MigrationInterface, QueryRunner} from "typeorm";

export class appointment1667390514803 implements MigrationInterface {
    name = "appointment1667390514803"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "appointment_status_enum" AS ENUM
            (
                'draft', 'scheduled', 'canceled', 'requires_action',
                'pending', 'reschedule', 'on_progress', 'finished'
            );

            CREATE TABLE IF NOT EXISTS appointment
            (
                "id" character varying NOT NULL,
                "location" text NULL,
                "status" "appointment_status_enum" NOT NULL DEFAULT 'draft',
                "notified_via_email_at" timestamp WITH time zone NULL,
                "notified_via_sms_at" timestamp WITH time zone NULL,
                "from" timestamp WITH time zone NULL,
                "to" timestamp WITH time zone NULL,
                "order_id" character varying NOT NULL,
                "code" character varying NOT NULL,
                "is_confirmed" boolean NOT NULL DEFAULT false,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_appointment_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_appointment_order_id" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_appointment_order_id"`);
        await queryRunner.query(`
            DROP TABLE appointment;
            DROP TYPE "appointment_status_enum";
        `);
    }

}
