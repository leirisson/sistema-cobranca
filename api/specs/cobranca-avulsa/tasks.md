# Tasks — Cobrança Avulsa (AVULSA)

- [x] AVULSA-01 — Adicionar `origem` (enum, default `RECORRENTE`) e `descricao` (opcional) à entidade `Cobranca` e ao schema Prisma; migration com default seguro para linhas existentes.
- [x] AVULSA-02 — Implementar `CriarCobrancaManualUseCase` (`src/application/cobranca/`), recebendo cliente/valor/vencimento/descrição, bloqueando cliente `INATIVO` (AVULSA-R-02), reaproveitando `GatewayPagamento`/`CobrancaRepository` existentes.
- [x] AVULSA-03 — `CobrancaRepository.existeParaCicloVigente` só é chamado pelo fluxo recorrente (`GerarCobrancaUseCase`); `CriarCobrancaManualUseCase` (avulsa) nunca a invoca, então uma avulsa não bloqueia nem é bloqueada pela checagem de duplicidade por construção (AVULSA-R-05) — não precisou de filtro por `origem` na query, garantido estruturalmente sem teste dedicado.
- [x] AVULSA-04 — Endpoint implementado como `POST /cobrancas` (não `POST /clientes/:id/cobrancas-avulsas` como rascunhado originalmente — `clienteId` vai no corpo). Documentar em `contrato-api/endpoints.md`.
- [x] AVULSA-05 — `DashboardCobrancaQuery` (listagem e detalhe) retorna `origem`/`descricao`.
- [x] AVULSA-06 (frontend) — Ação "Nova cobrança" na tabela de clientes (FE-CAD) leva a `/clientes/:id/nova-cobranca`, formulário curto (valor + vencimento + descrição opcional) via `FormularioCobrancaManual`, fluxo separado do cadastro/edição de cliente.
- [x] AVULSA-07 (frontend) — FE-DASH exibe origem: badge "AVULSA" ao lado do nome na listagem (`TabelaCobrancas`) e rótulo "Cobrança avulsa" + descrição no detalhe.
