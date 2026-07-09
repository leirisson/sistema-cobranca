# Sprint 7 — Cobrança Avulsa (AVULSA, MVP v1.3)

> Status: concluída (2026-07-09) — implementada fora de ordem, sem depender da Sprint 6
> (Onboarding), que segue não iniciada; nenhum acoplamento real existia entre os dois módulos.
> Specs de referência: `api/specs/cobranca-avulsa/spec.md`, `rules.md`, `tasks.md`

## Objetivo

Permitir lançar uma cobrança pontual (valor/vencimento manuais) para um cliente, fora do
ciclo recorrente automático já existente, reaproveitando todo o pipeline de gateway/mensagens
já implementado — cobrindo o MVP v1.3 do documento original.

## Tasks

- [x] AVULSA-01 — Campo `origem`/`descricao` em `Cobranca` + migration
- [x] AVULSA-02 — `CriarCobrancaManualUseCase` (nome final, não `CriarCobrancaAvulsaUseCase` como rascunhado)
- [x] AVULSA-03 — `existeParaCicloVigente` só é chamada pelo fluxo recorrente; avulsa nunca passa por ela (garantia estrutural, não precisou de filtro por `origem`)
- [x] AVULSA-04 — Endpoint implementado como `POST /cobrancas` (`clienteId` no corpo, não `POST /clientes/:id/cobrancas-avulsas`)
- [x] AVULSA-05 — `DashboardCobrancaQuery` retorna `origem`/`descricao` (listagem e detalhe)
- [x] AVULSA-06 (frontend) — Ação "Nova cobrança" no FE-CAD (`/clientes/:id/nova-cobranca`)
- [x] AVULSA-07 (frontend) — Origem exibida no FE-DASH (badge na listagem + rótulo no detalhe)

## Critérios de conclusão da sprint

- [x] Todas as tasks AVULSA-01 a AVULSA-07 concluídas
- [x] Teste confirmando que cliente `INATIVO` bloqueia lançamento avulso (AVULSA-R-02) — `tests/integration/cobrancas.test.ts`
- [x] Validado que a régua de mensagens dispara para cobrança avulsa sem nenhuma mudança em MSG/EMAIL (rota chama `DispararLembreteInicialUseCase` do mesmo jeito que o fluxo recorrente)
- [ ] `contrato-api/endpoints.md` ainda não existe — pendência da Sprint 5 (contrato-api), não bloqueante para esta sprint
- [x] Validado ponta a ponta no navegador (Playwright): cobrança avulsa lançada aparece no dashboard com badge "AVULSA", descrição visível no detalhe, cliente de teste removido do banco depois
- [x] `api/specs/cobranca-avulsa/tasks.md` com os checkboxes marcados

## Próxima sprint

[Sprint 8 — Cancelamento e Reenvio Manual](sprint-08-cancelamento-reenvio.md), ainda depende
de [Sprint 6 — Onboarding](sprint-06-onboarding.md) não estar implementada? Não — nenhuma
dependência real de Onboarding foi encontrada; a ordem original (Onboarding → Avulsa →
Cancelamento/Reenvio) era só uma preferência de sequenciamento, não uma dependência técnica.
Próximo módulo natural pode ser Onboarding (Sprint 6) ou Cancelamento/Reenvio (Sprint 8),
o que o usuário priorizar.
