# Sprint 5 — Contrato de API (API)

> Status: concluída (2026-07-09)
> Depende de: [Sprint 4 — Dashboard](sprint-04-dashboard.md) (documenta as rotas dos módulos já implementados: CAD, COB, MSG, EMAIL, PAG, DASH, AUTH)
> Specs de referência: `api/specs/contrato-api/spec.md`, `rules.md`, `tasks.md`

## Objetivo

Documentar em um único lugar (`api/specs/contrato-api/endpoints.md`) todas as rotas HTTP já
implementadas — método, autenticação, request/response, erros — antes de qualquer sprint
nova (onboarding, cancelamento, reenvio) adicionar rotas a mais sem um contrato formal de
referência.

## Tasks

- [x] API-01 — Escrever `endpoints.md` documentando as rotas já existentes
- [x] API-02 — Adicionar item ao checklist padrão (`claude.md` seção 7.2) e às tasks dos módulos futuros

## Critérios de conclusão da sprint

- [x] `endpoints.md` cobre 100% das rotas hoje implementadas (`/health`, `/auth/login`, `/webhooks/asaas`, `/dashboard/cobrancas`, `/dashboard/cobrancas/:id`, `/clientes`, `/clientes/:id`, `/clientes/:id/status`, `/cobrancas`)
- [x] Checklist do `claude.md` (seção 7.2) atualizado com o novo item
- [x] `api/specs/contrato-api/tasks.md` com os checkboxes marcados

## Nota de execução

A lista de rotas do escopo original (linha 21) não incluía `POST /cobrancas` (módulo
`cobranca-avulsa`, MVP v1.3) — essa rota já estava implementada e registrada em `app.ts`
desde a Sprint 7 (backend)/Sprint 5 (frontend), mas nunca tinha sido adicionada à tabela de
rotas do `claude.md` §4.3. Incluída no `endpoints.md` (9 rotas documentadas, não 8) e no
`claude.md`, conforme API-R-04 (código é sempre a fonte de verdade).

## Próxima sprint

[Sprint 6 — Onboarding / Configurações](sprint-06-onboarding.md), primeira feature nova a
já nascer documentada no contrato.
