# Tasks — Dado Pessoal e LGPD (LGPD)

- [x] LGPD-01 — `ExcluirClienteDefinitivamenteUseCase` (`src/application/cliente/excluir-cliente-definitivamente-use-case.ts`): se cliente tem `Cobranca` associada (`CobrancaRepository.existePorClienteId`), anonimiza campos de PII via `Cliente.editar()`; se não tem, remove o registro fisicamente (`ClienteRepository.remover`, novo método na porta).
- [x] LGPD-02 — Endpoint `DELETE /clientes/:id` (distinto do `PATCH /clientes/:id/status` de inativação já existente), devolve `{ resultado: "REMOVIDO" | "ANONIMIZADO" }`. Documentado em `contrato-api/endpoints.md`.
- [x] LGPD-03 — Log de auditoria estruturado (Pino, `app.log.info`) na rota HTTP no momento da exclusão, com `{ clienteId, resultado }`, sem PII no corpo do log.
- [x] LGPD-04 — `api/specs/lgpd/base-legal.md`: base legal de tratamento (execução de contrato) e propósito de cada campo pessoal coletado.
- [x] LGPD-05 (frontend) — Ação "Excluir definitivamente" na tela de edição do cliente (FE-CAD), com confirmação explícita distinta do toggle de inativar já existente.
