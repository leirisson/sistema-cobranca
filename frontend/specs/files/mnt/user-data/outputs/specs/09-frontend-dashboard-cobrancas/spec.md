# 09 — Frontend: Dashboard de Cobranças
`spec.md` — fase SPECIFY

**ID do módulo:** `FE-DASH`
**Escopo:** Medium
**Depende de:** `07-frontend-autenticacao` (FE-AUTH), `05-dashboard` (DASH, backend), `04-confirmacao-pagamento` (PAG)

## Capturar o quê

### User Stories

**FE-DASH-US-01 (P1)** — Como usuário do sistema, quero ver todas as cobranças do mês corrente ao abrir o painel, para ter visão imediata da situação financeira sem precisar navegar.

**FE-DASH-US-02 (P1)** — Como usuário do sistema, quero ver totais consolidados (a receber, recebido, em atraso) em destaque, para entender a saúde financeira num relance.

**FE-DASH-US-03 (P2)** — Como usuário do sistema, quero filtrar a lista de cobranças por status, para focar só nos atrasados quando for cobrar manualmente.

**FE-DASH-US-04 (P2)** — Como usuário do sistema, quero abrir o detalhe de uma cobrança específica, para ver o histórico de mensagens enviadas para aquele cliente.

**FE-DASH-US-05 (P3)** — Como usuário do sistema, quero navegar entre meses anteriores, para consultar cobranças que não são do mês corrente.

### Requisitos (WHEN / THEN / SHALL)

- **FE-DASH-R-01**: WHEN o usuário abre o dashboard, THEN o sistema SHALL exibir, por padrão, as cobranças do mês corrente ordenadas por vencimento.
- **FE-DASH-R-02**: WHEN os dados são carregados, THEN o sistema SHALL exibir 3 cards de resumo: total a receber, total recebido, total em atraso — calculados a partir da mesma lista exibida.
- **FE-DASH-R-03**: WHEN o usuário seleciona um filtro de status, THEN o sistema SHALL atualizar tanto a lista quanto os cards de resumo de acordo com o filtro ativo.
- **FE-DASH-R-04**: WHEN o usuário clica em uma cobrança, THEN o sistema SHALL abrir uma visão de detalhe mostrando cliente, valor, status, link de pagamento e histórico de mensagens enviadas (módulo MSG/EMAIL).
- **FE-DASH-R-05**: WHEN não há cobranças no filtro/mês selecionado, THEN o sistema SHALL exibir um estado vazio claro (não uma tabela em branco sem explicação).
- **FE-DASH-R-06**: WHEN o usuário navega para um mês anterior, THEN o sistema SHALL carregar as cobranças correspondentes àquele período.

### Telas previstas
- `/dashboard` — visão principal: cards de resumo + lista/tabela de cobranças + filtro de status + seletor de mês
- `/dashboard/cobrancas/[id]` — detalhe de uma cobrança individual

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| FE-DASH-01 | FE-DASH-US-01 | FE-DASH-R-01 | Página `/dashboard`, consumo de endpoint de listagem (módulo DASH) |
| FE-DASH-02 | FE-DASH-US-02 | FE-DASH-R-02 | Cards de resumo (cálculo client-side ou vindo pronto da API) |
| FE-DASH-03 | FE-DASH-US-03 | FE-DASH-R-03 | Filtro de status sincronizado entre lista e cards |
| FE-DASH-04 | FE-DASH-US-04 | FE-DASH-R-04 | Página `/dashboard/cobrancas/[id]` |
| FE-DASH-05 | — | FE-DASH-R-05 | Componente de estado vazio |
| FE-DASH-06 | FE-DASH-US-05 | FE-DASH-R-06 | Seletor de mês/período |

## Fora de escopo deste módulo
- Gráficos/visualizações de fluxo de caixa projetado (v2)
- Exportação CSV/PDF (v2)
- Reenvio manual de mensagem/cobrança pela interface (útil, mas fica como extensão possível do v1.1/v2 — v1 trata isso via reprocessamento no backend/log)
