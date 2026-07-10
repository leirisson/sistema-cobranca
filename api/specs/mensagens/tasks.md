# Tasks — Mensagens (MSG)

- [x] MSG-01 — Implementar template de lembrete + `DispararLembreteInicialUseCase` (disparo no momento da geração da cobrança)
- [x] MSG-02 — Implementar régua fixa (D0, D+1, D+3) via `DispararReguaAtrasoUseCase`
- [x] MSG-03 — Implementar checagem de status antes do disparo (nunca envia para `PAGO`/`CANCELADO`, dedup via `MensagemEnviadaRepository.existeParaCobrancaETipo`)
- [x] MSG-04 — Implementar entidade/tabela `MensagemEnviada`
- [x] MSG-05 — `DashboardCobrancaQuery.listarMensagensComFalha` (`PrismaDashboardCobrancaQuery`, join com `Cobranca`/`Cliente` para trazer `nomeCliente`) filtra `MensagemEnviada` por `statusEnvio: "FALHA"`, reaproveitando a tabela já existente (sem migration nova). Exposto via `GET /dashboard/erros` (`BuscarErrosOperacionaisUseCase`), junto dos erros de geração de cobrança de COB-05 (`contrato-api/endpoints.md`). Cada item pode ser reenviado pelo endpoint já existente `POST /dashboard/cobrancas/:id/mensagens/:mensagemId/reenviar` (módulo REENVIO).

## Não feito ainda

- Nenhuma pendência de escopo — MSG-01 a MSG-05 concluídas.

## Feito nesta etapa (wiring dos jobs)

- Job BullMQ que chama `DispararReguaAtrasoUseCase.executar()` num cron diário (`src/infra/queue/disparar-regua-atraso-job.ts`, `0 9 * * *`, mesmo processo do Fastify)
- Wiring de `DispararLembreteInicialUseCase` a partir do job de `GerarCobrancaUseCase` (`src/infra/queue/gerar-cobranca-job.ts`): após gerar as cobranças do dia, dispara o lembrete inicial pra cada uma, isolando falha por cobrança (loga e continua, não derruba o worker)
