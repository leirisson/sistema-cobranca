# Sprint 9 — Segurança Básica da API (SEC) + Dado Pessoal / LGPD (LGPD)

> Status: não iniciada
> Depende de: [Sprint 8 — Cancelamento e Reenvio](sprint-08-cancelamento-reenvio.md)
> Specs de referência: `api/specs/seguranca-api/{spec,rules,tasks}.md`, `api/specs/lgpd/{spec,rules,tasks}.md`

## Objetivo

Fechar como um adendo transversal de segurança/compliance os dois gaps 🔴 que faltavam:
rate limiting + CORS na API, e a capacidade de excluir definitivamente dados pessoais de um
cliente (hoje só existe inativar). Agrupados por serem ambos requisitos "de guarda-chuva"
sobre a API já existente, sem depender de nenhuma feature nova das sprints anteriores.

## Tasks

### Segurança (SEC)
- [ ] SEC-01 — Rate limit específico em `/auth/login`
- [ ] SEC-02 — Rate limit geral
- [ ] SEC-03 — CORS com allowlist
- [ ] SEC-04 — Teste de integração de rate limit
- [ ] SEC-05 — Documentar em `contrato-api/endpoints.md`

### LGPD
- [ ] LGPD-01 — `ExcluirClienteDefinitivamenteUseCase`
- [ ] LGPD-02 — Endpoint `DELETE /clientes/:id`
- [ ] LGPD-03 — Log de auditoria de exclusão
- [ ] LGPD-04 — Documento `base-legal.md`
- [ ] LGPD-05 (frontend) — Ação "Excluir definitivamente" no FE-CAD

## Critérios de conclusão da sprint

- [ ] Todas as tasks SEC-01 a SEC-05 e LGPD-01 a LGPD-05 concluídas
- [ ] Teste confirmando que a mensagem de erro do login continua genérica mesmo sob rate limit (SEC-R-04)
- [ ] Teste confirmando que exclusão de cliente com cobrança associada anonimiza em vez de apagar fisicamente (LGPD-R-01)
- [ ] `contrato-api/endpoints.md` atualizado
- [ ] Checklist do `claude.md` (seção 7.2) validado
- [ ] `api/specs/seguranca-api/tasks.md` e `api/specs/lgpd/tasks.md` com os checkboxes marcados

## Próxima sprint

[Sprint 10 — Observabilidade Operacional](sprint-10-observabilidade.md).
