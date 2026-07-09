# Contrato de API
`spec.md` — fase SPECIFY

**ID do módulo:** `API`
**Escopo:** Small
**Depende de:** `clientes` (CAD), `cobrancas` (COB), `mensagens` (MSG), `notificacoes-email` (EMAIL), `pagamentos` (PAG), `dashboard` (DASH) — documenta rotas já especificadas/implementadas nesses módulos, não cria regra de negócio nova

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 4): nunca existiu
um documento único descrevendo rotas, verbos, request/response e códigos de erro da API.
Cada módulo de frontend referencia endpoints espalhados nas próprias tabelas de
rastreabilidade (`claude.md` seção 4.3 tem uma tabela solta, mas não é um contrato formal
com shape de payload). Isso gera risco de retrabalho quando frontend e backend divergem
sobre formato de dado.

## Capturar o quê

### User Stories

**API-US-01 (P1)** — Como desenvolvedor (backend ou frontend) trabalhando no projeto, quero
uma fonte única da verdade de todas as rotas HTTP existentes, para não precisar inferir
o contrato lendo o código de cada módulo.

**API-US-02 (P2)** — Como desenvolvedor adicionando uma rota nova, quero um padrão definido
de formato de erro/sucesso, para manter consistência entre módulos.

### Requisitos (WHEN / THEN / SHALL)

- **API-R-01**: WHEN uma rota HTTP já implementada existe em qualquer módulo (CAD, COB, MSG, EMAIL, PAG, DASH, AUTH), THEN o documento de contrato SHALL descrevê-la com método, path, autenticação exigida, request body/query params e todos os status codes de resposta possíveis.
- **API-R-02**: WHEN uma rota retorna erro, THEN o contrato SHALL documentar o formato padrão (`{ error: string }`) e distinguir erro de validação (400), autenticação (401) e recurso não encontrado (404).
- **API-R-03**: WHEN um novo módulo/rota é especificado a partir de agora, THEN o `tasks.md` daquele módulo SHALL incluir uma task explícita de atualizar `contrato-api` antes de considerar o módulo concluído.
- **API-R-04**: IF um endpoint documentado neste contrato divergir do código real (deriva), THEN a correção SHALL atualizar o contrato, não o inverso — código é sempre a fonte de verdade, o contrato só descreve.

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| API-01 | API-US-01 | API-R-01, API-R-02 | `api/specs/contrato-api/endpoints.md` (documento de referência, não código) |
| API-02 | API-US-02 | API-R-03, API-R-04 | Atualização do checklist padrão (`claude.md` seção 7.2) e dos `tasks.md` futuros |

## Fora de escopo deste módulo

- Geração automática de contrato (OpenAPI/Swagger) — MVP v1 documenta manualmente em Markdown, ferramenta de geração fica para v2 se o time crescer
- Versionamento de API (`/v1/`, `/v2/`) — API é consumida só pelo frontend do próprio produto, sem consumidor externo no MVP
- Client SDK gerado a partir do contrato
