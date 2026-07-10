-- CreateTable
CREATE TABLE "erros_geracao_cobranca" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "nome_cliente" TEXT NOT NULL,
    "mensagem_erro" TEXT NOT NULL,
    "ocorrido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erros_geracao_cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "erros_geracao_cobranca_ocorrido_em_idx" ON "erros_geracao_cobranca"("ocorrido_em");
