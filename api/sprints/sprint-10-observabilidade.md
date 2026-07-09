# Sprint 10 — Observabilidade Operacional (OBS)

> Status: não iniciada
> Depende de: [Sprint 9 — Segurança e LGPD](sprint-09-seguranca-lgpd.md)
> Specs de referência: `api/specs/observabilidade/spec.md`, `rules.md`, `tasks.md`

## Objetivo

Garantir que uma falha silenciosa do job diário de geração de cobrança ou da régua de
mensagens (Redis fora do ar, erro não tratado) gere um alerta para o usuário, não só um log
que ninguém vai ler proativamente. Última sprint planejada nesta rodada — fecha a Análise de
Gaps por completo (junto com o seed de usuário, já resolvido, e o `design.md` por módulo,
que passa a ser tarefa de processo recorrente, não uma sprint própria).

## Tasks

- [ ] OBS-01 — Env var opcional `ALERTA_OPERACIONAL_DESTINO`
- [ ] OBS-02 — `AlertaOperacionalService`, reaproveitando canais existentes
- [ ] OBS-03 — Conectar ao listener `"failed"` dos dois workers (BullMQ)
- [ ] OBS-04 — Testes unitários (alerta disparado, falha no alerta não propaga)

## Critérios de conclusão da sprint

- [ ] Todas as tasks OBS-01 a OBS-04 concluídas
- [ ] Teste confirmando que a ausência de `ALERTA_OPERACIONAL_DESTINO` não quebra o worker (OBS-R-02)
- [ ] Teste confirmando que falha ao enviar o alerta não propaga exceção para fora do listener (OBS-R-04)
- [ ] Validado manualmente: forçar falha de um job e confirmar recebimento do alerta no canal configurado
- [ ] Checklist do `claude.md` (seção 7.2) validado
- [ ] `api/specs/observabilidade/tasks.md` com os checkboxes marcados

## Próxima sprint

Nenhuma sprint de backend planejada além desta nesta rodada. Próximo passo natural: sprints
de frontend equivalentes (`frontend/sprints/sprint-04-fe-onboarding.md` em diante) e revisão
de escopo do MVP v2.
