# 09 — Frontend: Dashboard de Cobranças
`design.md` — fase DESIGN

**ID do módulo:** `FE-DASH`
**Depende de:** `spec.md` deste módulo, `../decisoes-tecnicas.md`, `../07-frontend-autenticacao/design.md` (sessão/middleware)

## 1. Rotas/páginas

| Rota | Tipo | Descrição |
|---|---|---|
| `/dashboard` | Server Component + Client Components de filtro/navegação | Visão principal (FE-DASH-01/02/03/06) |
| `/dashboard/cobrancas/[id]` | Server Component | Detalhe de uma cobrança (FE-DASH-04) |

## 2. Tela `/dashboard` (visão principal)

- **Server Component** `app/dashboard/page.tsx`: lê `searchParams` (`status`, `mes`, `ano` — default mês/ano corrente, espelhando o default já implementado em `ListarCobrancasDashboardUseCase`), chama `listarCobrancasDashboard({ status, mes, ano })` de `lib/api/cobrancas.ts`, que bate direto no endpoint já existente `GET /dashboard/cobrancas` (**este é o único endpoint dos 3 módulos que já existe no backend hoje**).
- Resposta da API já vem no shape `{ itens: CobrancaDashboardItem[], totais: TotaisDashboard }` — os 3 cards de resumo (FE-DASH-R-02) usam `totais` diretamente, **sem recalcular no client** (a API já centraliza esse cálculo via `groupBy`, conforme `claude.md` §4.2).
- **Cards de resumo:** "a receber" (PENDENTE + ATRASADO), "recebido" (PAGO), "em atraso" (ATRASADO) — componente `<CardResumo />` (`DesignSystem.md` §5.5), número em Fraunces, cor seguindo a paleta de carimbo correspondente ao status.
- **Filtro de status (FE-DASH-R-03):** Client Component `<FiltroStatus />` (tabs ou select), atualiza `?status=...` na URL via `router.push` — o Server Component pai refaz o fetch com o novo filtro, atualizando lista e cards juntos a partir da mesma resposta da API (sem dessincronia entre os dois, já que vêm da mesma chamada).
- **Seletor de mês (FE-DASH-R-06, FE-DASH-US-05, P3):** Client Component `<SeletorMes />`, navega `?mes=&ano=` na URL, mesmo mecanismo do filtro de status.
- **Lista/tabela de cobranças:** ordenada por vencimento (FE-DASH-R-01), colunas: cliente (`nomeCliente`, já vem no DTO via join), valor, vencimento, status (badge "carimbo" completo, incluindo a rotação `-4deg` em PAGO — `DesignSystem.md` §5.1), link para o detalhe.
- **Estado vazio (FE-DASH-R-05):** "Nenhuma cobrança encontrada para <mês/filtro atual>" — sem sugestão de ação (diferente do vazio de clientes, aqui não há um "criar cobrança" manual no MVP v1, geração é automática via cron).

## 3. Tela `/dashboard/cobrancas/[id]` (detalhe)

- **Server Component** `app/dashboard/cobrancas/[id]/page.tsx`: busca a cobrança + histórico de mensagens.
- Exibe: cliente, valor, status (badge), link de pagamento (`linkPagamento`), código PIX copia-e-cola (`pixCopiaECola`, se presente — reaproveita o mesmo dado que já vai nas mensagens, conforme `claude.md` §10 "Código PIX copia-e-cola incluído nas mensagens"), e histórico de `MensagemEnviada` (tipo, canal, status de envio, data).
- Sem mutação nesta tela no MVP v1 (reenvio manual está fora de escopo, conforme `spec.md`).

## 4. Gaps de API (pré-requisito de backend)

| Endpoint | Status | Observação |
|---|---|---|
| `GET /dashboard/cobrancas` | **Já existe** | `DASH-01` a `DASH-04`, implementado (`src/infra/http/routes/dashboard.ts`) — este módulo pode iniciar a execução da tela de listagem assim que FE-AUTH destravar a autenticação |
| `GET /dashboard/cobrancas/:id` | **Não existe** | Necessário para a tela de detalhe (FE-DASH-R-04): precisa devolver a cobrança + `nomeCliente` (mesmo shape de `CobrancaDashboardItem`, ou um DTO próprio) **e** o histórico de `MensagemEnviada` daquela cobrança (join novo, não coberto por `DashboardCobrancaQuery` hoje) |

A rota existente também precisa ser movida para trás do middleware de autenticação assim que ele existir (hoje está aberta — ver gap equivalente em `07-frontend-autenticacao/design.md` §5).

## 5. Componentes de design system introduzidos por este módulo
- Card de resumo (`DesignSystem.md` §5.5) — primeira aparição no projeto.
- Tabela de cobranças completa, incluindo a variação `PAGO` do badge com rotação (`DesignSystem.md` §5.1) — primeira tela a precisar de todos os 4 status de cobrança (PENDENTE/PAGO/ATRASADO/CANCELADO).
- Filtro de status (tabs/select) e seletor de mês — navegação via querystring, sem componente de design system dedicado além do já coberto por input/botão.
- Estado vazio (variação sem ação sugerida).

## 6. Fora de escopo
Herdado de `spec.md` (gráficos de fluxo de caixa, exportação CSV/PDF, reenvio manual) — sem mudanças.
