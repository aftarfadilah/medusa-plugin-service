import {MigrationInterface, QueryRunner} from "typeorm";

export class updateLocationFields1671788626806 implements MigrationInterface {
    name = "updateLocationFields1671788626806"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE appointment ADD "display_id" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE appointment DROP COLUMN "location"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE appointment DROP COLUMN "display_id"`);
        await queryRunner.query(`ALTER TABLE appointment ADD "location" text NULL`);
    }

}
