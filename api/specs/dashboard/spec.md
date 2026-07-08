# Dashboard Básico
`spec.md` — fase SPECIFY

**ID do módulo:** `DASH`
**Escopo:** Small
**Depende de:** `clientes` (CAD), `cobrancas` (COB), `pagamentos` (PAG)

## Capturar o quê

### User Stories

**DASH-US-01 (P1)** — Como usuário do sistema, quero ver todas as cobranças do mês com seus status, para saber rapidamente quem pagou e quem não pagou.

**DASH-US-02 (P2)** — Como usuário do sistema, quero filtrar cobranças por status, para focar só nos atrasados quando eu precisar cobrar.

**DASH-US-03 (P2)** — Como usuário do sistema, quero ver totais consolidados (a receber, recebido, em atraso), para ter visão financeira rápida sem somar manualmente.

**DASH-US-04 (P3)** — Como usuário do sistema, quero buscar cobranças por nome do cliente, para encontrar rapidamente um caso específico.

### Requisitos (WHEN / THEN / SHALL)

- **DASH-R-01**: WHEN o usuário acessa o dashboard, THEN o sistema SHALL exibir todas as cobranças do mês corrente por padrão.
- **DASH-R-02**: WHEN o usuário aplica um filtro de status, THEN o sistema SHALL exibir apenas as cobranças que correspondem ao status selecionado.
- **DASH-R-03**: WHEN o dashboard é carregado, THEN o sistema SHALL calcular e exibir: total a receber (pendente + atrasado), total recebido (pago), total em atraso.
- **DASH-R-04**: WHEN o usuário busca por nome, THEN o sistema SHALL retornar cobranças de clientes cujo nome contém o termo buscado (case-insensitive).

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| DASH-01 | DASH-US-01 | DASH-R-01 | Endpoint de listagem de cobranças, frontend Next.js |
| DASH-02 | DASH-US-02 | DASH-R-02 | Filtro por `status` na query |
| DASH-03 | DASH-US-03 | DASH-R-03 | Agregação (soma por status) |
| DASH-04 | DASH-US-04 | DASH-R-04 | Busca por nome (join com `Cliente`) |

## Fora de escopo deste módulo
- Relatórios financeiros avançados / exportação CSV/PDF (v2)
- Fluxo de caixa projetado (v2)
- Painel de erros de emissão de nota fiscal (v3 — mas o painel de erro de mensagem/gateway do MVP v1 pode reaproveitar o mesmo componente visual)
