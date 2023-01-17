import {MigrationInterface, QueryRunner} from "typeorm";

export class updateCompany1672672858967 implements MigrationInterface {
    name = "updateCompany1672672858967"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE company DROP COLUMN "work_day_from"`);
        await queryRunner.query(`ALTER TABLE company DROP COLUMN "work_day_to"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE company ADD "work_day_from" timestamp WITH time zone NOT NULL DEFAULT Now()`);
        await queryRunner.query(`ALTER TABLE company ADD "work_day_to" timestamp WITH time zone NOT NULL DEFAULT Now()`);
        
    }

}
