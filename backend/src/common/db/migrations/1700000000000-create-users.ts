import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1700000000000 implements MigrationInterface {
  name = 'CreateUsers1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" text NOT NULL,
        "passwordHash" text NOT NULL,
        "role" text NOT NULL DEFAULT 'USER',
        "tokenVersion" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users";`);
  }
}
