# Tasks — Cancelamento de Cobrança (CANC)

- [x] CANC-01 — `GatewayPagamento` ganha `cancelarCobranca(gatewayChargeId)`; implementado em `AsaasGateway` via `DELETE /payments/:id` (confirmado contra a sandbox real do Asaas: resposta `{ deleted: true, id }`).
- [x] CANC-02 — `CancelarCobrancaUseCase` (`src/application/cobranca/cancelar-cobranca-use-case.ts`): busca por id, chama `cobranca.cancelar()`, tenta `GatewayPagamento.cancelarCobranca` (falha aqui não bloqueia o cancelamento local — try/catch silencioso, segue e persiste).
- [x] CANC-03 — Endpoint `PATCH /dashboard/cobrancas/:id/cancelar` (path escolhido no design: recurso já é o `dashboard`, mantém irmão de `GET /dashboard/cobrancas/:id`). Documentado em `contrato-api/endpoints.md`.
- [x] CANC-04 — Teste de regressão em `tests/integration/prisma-mensagem-enviada-repository.test.ts` (`exclui cobrança CANCELADO de listarPendentesOuAtrasadas`), banco Postgres real.
- [x] CANC-05 (frontend) — Botão "Cancelar cobrança" no detalhe da cobrança (`components/detalhe-cobranca.tsx`), com passo de confirmação inline antes de executar (ação destrutiva/irreversível pela UI).
