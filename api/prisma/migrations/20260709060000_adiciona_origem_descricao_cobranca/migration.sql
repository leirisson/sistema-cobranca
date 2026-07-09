-- CreateEnum
CREATE TYPE "origem_cobranca" AS ENUM ('RECORRENTE', 'AVULSA');

-- AlterTable
ALTER TABLE "cobrancas" ADD COLUMN "origem" "origem_cobranca" NOT NULL DEFAULT 'RECORRENTE';
ALTER TABLE "cobrancas" ADD COLUMN "descricao" TEXT;
