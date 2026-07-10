# Sprint 10 — Observabilidade Operacional (OBS)

> Status: concluída
> Depende de: [Sprint 9 — Segurança e LGPD](sprint-09-seguranca-lgpd.md)
> Specs de referência: `api/specs/observabilidade/spec.md`, `rules.md`, `tasks.md`

## Objetivo

Garantir que uma falha silenciosa do job diário de geração de cobrança ou da régua de
mensagens (Redis fora do ar, erro não tratado) gere um alerta para o usuário, não só um log
que ninguém vai ler proativamente. Última sprint planejada nesta rodada — fecha a Análise de
Gaps por completo (junto com o seed de usuário, já resolvido, e o `design.md` por módulo,
que passa a ser tarefa de processo recorrente, não uma sprint própria).

## Tasks

- [x] OBS-01 — Env var opcional `ALERTA_OPERACIONAL_DESTINO`
- [x] OBS-02 — `AlertaOperacionalService`, reaproveitando canais existentes
- [x] OBS-03 — Conectar ao listener `"failed"` dos dois workers (BullMQ)
- [x] OBS-04 — Testes unitários (alerta disparado, falha no alerta não propaga)

## Pendências herdadas fechadas nesta sprint (COB-05, MSG-05)

Ao auditar o estado real das sprints do backend, ficou claro que `COB-05` (Sprint 2) e
`MSG-05` (Sprint 3) tinham ficado parcialmente pendentes desde suas sprints originais — o
"painel de erros (integração com `dashboard`)" que ambas previam nunca foi implementado, só
o log estruturado via Pino. Como essa pendência é exatamente o tipo de gap que a Sprint 10
(Observabilidade) existe para fechar, as duas foram completadas aqui, junto de OBS-01 a
OBS-04:

- **COB-05** — `GerarCobrancaUseCase.executar()` passou a isolar a falha do gateway por
  cliente (antes, 1 cliente com erro interrompia o processamento dos clientes seguintes
  também), persistindo `ErroGeracaoCobranca` (nova tabela `erros_geracao_cobranca`) em vez de
  só deixar a exceção propagar sem registro nenhum. Retorno do use case mudou de
  `Promise<Cobranca[]>` para `Promise<{ cobrancasGeradas, errosOcorridos }>`. O job
  (`gerar-cobranca-job.ts`) agora chama `AlertaOperacionalService` também quando há
  `errosOcorridos`, não só quando o worker inteiro falha — falha parcial de 1 cliente não
  derruba mais o job, então precisava do próprio gatilho de alerta.
- **MSG-05** — `DashboardCobrancaQuery.listarMensagensComFalha` (novo método) filtra
  `MensagemEnviada` por `statusEnvio: "FALHA"`, reaproveitando a tabela já existente (sem
  migration).
- Ambos expostos juntos em `GET /dashboard/erros` (`BuscarErrosOperacionaisUseCase`), última
  peça que faltava pro "painel de erros" previsto desde a Sprint 2/3. Ver
  `contrato-api/endpoints.md`.

## Critérios de conclusão da sprint

- [x] Todas as tasks OBS-01 a OBS-04 concluídas
- [x] Teste confirmando que a ausência de `ALERTA_OPERACIONAL_DESTINO` não quebra o worker (OBS-R-02)
- [x] Teste confirmando que falha ao enviar o alerta não propaga exceção para fora do listener (OBS-R-04)
- [x] Validado manualmente: forçar falha de um job e confirmar recebimento do alerta no canal configurado
- [x] COB-05 e MSG-05 (pendências herdadas) fechadas e validadas contra a sandbox real do Asaas
- [x] Checklist do `claude.md` (seção 7.2) validado
- [x] `api/specs/observabilidade/tasks.md`, `api/specs/cobrancas/tasks.md` e `api/specs/mensagens/tasks.md` com os checkboxes marcados

## Próxima sprint

Nenhuma sprint de backend planejada além desta nesta rodada. Próximo passo natural: sprints
de frontend equivalentes (`frontend/sprints/sprint-04-fe-onboarding.md` em diante) e revisão
de escopo do MVP v2.
