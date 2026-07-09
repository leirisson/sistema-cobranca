# Tasks — Cobranças (COB)

> Núcleo DDD + adapter HTTP real do Asaas + job BullMQ implementados via TDD.

- [x] COB-01 — Implementar `GerarCobrancaUseCase` (`src/application/cobranca/gerar-cobranca-use-case.ts`), retornando as `Cobranca[]` geradas. Job agendado via BullMQ (`src/infra/queue/gerar-cobranca-job.ts`, cron diário `0 8 * * *`, mesmo processo do Fastify).
- [x] COB-02 — Config `COBRANCA_ANTECEDENCIA_DIAS` já existia em `env.ts`; `GerarCobrancaUseCase` recebe o valor via construtor.
- [x] COB-03 — Porta `GatewayPagamento` implementada (`src/domain/cobranca/gateway-pagamento.ts`) e testada com `FakeGatewayPagamento`. Adapter real `AsaasGateway` (`src/infra/gateways/asaas-gateway.ts`, HTTP direto via `fetch` contra `POST /v3/payments`) busca/cria customer no Asaas on-the-fly por `cpfCnpj` (sem novo campo em `Cliente`/schema — decisão explícita do usuário).
- [x] COB-04 — Checagem de duplicidade em `CobrancaRepository.existeParaCicloVigente` (fake em memória + `PrismaCobrancaRepository`, ciclo = mês/ano do vencimento, ignora cobranças `CANCELADO`).
- [ ] COB-05 — Log estruturado + painel de erros (integração com `dashboard`) — não iniciado.
