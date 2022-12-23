import {MigrationInterface, QueryRunner} from "typeorm";

export class updateLocationFields1671788658572 implements MigrationInterface {
    name = "updateLocationFields1671788658572"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE location ADD longitude character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE location ADD latitude character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE location DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE location DROP COLUMN "latitude"`);
    }

}
