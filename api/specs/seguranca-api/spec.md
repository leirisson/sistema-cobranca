# Segurança Básica da API
`spec.md` — fase SPECIFY

**ID do módulo:** `SEC`
**Escopo:** Small
**Depende de:** `auth` (AUTH, já implementado — JWT), transversal a todas as rotas HTTP

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 5): hoje só existe
token de autenticidade para o webhook do Asaas (PAG-R-01/02) e JWT para rotas protegidas
(AUTH). Não há rate limiting no login (proteção contra força bruta), CORS explícito, nem rate
limiting geral da API. `FE-AUTH-R-03` só cobre mensagem de erro genérica, nada sobre bloqueio
após N tentativas.

## Capturar o quê

### User Stories

**SEC-US-01 (P1)** — Como usuário do sistema, quero que minha conta esteja protegida contra
tentativas automatizadas de adivinhar minha senha, para reduzir o risco de acesso indevido.

**SEC-US-02 (P2)** — Como usuário do sistema, quero que a API só aceite requisições do
frontend oficial do produto, para reduzir superfície de abuso por origem desconhecida.

**SEC-US-03 (P2)** — Como usuário do sistema, quero que a API tenha um limite geral de
requisições, para não ficar vulnerável a abuso/sobrecarga simples.

### Requisitos (WHEN / THEN / SHALL)

- **SEC-R-01**: WHEN `POST /auth/login` recebe tentativas de um mesmo IP/e-mail acima de um limite configurável em uma janela de tempo, THEN o sistema SHALL bloquear temporariamente novas tentativas daquela origem, respondendo `429`.
- **SEC-R-02**: WHEN a API recebe uma requisição de origem (`Origin`) fora da lista permitida, THEN o sistema SHALL rejeitar via CORS (aplica-se a chamadas de browser; não se aplica ao webhook do Asaas, que não é chamado por browser).
- **SEC-R-03**: WHEN qualquer rota recebe volume de requisições acima de um limite geral configurável por IP, THEN o sistema SHALL responder `429` antes de processar a rota.
- **SEC-R-04**: WHEN o rate limit de login é atingido, THEN a mensagem de erro SHALL continuar genérica (não revelar se o e-mail existe), preservando a garantia já dada por AUTH (`POST /auth/login sempre devolve a mesma mensagem`, ver `claude.md` seção 8).

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| SEC-01 | SEC-US-01 | SEC-R-01, SEC-R-04 | Plugin Fastify de rate limit (`@fastify/rate-limit`), config específica na rota `/auth/login` |
| SEC-02 | SEC-US-02 | SEC-R-02 | Plugin `@fastify/cors`, allowlist via env var (`CORS_ALLOWED_ORIGINS`) |
| SEC-03 | SEC-US-03 | SEC-R-03 | Mesmo plugin de rate limit, config global em `app.ts` |

## Fora de escopo deste módulo

- WAF (Web Application Firewall) ou proteção de camada de rede — infraestrutura, não aplicação
- CAPTCHA no login
- 2FA (autenticação de dois fatores) — v2 se o produto crescer além de single-tenant
- Rate limit distribuído entre múltiplas instâncias do servidor (MVP v1 roda 1 processo só, ver `claude.md` seção 8 sobre workers no mesmo processo)
