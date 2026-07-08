-- CreateEnum
CREATE TYPE "status_cliente" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "status_cobranca" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "tipo_mensagem" AS ENUM ('LEMBRETE', 'VENCIMENTO', 'ATRASO', 'CONFIRMACAO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "documento" TEXT,
    "valor_cobranca" DECIMAL(10,2) NOT NULL,
    "dia_vencimento" INTEGER NOT NULL,
    "status" "status_cliente" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobrancas" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "status" "status_cobranca" NOT NULL DEFAULT 'PENDENTE',
    "gateway_charge_id" TEXT,
    "link_pagamento" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobrancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens_enviadas" (
    "id" TEXT NOT NULL,
    "cobranca_id" TEXT NOT NULL,
    "tipo" "tipo_mensagem" NOT NULL,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_envio" TEXT NOT NULL,

    CONSTRAINT "mensagens_enviadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cobrancas_cliente_id_idx" ON "cobrancas"("cliente_id");

-- CreateIndex
CREATE INDEX "cobrancas_status_idx" ON "cobrancas"("status");

-- CreateIndex
CREATE INDEX "mensagens_enviadas_cobranca_id_idx" ON "mensagens_enviadas"("cobranca_id");

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens_enviadas" ADD CONSTRAINT "mensagens_enviadas_cobranca_id_fkey" FOREIGN KEY ("cobranca_id") REFERENCES "cobrancas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
