# Sprint 2 — Cobranças (COB)

> Status: concluída
> Depende de: [Sprint 1 — Clientes](sprint-01-clientes.md) (`Cliente` precisa existir para gerar cobrança)
> Specs de referência: `api/specs/cobrancas/spec.md`, `api/specs/cobrancas/rules.md`, `api/specs/cobrancas/tasks.md`

## Objetivo

Gerar cobrança automaticamente via job agendado (BullMQ), integrando com o gateway de pagamento (Asaas) através de uma porta de domínio — sem acoplar regra de negócio ao SDK/HTTP do Asaas.

## Tasks

- [x] COB-01 — Implementar `GerarCobrancaUseCase`; job agendado via BullMQ (`gerar-cobranca-job.ts`, cron diário `0 8 * * *`)
- [x] COB-02 — Implementar config `COBRANCA_ANTECEDENCIA_DIAS`
- [x] COB-03 — Implementar porta `GatewayPagamento`; adapter real `AsaasGateway` testado contra a sandbox do Asaas
- [x] COB-04 — Implementar checagem de duplicidade em `CobrancaRepository`
- [x] COB-05 — Isolamento de falha por cliente + `ErroGeracaoCobranca` (registro persistido, não só log) + `GET /dashboard/erros`; fechado na Sprint 10 (Observabilidade), junto de MSG-05, ver `sprint-10-observabilidade.md`

## Critérios de conclusão da sprint

- [x] Todas as tasks COB-01 a COB-05 concluídas
- [x] `AsaasGateway` testado contra sandbox do Asaas antes de qualquer teste com dinheiro real (regra `_geral/rules.md` seção 4)
- [x] Testes unitários de domínio/application com fake de `GatewayPagamento` (sem chamar Asaas real)
- [x] Teste de integração do job BullMQ (worker + scheduler) e do webhook de geração
- [x] Nenhuma regra de negócio dependendo diretamente do SDK/HTTP do Asaas
- [x] Checklist do `claude.md` (seção 7.2) validado
- [x] `api/specs/cobrancas/tasks.md` com os checkboxes marcados

## Próxima sprint

[Sprint 3 — Mensagens, Notificações por E-mail e Pagamentos](sprint-03-mensagens-email-pagamentos.md), que depende de `Cobranca` já existir.
