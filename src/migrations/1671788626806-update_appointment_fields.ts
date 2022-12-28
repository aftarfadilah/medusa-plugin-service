import {MigrationInterface, QueryRunner} from "typeorm";

export class updateAppointmentFields1671788626806 implements MigrationInterface {
    name = "updateAppointmentFields1671788626806"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE appointment ADD "display_id" SERIAL NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_appointment_display_id" ON "appointment" ("display_id")`)
        await queryRunner.query(`ALTER TABLE appointment DROP COLUMN "location"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_appointment_display_id"`)
        await queryRunner.query(`ALTER TABLE appointment DROP COLUMN "display_id"`);
        await queryRunner.query(`ALTER TABLE appointment ADD "location" text NULL`);
    }

}
