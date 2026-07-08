# Sprints — MVP v1 (CobraCerta)

Divisão da implementação do MVP v1 em sprints sequenciais, seguindo a ordem de dependência de módulos definida em `api/specs/_geral/rules.md` (seção 10).

| Sprint | Módulo(s) | Prefixo(s) | Depende de | Status |
|---|---|---|---|---|
| [1](sprint-01-clientes.md) | Clientes | CAD | — | não iniciada |
| [2](sprint-02-cobrancas.md) | Cobranças | COB | Sprint 1 | não iniciada |
| [3](sprint-03-mensagens-email-pagamentos.md) | Mensagens, Notificações por E-mail, Pagamentos | MSG, EMAIL, PAG | Sprint 2 | não iniciada |
| [4](sprint-04-dashboard.md) | Dashboard | DASH | Sprints 1, 2, 3 | não iniciada |

Cada arquivo de sprint referencia as specs do(s) módulo(s) (`spec.md`, `rules.md`, `tasks.md` em `api/specs/<módulo>/`) e replica as tasks com o mesmo ID de rastreabilidade, para marcar o progresso em dois lugares (sprint e spec do módulo) sem divergência de escopo.

Ao concluir uma sprint, atualizar:
1. Os checkboxes no arquivo da sprint e no `tasks.md` do(s) módulo(s) correspondente(s)
2. A seção 10 (Linha do Tempo do Projeto) do `claude.md` na raiz do repo
3. O status na tabela acima
