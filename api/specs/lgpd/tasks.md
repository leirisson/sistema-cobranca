# Tasks — Dado Pessoal e LGPD (LGPD)

- [ ] LGPD-01 — Implementar `ExcluirClienteDefinitivamenteUseCase`: se cliente tem `Cobranca` associada, anonimiza campos de PII; se não tem, remove o registro fisicamente.
- [ ] LGPD-02 — Endpoint `DELETE /clientes/:id` (distinto do `PATCH /clientes/:id/status` de inativação já existente). Documentar em `contrato-api/endpoints.md`.
- [ ] LGPD-03 — Log de auditoria estruturado (Pino) no momento da exclusão, sem PII no corpo do log.
- [ ] LGPD-04 — Escrever `api/specs/lgpd/base-legal.md`: base legal de tratamento (execução de contrato) e propósito de cada campo pessoal coletado (documento apenas, sem código).
- [ ] LGPD-05 (frontend) — Ação "Excluir definitivamente" na tela do cliente (FE-CAD), com confirmação explícita distinta do toggle de inativar já existente.
