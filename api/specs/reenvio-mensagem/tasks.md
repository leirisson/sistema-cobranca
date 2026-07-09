# Tasks — Reenvio Manual de Mensagem (REENVIO)

- [ ] REENVIO-01 — Implementar `ReenviarMensagemUseCase` (`src/application/mensagem/`): recebe o id da `MensagemEnviada` original com `FALHA`, valida que a cobrança não está `PAGO`/`CANCELADO`, reconstrói o texto pelo `tipo` original, reenvia pelo mesmo canal, persiste novo registro.
- [ ] REENVIO-02 — Endpoint `POST /dashboard/cobrancas/:id/mensagens/:mensagemId/reenviar`. Documentar em `contrato-api/endpoints.md`.
- [ ] REENVIO-03 (frontend) — Botão "Reenviar" ao lado de cada item `FALHA` no histórico de mensagens do detalhe da cobrança (FE-DASH), com feedback de sucesso/nova falha.
