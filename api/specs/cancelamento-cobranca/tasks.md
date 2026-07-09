# Tasks — Cancelamento de Cobrança (CANC)

- [ ] CANC-01 — `GatewayPagamento` ganha `cancelarCobranca(gatewayChargeId)`; implementar em `AsaasGateway` (verificar endpoint real de cancelamento/estorno na documentação do Asaas antes de implementar).
- [ ] CANC-02 — Implementar `CancelarCobrancaUseCase` (`src/application/cobranca/`): busca por id, chama `cobranca.cancelar()`, tenta `GatewayPagamento.cancelarCobranca` (falha aqui não bloqueia o cancelamento local — loga e segue), persiste.
- [ ] CANC-03 — Endpoint `PATCH /dashboard/cobrancas/:id/cancelar` (ou `POST /cobrancas/:id/cancelar`, decidir path no design). Documentar em `contrato-api/endpoints.md`.
- [ ] CANC-04 — Teste de regressão confirmando que `listarPendentesOuAtrasadas` continua excluindo `CANCELADO` (guarda contra quebra futura, CANC-R-03).
- [ ] CANC-05 (frontend) — Botão "Cancelar cobrança" no detalhe da cobrança (FE-DASH), com confirmação antes de executar (ação destrutiva/irreversível pela UI).
