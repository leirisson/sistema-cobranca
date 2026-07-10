# Sprints — Frontend CobraCerta

> Convenção espelhada em `api/sprints/`: 1 arquivo por sprint, tasks em checklist,
> critérios de conclusão e "próximo passo" no fim. Cada sprint referencia os specs
> em `frontend/specs/` (`spec.md`/`design.md` por módulo) e, quando aplicável, o
> gap de API correspondente descrito lá.

## Ordem e dependências

```
Sprint 0 — Backend: fecha gaps de API (auth + rotas HTTP de clientes)
        ↓
Sprint 1 — FE-AUTH  (login, sessão, logout)
        ↓
Sprint 2 — FE-CAD   (gestão de clientes)
        ↓
Sprint 3 — FE-DASH  (dashboard de cobranças)
        ↓
Sprint 4 — FE-ONB   (onboarding / configurações)
        ↓
Sprint 5 — FE-AVULSA (cobrança avulsa, MVP v1.3)
        ↓
Sprint 6 — FE-CANC + FE-REENVIO (cancelamento + reenvio manual)
        ↓
Sprint 7 — FE-OBS (painel de erros operacionais)
```

Sprints 4 a 6 nascem da Análise de Gaps e do MVP v1.3 (`api/SistemaDeCobrançaAutomática.md`,
planejamento de 2026-07-09) e dependem das sprints de backend equivalentes (6 a 8, ver
`api/sprints/README.md`) para os endpoints existirem antes de consumidos aqui.

Ordem escolhida (decisão explícita do usuário, 2026-07-09): resolver os gaps de
API no backend **antes** de iniciar qualquer sprint de frontend, em vez de seguir
a ordem `07→08→09` dos specs e esbarrar no gap no meio de cada sprint. O único
módulo que não tem gap de API hoje é `09-frontend-dashboard-cobrancas`
(`GET /dashboard/cobrancas` já existe), mas ele foi mantido por último para
preservar a ordem de dependência lógica do frontend (auth → dados do cliente →
visão consolidada).

## Sprints

| Sprint | Módulo | Depende de | Status |
|---|---|---|---|
| [Sprint 0 — Backend: gaps de API](sprint-00-backend-gaps-api.md) | — (backend) | Nenhuma | Concluída |
| [Sprint 1 — FE-AUTH](sprint-01-fe-auth.md) | `07-frontend-autenticacao` | Sprint 0 | Concluída |
| [Sprint 2 — FE-CAD](sprint-02-fe-cad.md) | `08-frontend-gestao-clientes` | Sprint 0, Sprint 1 | Concluída |
| [Sprint 3 — FE-DASH](sprint-03-fe-dash.md) | `09-frontend-dashboard-cobrancas` | Sprint 1 | Concluída |
| [Sprint 4 — FE-ONB](sprint-04-fe-onboarding.md) | `onboarding` (backend) | Sprint 3, backend Sprint 6 | Concluída (implementada fora de ordem) |
| [Sprint 5 — FE-AVULSA](sprint-05-fe-avulsa.md) | `cobranca-avulsa` (backend) | Sprint 4, backend Sprint 7 (implementada fora de ordem) | Concluída |
| [Sprint 6 — FE-CANC + FE-REENVIO](sprint-06-fe-canc-reenvio.md) | `cancelamento-cobranca` + `reenvio-mensagem` (backend) | Sprint 5, backend Sprint 8 | Concluída (implementada fora de ordem) |
| [Sprint 7 — FE-OBS](sprint-07-fe-erros-operacionais.md) | `observabilidade`, `cobrancas` (COB-05), `mensagens` (MSG-05) (backend) | Sprint 6, backend Sprint 10 | Concluída |

> **Nota de auditoria (2026-07-10):** as Sprints 4 e 6 estavam marcadas "Não iniciada" apesar
> do código já existir — mesmo desalinhamento documental já visto na Sprint 5 (implementação
> aconteceu junto do backend correspondente, mas o status da sprint de frontend nunca foi
> atualizado). Corrigido nesta data, sem nenhuma mudança de código; ver a "Nota de auditoria"
> em cada arquivo de sprint para o detalhe do que foi conferido. A mesma auditoria encontrou a
> Sprint 7 (`GET /dashboard/erros`) genuinamente não implementada — diferente das 4 e 6, essa
> era uma lacuna real, não um problema de documentação — fechada logo em seguida, mesma data.

Com a Sprint 7, **todos os 19 endpoints do backend (10 módulos) têm cobertura de frontend** —
não sobra nenhum gap de UI conhecido da Análise de Gaps de 2026-07-09.

## Referências

- `frontend/specs/README.md` — mapa geral dos módulos e ordem de dependência
- `frontend/specs/decisoes-tecnicas.md` — decisões técnicas transversais (Server Components, Server Actions, auth via cookie httpOnly, estrutura de pastas)
- `frontend/specs/DesignSystem.md` — componentes e tom de voz
- `frontend/specs/<módulo>/spec.md` e `design.md` — spec e design de cada módulo (nota: o `spec.md` de `07-frontend-autenticacao` está hoje em `frontend/specs/spec.md`, não na subpasta do módulo — desalinhamento herdado, não corrigido nesta divisão de sprints)
