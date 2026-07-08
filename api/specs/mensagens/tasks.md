# Tasks — Mensagens (MSG)

- [x] MSG-01 — Implementar template de lembrete + `DispararLembreteInicialUseCase` (disparo no momento da geração da cobrança)
- [x] MSG-02 — Implementar régua fixa (D0, D+1, D+3) via `DispararReguaAtrasoUseCase`
- [x] MSG-03 — Implementar checagem de status antes do disparo (nunca envia para `PAGO`/`CANCELADO`, dedup via `MensagemEnviadaRepository.existeParaCobrancaETipo`)
- [x] MSG-04 — Implementar entidade/tabela `MensagemEnviada`
- [ ] MSG-05 — Configurar log estruturado + painel de erros (integração com `dashboard`)

## Não feito ainda

- Job BullMQ que chama `DispararReguaAtrasoUseCase.executar()` num cron diário (mesma situação do job de `GerarCobrancaUseCase`, ainda não agendado)
- Wiring de `DispararLembreteInicialUseCase` a partir de `GerarCobrancaUseCase` (use case pronto e testado isoladamente, chamada explícita fica para quando o job cron for implementado)
- Painel de erros no `dashboard` (MSG-05, depende do módulo `dashboard`, não iniciado)
