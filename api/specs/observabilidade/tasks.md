# Tasks — Observabilidade Operacional (OBS)

- [ ] OBS-01 — Nova env var opcional `ALERTA_OPERACIONAL_DESTINO` em `env.ts`/`.env.example`.
- [ ] OBS-02 — Implementar `AlertaOperacionalService`, reaproveitando `CanalMensagem`/`CanalNotificacao` já existentes; no-op silencioso se `ALERTA_OPERACIONAL_DESTINO` ausente.
- [ ] OBS-03 — Conectar o listener `"failed"` de `gerar-cobranca-job.ts` e `disparar-regua-atraso-job.ts` (`src/infra/queue/workers.ts`) para chamar o serviço de alerta, com `try/catch` isolado (falha no alerta não propaga).
- [ ] OBS-04 — Teste unitário: alerta é chamado no evento `"failed"`; teste garantindo que uma falha no envio do alerta não lança para fora do listener.
