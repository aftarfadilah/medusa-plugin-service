import { MigrationInterface, QueryRunner } from "typeorm";

export class updateDivisionInCalendar1673084620757
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar"
            ADD "division_id" character varying`);

    await queryRunner.query(`
            ALTER TABLE division
                ADD UNIQUE ("id")
        `);

    await queryRunner.query(`ALTER TABLE "calendar"
            ADD CONSTRAINT "FK_division_id" FOREIGN KEY ("division_id") REFERENCES "division" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar" DROP "division_id"`);

    await queryRunner.query(`
            ALTER TABLE division
            DROP INDEX "id"
        `);

    await queryRunner.query(
      `ALTER TABLE "calendar" DROP CONSTRAINT "FK_division_id"`
    );
  }
}
