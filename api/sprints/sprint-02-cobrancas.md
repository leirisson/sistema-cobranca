# Sprint 2 — Cobranças (COB)

> Status: em andamento — núcleo DDD (TDD) concluído; job BullMQ e `AsaasGateway` real pendentes
> Depende de: [Sprint 1 — Clientes](sprint-01-clientes.md) (`Cliente` precisa existir para gerar cobrança)
> Specs de referência: `api/specs/cobrancas/spec.md`, `api/specs/cobrancas/rules.md`, `api/specs/cobrancas/tasks.md`

## Objetivo

Gerar cobrança automaticamente via job agendado (BullMQ), integrando com o gateway de pagamento (Asaas) através de uma porta de domínio — sem acoplar regra de negócio ao SDK/HTTP do Asaas.

## Tasks

- [x] COB-01 — Implementar `GerarCobrancaUseCase` (job agendado/BullMQ ainda não implementado)
- [x] COB-02 — Implementar config `COBRANCA_ANTECEDENCIA_DIAS`
- [~] COB-03 — Implementar porta `GatewayPagamento` (adapter `AsaasGateway` real ainda não implementado)
- [x] COB-04 — Implementar checagem de duplicidade em `CobrancaRepository`
- [ ] COB-05 — Configurar log estruturado + painel de erros (integração com `dashboard`)

## Critérios de conclusão da sprint

- [ ] Todas as tasks COB-01 a COB-05 concluídas (falta COB-05 e finalizar COB-01/COB-03 com job real + AsaasGateway real)
- [ ] `AsaasGateway` testado contra sandbox do Asaas antes de qualquer teste com dinheiro real (regra `_geral/rules.md` seção 4)
- [x] Testes unitários de domínio/application com fake de `GatewayPagamento` (sem chamar Asaas real)
- [ ] Teste de integração do job BullMQ e do webhook de geração
- [x] Nenhuma regra de negócio dependendo diretamente do SDK/HTTP do Asaas
- [ ] Checklist do `claude.md` (seção 7.2) validado
- [x] `api/specs/cobrancas/tasks.md` com os checkboxes marcados (parcialmente — ver `[~]`)

## Próxima sprint

[Sprint 3 — Mensagens, Notificações por E-mail e Pagamentos](sprint-03-mensagens-email-pagamentos.md), que depende de `Cobranca` já existir.
