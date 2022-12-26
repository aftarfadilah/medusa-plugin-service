import {MigrationInterface, QueryRunner} from "typeorm";

export class updateDivisionFields1671805109711 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE division DROP CONSTRAINT "PK_location_calendar_id"`);
        await queryRunner.query(`ALTER TABLE division ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE division ADD "created_at" timestamp WITH time zone NOT NULL DEFAULT Now()`);
        await queryRunner.query(`ALTER TABLE division ADD "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now()`);
        await queryRunner.query(`ALTER TABLE division ADD "deleted_at" timestamp WITH time zone NULL`);
        await queryRunner.query(`ALTER TABLE division ADD CONSTRAINT "PK_division_id" PRIMARY KEY ("id", "location_id", "calendar_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE division DROP CONSTRAINT "PK_division_id"`);
        await queryRunner.query(`ALTER TABLE division DROP "id"`);
        await queryRunner.query(`ALTER TABLE division DROP "created_at"`);
        await queryRunner.query(`ALTER TABLE division DROP "updated_at"`);
        await queryRunner.query(`ALTER TABLE division DROP "deleted_at"`);
        await queryRunner.query(`ALTER TABLE division ADD CONSTRAINT "PK_location_calendar_id" PRIMARY KEY ("location_id", "calendar_id")`);
    }

}
