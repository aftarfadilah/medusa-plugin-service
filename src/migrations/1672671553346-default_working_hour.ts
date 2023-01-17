import {MigrationInterface, QueryRunner} from "typeorm";

export class defaultWorkingHour1672671553346 implements MigrationInterface {
    name = "defaultWorkingHour1672671553346"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS default_working_hour
            (
                "id" character varying NOT NULL,
                "location_id" character varying NOT NULL,
                "day" integer NOT NULL,
                "from" time WITHOUT time zone NOT NULL,
                "to" time WITHOUT time zone NOT NULL,
                "is_working_day" boolean NOT NULL DEFAULT false,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                CONSTRAINT "PK_default_working_hour_id" PRIMARY KEY ("id")
            );
        `)

        await queryRunner.query(`ALTER TABLE "default_working_hour" ADD CONSTRAINT "FK_default_working_hour_location_id" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "default_working_hour" DROP CONSTRAINT "FK_default_working_hour_location_id"`);
        await queryRunner.query(`DROP TABLE default_working_hour;`)
    }

}
