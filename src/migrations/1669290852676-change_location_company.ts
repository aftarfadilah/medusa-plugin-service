import {MigrationInterface, QueryRunner} from "typeorm";

export class changeLocationCompany1669290852676 implements MigrationInterface {
    name = "changeLocationCompany1669290852676"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" ADD "company_id" character varying`)
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "location_id"`)
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "company"`)
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "customer_id"`)
        await queryRunner.query(`ALTER TABLE "location" ADD CONSTRAINT "FK_location_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" DROP CONSTRAINT "FK_location_company_id"`);
        await queryRunner.query(`ALTER TABLE "company" ADD "location_id" character varying`)
        await queryRunner.query(`ALTER TABLE "location" ADD "company" character varying`)
        await queryRunner.query(`ALTER TABLE "location" ADD "customer_id" character varying`)
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "company_id"`)
    }

}
