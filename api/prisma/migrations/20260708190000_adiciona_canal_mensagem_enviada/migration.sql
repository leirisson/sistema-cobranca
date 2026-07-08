-- CreateEnum
CREATE TYPE "canal_notificacao" AS ENUM ('whatsapp', 'email');

-- AlterTable
ALTER TABLE "mensagens_enviadas" ADD COLUMN "canal" "canal_notificacao" NOT NULL DEFAULT 'whatsapp';
