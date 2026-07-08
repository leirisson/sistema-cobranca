# Tasks — Cobranças (COB)

> Fase TASKS: núcleo DDD (domínio + application + repositório Prisma) implementado via TDD.
> Job BullMQ e adapter HTTP real do Asaas ficam para a próxima etapa desta sprint (ver observações).

- [x] COB-01 — Implementar `GerarCobrancaUseCase` (`src/application/cobranca/gerar-cobranca-use-case.ts`). Job agendado (BullMQ) ainda **não implementado** — falta apenas o wrapper que chama `useCase.executar(new Date())` num cron diário.
- [x] COB-02 — Config `COBRANCA_ANTECEDENCIA_DIAS` já existia em `env.ts`; `GerarCobrancaUseCase` recebe o valor via construtor.
- [~] COB-03 — Porta `GatewayPagamento` implementada (`src/domain/cobranca/gateway-pagamento.ts`) e testada com `FakeGatewayPagamento`. Adapter `AsaasGateway` (HTTP real contra sandbox) **ainda não implementado**.
- [x] COB-04 — Checagem de duplicidade em `CobrancaRepository.existeParaCicloVigente` (fake em memória + `PrismaCobrancaRepository`, ciclo = mês/ano do vencimento, ignora cobranças `CANCELADO`).
- [ ] COB-05 — Log estruturado + painel de erros (integração com `dashboard`) — não iniciado.
