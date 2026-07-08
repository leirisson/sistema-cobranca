/*
  Warnings:

  - You are about to drop the column `telefone` on the `clientes` table. All the data in the column will be lost.
  - Made the column `documento` on table `clientes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "telefone",
ADD COLUMN     "endereco_bairro" TEXT,
ADD COLUMN     "endereco_cep" TEXT,
ADD COLUMN     "endereco_cidade" TEXT,
ADD COLUMN     "endereco_numero" TEXT,
ADD COLUMN     "endereco_rua" TEXT,
ADD COLUMN     "endereco_uf" TEXT,
ADD COLUMN     "inscricao_estadual" TEXT,
ADD COLUMN     "nome_contato" TEXT,
ADD COLUMN     "referencia_servico" TEXT,
ALTER COLUMN "documento" SET NOT NULL;

-- CreateTable
CREATE TABLE "telefones_cliente" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "telefones_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telefones_cliente_cliente_id_idx" ON "telefones_cliente"("cliente_id");

-- AddForeignKey
ALTER TABLE "telefones_cliente" ADD CONSTRAINT "telefones_cliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
