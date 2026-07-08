/*
  Warnings:

  - A unique constraint covering the columns `[gateway_charge_id]` on the table `cobrancas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cobrancas_gateway_charge_id_key" ON "cobrancas"("gateway_charge_id");
