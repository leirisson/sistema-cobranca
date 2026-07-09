# Sprint 6 — Onboarding / Configurações (ONB)

> Status: concluída (2026-07-09)
> Depende de: [Sprint 5 — Contrato de API](sprint-05-contrato-api.md)
> Specs de referência: `api/specs/onboarding/spec.md`, `rules.md`, `tasks.md`

## Objetivo

Permitir que o usuário configure, pela própria tela do produto, a chave do Asaas, o
pareamento do WhatsApp (Evolution API) e o toggle de confirmação de pagamento — hoje tudo
isso é variável de ambiente, o que trava a venda do produto além do primeiro piloto (gap 🔴
mais bloqueante identificado na Análise de Gaps).

## Tasks

- [x] ONB-01 — Entidade `Configuracao` (domínio + Prisma), migration, cifragem de `asaasApiKey`
- [x] ONB-02 — `AsaasGateway`/`ConfirmarPagamentoUseCase` passam a resolver via `ConfiguracaoRepository` com fallback para env var
- [x] ONB-03 — Endpoints `GET`/`PUT /configuracoes`
- [x] ONB-04 — Endpoints proxy de conexão WhatsApp (QR Code + status)
- [x] ONB-05 — Templates de mensagem/e-mail aceitam `nomeRemetente`
- [x] ONB-06 (frontend) — Tela `/configuracoes`

## Critérios de conclusão da sprint

- [x] Todas as tasks ONB-01 a ONB-06 concluídas
- [x] Testes unitários de domínio/application com fake de `ConfiguracaoRepository`
- [x] Teste de integração confirmando que `asaasApiKey` nunca retorna em claro em nenhuma resposta HTTP
- [x] Fallback para env var validado (comportamento atual do piloto não quebra sem configuração feita pela tela)
- [x] `contrato-api/endpoints.md` atualizado com as rotas novas (API-R-03)
- [x] Checklist do `claude.md` (seção 7.2) validado
- [x] `api/specs/onboarding/tasks.md` com os checkboxes marcados

## Nota de execução

Ver `claude.md` seção 10 (2026-07-09) para o detalhamento completo, incluindo 2 decisões de
arquitetura resolvidas com o usuário durante a implementação (id fixo para registro único;
campo `confirmacaoPagamentoConfiguradaPeloUsuario` para resolver a ambiguidade do toggle
boolean) e um bug real encontrado e corrigido na verificação end-to-end (`POST` sem body
rejeitado pelo Fastify com `Content-Type: application/json` setado).

## Próxima sprint

[Sprint 7 — Cobrança Avulsa](sprint-07-cobranca-avulsa.md).
