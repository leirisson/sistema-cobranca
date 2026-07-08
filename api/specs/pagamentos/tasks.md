# Tasks — Pagamentos (PAG)

> Sprint 3 (PAG) concluída via TDD. Ver `api/sprints/sprint-03-mensagens-email-pagamentos.md`.

- [x] PAG-01 — Implementar endpoint de webhook (`POST /webhooks/asaas`) + `ConfirmarPagamentoUseCase` usando `Cobranca.marcarComoPaga`
- [x] PAG-02 — Implementar validação de `ASAAS_WEBHOOK_TOKEN` (header `asaas-access-token`, rejeita com 401 sem tocar na cobrança)
- [x] PAG-03 — Máquina de estados da entidade `Cobranca` (Sprint 2) reaproveitada; `ConfirmarPagamentoUseCase` trata idempotência (PAGO/CANCELADO → ignora sem erro) antes de chamar a entidade
- [x] PAG-04 — Toggle `CONFIRMACAO_PAGAMENTO_HABILITADA` implementado com porta `NotificadorConfirmacao`; disparo real via `MensagemNotificadorConfirmacao` (infra, módulo `mensagens`/`notificacoes-email`), WhatsApp com fallback automático por e-mail
