# Sprints — MVP v1 (CobraCerta)

Divisão da implementação do MVP v1 em sprints sequenciais, seguindo a ordem de dependência de módulos definida em `api/specs/_geral/rules.md` (seção 10).

| Sprint | Módulo(s) | Prefixo(s) | Depende de | Status |
|---|---|---|---|---|
| [1](sprint-01-clientes.md) | Clientes | CAD | — | concluída |
| [2](sprint-02-cobrancas.md) | Cobranças | COB | Sprint 1 | concluída |
| [3](sprint-03-mensagens-email-pagamentos.md) | Mensagens, Notificações por E-mail, Pagamentos | MSG, EMAIL, PAG | Sprint 2 | concluída |
| [4](sprint-04-dashboard.md) | Dashboard (backend) | DASH | Sprints 1, 2, 3 | concluída |
| [5](sprint-05-contrato-api.md) | Contrato de API | API | Sprint 4 | concluída |
| [6](sprint-06-onboarding.md) | Onboarding / Configurações | ONB | Sprint 5 | concluída |
| [7](sprint-07-cobranca-avulsa.md) | Cobrança Avulsa (MVP v1.3) | AVULSA | Sprint 6 (implementada fora de ordem, sem dependência real de Onboarding) | concluída |
| [8](sprint-08-cancelamento-reenvio.md) | Cancelamento de Cobrança + Reenvio Manual de Mensagem | CANC, REENVIO | Sprint 7 | não iniciada |
| [9](sprint-09-seguranca-lgpd.md) | Segurança Básica da API + Dado Pessoal/LGPD | SEC, LGPD | Sprint 8 | não iniciada |
| [10](sprint-10-observabilidade.md) | Observabilidade Operacional | OBS | Sprint 9 | não iniciada |

Sprints 5 a 10 nascem da Análise de Gaps e do MVP v1.3 documentados em
`api/SistemaDeCobrançaAutomática.md`, planejadas em 2026-07-09. Cada uma segue a mesma
convenção das sprints 1-4: specs em `api/specs/<módulo>/{spec,rules,tasks}.md`, com IDs de
rastreabilidade próprios (`API-*`, `ONB-*`, `AVULSA-*`, `CANC-*`, `REENVIO-*`, `SEC-*`,
`LGPD-*`, `OBS-*`).

Cada arquivo de sprint referencia as specs do(s) módulo(s) (`spec.md`, `rules.md`, `tasks.md` em `api/specs/<módulo>/`) e replica as tasks com o mesmo ID de rastreabilidade, para marcar o progresso em dois lugares (sprint e spec do módulo) sem divergência de escopo.

Ao concluir uma sprint, atualizar:
1. Os checkboxes no arquivo da sprint e no `tasks.md` do(s) módulo(s) correspondente(s)
2. A seção 10 (Linha do Tempo do Projeto) do `claude.md` na raiz do repo
3. O status na tabela acima
