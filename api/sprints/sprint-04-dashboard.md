# Sprint 4 — Dashboard (DASH)

> Status: não iniciada
> Depende de: [Sprint 1 — Clientes](sprint-01-clientes.md), [Sprint 2 — Cobranças](sprint-02-cobrancas.md), [Sprint 3 — Pagamentos](sprint-03-mensagens-email-pagamentos.md)
> Specs de referência: `api/specs/dashboard/spec.md`, `api/specs/dashboard/rules.md`, `api/specs/dashboard/tasks.md`

## Objetivo

Entregar a visão consolidada do MVP v1: listagem de cobranças do mês com status, filtros, totais agregados e busca por cliente — fechando o critério de aceite "usuário acompanha tudo pelo dashboard" (`mvp-v1.md` seção 5.7).

## Tasks

- [ ] DASH-01 — Implementar endpoint de listagem de cobranças + frontend Next.js
- [ ] DASH-02 — Implementar filtro por `status` na query
- [ ] DASH-03 — Implementar agregação de totais (soma por status)
- [ ] DASH-04 — Implementar busca por nome (join com `Cliente`)

## Critérios de conclusão da sprint

- [ ] Todas as tasks DASH-01 a DASH-04 concluídas
- [ ] Dashboard mostra corretamente pendentes, pagos e atrasados do mês (critério de aceite do MVP v1)
- [ ] Filtro por status e busca por cliente testados via integração (fastify.inject)
- [ ] Checklist do `claude.md` (seção 7.2) validado
- [ ] `api/specs/dashboard/tasks.md` com os checkboxes marcados

## Após esta sprint

MVP v1 completo — todos os critérios de aceite de `api/mvp-v1/mvp-v1.md` (seção 7) devem estar satisfeitos. Próximo passo natural: revisar escopo do MVP v2 (`api/mvp-v2/mvp-v2.md`).
