# Sprint 3 — Frontend: Dashboard de Cobranças (FE-DASH)

> Status: concluída (2026-07-09)
> Depende de: [Sprint 1 — FE-AUTH](sprint-01-fe-auth.md) (sessão/middleware). Não depende da Sprint 2 (FE-CAD), mas segue essa ordem por ser a visão consolidada que fecha o MVP v1 do frontend.
> Specs de referência: `frontend/specs/09-frontend-dashboard-cobrancas/spec.md`, `design.md`

## Objetivo

Entregar a visão principal do painel: listagem de cobranças do mês com
status, filtros, totais agregados e detalhe de cobrança — fecha FE-DASH-01 a
FE-DASH-06. Único módulo de frontend sem gap de API pendente hoje
(`GET /dashboard/cobrancas` já existe), exceto pela proteção via auth
(resolvida na Sprint 0/1) e a rota nova de detalhe.

## Tasks

- [x] FE-DASH-00 — Rota de backend `GET /dashboard/cobrancas/:id` (gap de API, ver `design.md` §4): devolve a cobrança + `nomeCliente` + histórico de `MensagemEnviada` (tipo, canal, status de envio, data). Fazer antes ou em paralelo à Task FE-DASH-04 desta sprint.
- [x] FE-DASH-01 — Camada `lib/api/cobrancas.ts`: `listarCobrancasDashboard(filtro)`, `buscarCobrancaDetalhe(id)`
- [x] FE-DASH-02 — Tela `/dashboard` (Server Component): lê `searchParams` (`status`, `mes`, `ano`, default mês/ano corrente), chama `listarCobrancasDashboard`, renderiza cards de resumo + tabela
- [x] FE-DASH-03 — `<CardResumo />` (a receber = PENDENTE+ATRASADO, recebido = PAGO, em atraso = ATRASADO), sem recalcular no client — usa `totais` já vindo da API
- [x] FE-DASH-04 — `<FiltroStatus />` (Client Component, tabs/select) + `<SeletorMes />` (Client Component), ambos navegando via querystring (`?status=&mes=&ano=`)
- [x] FE-DASH-05 — Tabela de cobranças ordenada por vencimento, badge de status completo (incluindo rotação `-4deg` em PAGO), link para detalhe; estado vazio sem CTA ("nenhuma cobrança encontrada para o mês/filtro atual")
- [x] FE-DASH-06 — Tela `/dashboard/cobrancas/[id]`: cliente, valor, status, `linkPagamento`, `pixCopiaECola` (se presente), histórico de mensagens enviadas — sem mutação nesta tela

## Critérios de conclusão da sprint

- [x] Dashboard reflete corretamente pendentes/pagos/atrasados do mês corrente, com filtro por status e navegação de mês funcionando
- [x] Cards de resumo batem com os totais devolvidos pela API (sem recálculo duplicado no client)
- [x] Detalhe de cobrança mostra histórico de mensagens e código PIX copia-e-cola quando existir
- [x] `/dashboard/cobrancas` e a nova rota de detalhe exigem sessão válida
- [x] Lint e typecheck do frontend limpos
- [x] Checklist do `claude.md` (raiz do repo, seção 7.2) validado

## Após esta sprint

MVP v1 do frontend completo (auth + gestão de clientes + dashboard). Próximo
passo natural: testar o painel ponta a ponta com o backend real (não só specs),
e revisar escopo do MVP v2 do frontend, se houver.
