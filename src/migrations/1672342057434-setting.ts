import {MigrationInterface, QueryRunner} from "typeorm";

export class setting1672342057434 implements MigrationInterface {
    name = "setting1672342057434"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS service_setting
            (
                "id" character varying NOT NULL,
                "option" character varying NOT NULL,
                "value" character varying NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                CONSTRAINT "PK_service_setting_id" PRIMARY KEY ("id")
            );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE service_setting;
        `);
    }
}
