-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "asaas_api_key_cifrada" TEXT,
    "nome_remetente" TEXT,
    "confirmacao_pagamento_habilitada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);
