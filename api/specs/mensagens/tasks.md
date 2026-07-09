# Tasks — Mensagens (MSG)

- [x] MSG-01 — Implementar template de lembrete + `DispararLembreteInicialUseCase` (disparo no momento da geração da cobrança)
- [x] MSG-02 — Implementar régua fixa (D0, D+1, D+3) via `DispararReguaAtrasoUseCase`
- [x] MSG-03 — Implementar checagem de status antes do disparo (nunca envia para `PAGO`/`CANCELADO`, dedup via `MensagemEnviadaRepository.existeParaCobrancaETipo`)
- [x] MSG-04 — Implementar entidade/tabela `MensagemEnviada`
- [ ] MSG-05 — Configurar log estruturado + painel de erros (integração com `dashboard`)

## Não feito ainda

- Painel de erros no `dashboard` (MSG-05, depende do módulo `dashboard`, não iniciado)

## Feito nesta etapa (wiring dos jobs)

- Job BullMQ que chama `DispararReguaAtrasoUseCase.executar()` num cron diário (`src/infra/queue/disparar-regua-atraso-job.ts`, `0 9 * * *`, mesmo processo do Fastify)
- Wiring de `DispararLembreteInicialUseCase` a partir do job de `GerarCobrancaUseCase` (`src/infra/queue/gerar-cobranca-job.ts`): após gerar as cobranças do dia, dispara o lembrete inicial pra cada uma, isolando falha por cobrança (loga e continua, não derruba o worker)
