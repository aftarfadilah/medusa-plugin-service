import {MigrationInterface, QueryRunner} from "typeorm";

export class updateSetting1673611912369 implements MigrationInterface {
    name = "updateSetting1673611912369"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE service_setting ADD "is_public" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE service_setting DROP COLUMN "is_public"`);
    }

}
