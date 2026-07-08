# Sprint 1 — Clientes (CAD)

> Status: concluída (2026-07-08)
> Depende de: nada (módulo base)
> Specs de referência: `api/specs/clientes/spec.md`, `api/specs/clientes/rules.md`, `api/specs/clientes/tasks.md`

## Objetivo

Ter o CRUD de cliente funcionando ponta a ponta seguindo DDD: entidade `Cliente` com invariantes protegidas, use cases orquestrando regras de negócio, repositório Prisma implementando a interface de domínio.

## Tasks

- [x] CAD-01 — Implementar `Cliente` (entidade) + `CriarClienteUseCase`
- [x] CAD-02 — Validar telefone (E.164) e dia de vencimento (1–28) na entidade `Cliente`
- [x] CAD-03 — Implementar `InativarClienteUseCase`
- [x] CAD-04 — Implementar `EditarClienteUseCase`
- [x] CAD-05 — Implementar `ClienteRepository.buscarPorNome`

## Critérios de conclusão da sprint

- [x] Todas as tasks CAD-01 a CAD-05 concluídas
- [x] Testes unitários de domínio/application cobrindo entidade e use cases (TDD, sem banco real) — 19 testes
- [x] Teste de integração do repositório Prisma (`tests/integration`) — 4 testes
- [x] Checklist do `claude.md` (seção 7.2) validado: lint, typecheck, migration aplicada
- [x] `api/specs/clientes/tasks.md` com os checkboxes marcados

## Próxima sprint

[Sprint 2 — Cobranças](sprint-02-cobrancas.md), que depende de `Cliente` já existir.
