# Endpoints — Contrato de API

> Fonte única da verdade do contrato HTTP da API CobraCerta. Gerado a partir do código real em
> `api/src/infra/http/routes/` (código é a fonte de verdade — ver API-R-04 em `spec.md`; se este
> documento divergir do código, corrija o documento, nunca o inverso).
>
> Convenção de formato por rota: ver `rules.md`.

## Autenticação

Rotas **Protegidas** exigem o header `Authorization: Bearer <token>`, validado pelo hook
`preHandler` `autenticar` (`src/infra/http/plugins/auth.ts`) contra `JWT_SECRET`. Ausência ou
token inválido/expirado: `401 { error: string }`.

Rotas **Públicas** não passam por esse hook — inclui rotas autenticadas por outro mecanismo
(webhook do Asaas, autenticado pelo próprio token do gateway) e as que não fazem sentido exigir
sessão (`/health`, `/auth/login`).

## Rate limit (SEC)

Todas as rotas passam por um rate limit **geral** de `100` requisições/minuto por IP
(`@fastify/rate-limit`, registrado globalmente em `app.ts`). Ao exceder, `429`:

```ts
{ statusCode: 429, error: "Too Many Requests", message: string }
```

`POST /auth/login` tem um limite **específico e mais agressivo** por cima do geral: `5`
tentativas/minuto por IP (SEC-01/SEC-R-01) — anti-brute-force. Ao exceder, a resposta continua
`429` no mesmo formato acima; a mensagem de erro de credenciais inválidas (`401`) nunca é
afetada pelo rate limit — são caminhos de código diferentes, então a garantia de mensagem
genérica (AUTH-R-03) não muda (SEC-R-04).

## CORS (SEC)

Todas as rotas exigem `Origin` presente na allowlist configurada via `CORS_ALLOWED_ORIGINS`
(`@fastify/cors`, lista separada por vírgula, ex: `http://localhost:3001`). Requisição de
origem fora da lista é rejeitada pelo CORS antes de chegar à rota (comportamento padrão do
browser: erro de CORS no console, sem resposta utilizável). Não se aplica ao webhook do Asaas
(`/webhooks/asaas`), que não é chamado por um browser.

---

### `GET /health`
- **Módulo:** —
- **Autenticação:** Pública
- **Request:** nenhum
- **Response 200:** `{ status: "ok" }`
- **Erros:** nenhum

---

### `POST /auth/login`
- **Módulo:** AUTH
- **Autenticação:** Pública
- **Request Body:**
  ```ts
  { email: string; senha: string }
  ```
- **Response 200:**
  ```ts
  { token: string }
  ```
- **Erros:**
  - `401 { error: "E-mail ou senha inválidos" }` — e-mail inexistente OU senha incorreta (mensagem sempre genérica, nunca diferencia os dois casos — evita oráculo de e-mails cadastrados)

---

### `POST /webhooks/asaas`
- **Módulo:** PAG
- **Autenticação:** Pública (autenticada pelo header `asaas-access-token`, validado contra `ASAAS_WEBHOOK_TOKEN`, não pelo JWT)
- **Request Headers:** `asaas-access-token: <token>`
- **Request Body:**
  ```ts
  { event: string; payment: { id: string } }
  ```
- **Response 200:** `{ status: "ok" }` — pagamento confirmado com sucesso
- **Response 200 (idempotente/ignorado):** `{ status: "ignorado" }` — `payment.id` não corresponde a nenhuma `Cobranca` local (evita retry infinito do Asaas; o evento é logado como warning, não é erro)
- **Erros:**
  - `401 { error: "Token de webhook inválido" }` — header ausente ou não bate com `ASAAS_WEBHOOK_TOKEN`

---

### `GET /dashboard/cobrancas`
- **Módulo:** DASH
- **Autenticação:** Protegida (JWT)
- **Request Query params (todos opcionais):**
  - `status`: um de `PENDENTE` \| `PAGO` \| `ATRASADO` \| `CANCELADO`
  - `busca`: string (nome do cliente, `contains` case-insensitive)
  - `mes`: number (1-12; default: mês corrente)
  - `ano`: number (default: ano corrente)
- **Response 200:**
  ```ts
  {
    itens: Array<{
      id: string;
      nomeCliente: string;
      valor: number;
      vencimento: string; // ISO date
      status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
      origem: "RECORRENTE" | "AVULSA";
    }>;
    totais: {
      totalAReceber: number;   // soma de PENDENTE + ATRASADO
      totalRecebido: number;   // soma de PAGO
      totalEmAtraso: number;   // soma de ATRASADO
    };
  }
  ```
- **Erros:**
  - `400 { error: "Status inválido" }` — `status` fora do enum
  - `401` — sem token válido

---

### `GET /dashboard/cobrancas/:id`
- **Módulo:** DASH
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid da cobrança)
- **Response 200:**
  ```ts
  {
    id: string;
    nomeCliente: string;
    valor: number;
    vencimento: string; // ISO date
    status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
    linkPagamento: string | null;
    pixCopiaECola: string | null;
    origem: "RECORRENTE" | "AVULSA";
    descricao: string | null;
    mensagens: Array<{
      id: string;
      tipo: "LEMBRETE" | "VENCIMENTO" | "ATRASO" | "CONFIRMACAO";
      canal: "whatsapp" | "email";
      statusEnvio: "ENVIADO" | "FALHA";
      enviadoEm: string; // ISO date
    }>;
  }
  ```
- **Erros:**
  - `404 { error: "Cobrança não encontrada" }`
  - `401` — sem token válido

---

### `PATCH /dashboard/cobrancas/:id/cancelar`
- **Módulo:** CANC
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid da cobrança)
- **Request:** nenhum body
- **Response 200:** mesmo shape de `GET /dashboard/cobrancas/:id`, já com `status: "CANCELADO"`
- **Efeito colateral:** tenta cancelar a cobrança no Asaas (`DELETE /payments/:id`); falha nessa
  chamada é logada e **não** bloqueia o cancelamento local (CANC-R-04)
- **Erros:**
  - `400 { error: string }` — cobrança já `PAGO` ou já `CANCELADO` (transição inválida, CANC-R-02)
  - `404 { error: string }` — `id` não corresponde a nenhuma cobrança
  - `401` — sem token válido

---

### `POST /dashboard/cobrancas/:id/mensagens/:mensagemId/reenviar`
- **Módulo:** REENVIO
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid da cobrança), `mensagemId` (uuid da `MensagemEnviada` original)
- **Request Body:** `{}` (nenhum campo — `apiFetch` do frontend sempre envia `Content-Type:
  application/json`, então o corpo precisa ser um JSON vazio explícito, não ausente)
- **Response 200:** mesmo shape de `GET /dashboard/cobrancas/:id`, já com o novo registro de
  `MensagemEnviada` no array `mensagens` (o registro original com `FALHA` permanece intacto,
  REENVIO-R-01/R-02)
- **Efeito:** reenvia pelo mesmo canal (`whatsapp` ou `email`) e com o mesmo `tipo` do registro
  original, reconstruindo o texto pelos templates existentes; sem limite de tentativas
  (REENVIO-R-03)
- **Erros:**
  - `400 { error: string }` — mensagem original não está com `statusEnvio: "FALHA"`, ou a
    cobrança já está `PAGO`/`CANCELADO` (REENVIO-R-04)
  - `404 { error: string }` — `mensagemId` não corresponde a nenhuma `MensagemEnviada`, ou a
    `Cobranca` referenciada por ela não existe mais
  - `401` — sem token válido

---

### `GET /clientes`
- **Módulo:** CAD
- **Autenticação:** Protegida (JWT)
- **Request Query params (todos opcionais):**
  - `busca`: string (nome do cliente, `contains` case-insensitive)
  - `status`: `ATIVO` \| `INATIVO`
- **Response 200:** array de `ClienteDTO` (ver shape abaixo)
- **Erros:**
  - `400 { error: "Status inválido" }` — `status` fora do enum
  - `401` — sem token válido

---

### `GET /clientes/:id`
- **Módulo:** CAD
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid do cliente)
- **Response 200:** `ClienteDTO` (ver shape abaixo)
- **Erros:**
  - `404 { error: "Cliente não encontrado" }`
  - `401` — sem token válido

---

### `POST /clientes`
- **Módulo:** CAD
- **Autenticação:** Protegida (JWT)
- **Request Body:**
  ```ts
  {
    nome: string;
    documento: string;          // 11 dígitos (CPF) ou 14 (CNPJ), sem validação de dígito verificador
    telefones: Array<{ numero: string; principal: boolean }>; // >=1, E.164, exatamente 1 principal
    email?: string | null;
    valorCobranca: number;      // > 0
    diaVencimento: number;      // 1-28
    inscricaoEstadual?: string | null;
    endereco?: {
      rua: string; numero?: string | null; bairro?: string | null;
      cidade: string; uf: string; cep: string;
    } | null;
    nomeContato?: string | null;
    referenciaServico?: string | null;
  }
  ```
- **Response 201:** `ClienteDTO` (ver shape abaixo), status inicial sempre `ATIVO`
- **Erros:**
  - `400 { error: string }` — mensagem de validação da entidade (nome vazio, documento com tamanho errado, telefone fora do formato E.164, nenhum ou mais de um telefone principal, valor <= 0, dia de vencimento fora de 1-28)
  - `401` — sem token válido

---

### `PUT /clientes/:id`
- **Módulo:** CAD
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid do cliente)
- **Request Body:** mesmos campos de `POST /clientes`, todos opcionais (edição parcial — campo omitido mantém o valor atual)
- **Response 200:** `ClienteDTO` atualizado
- **Erros:**
  - `400 { error: string }` — mesma validação de `POST /clientes`
  - `404 { error: "Cliente não encontrado" }`
  - `401` — sem token válido

---

### `PATCH /clientes/:id/status`
- **Módulo:** CAD
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid do cliente)
- **Request Body:**
  ```ts
  { status: "ATIVO" | "INATIVO" }
  ```
- **Response 200:** `ClienteDTO` com o novo status
- **Erros:**
  - `400 { error: "Status inválido" }` — `status` fora do enum
  - `404 { error: string }` — cliente não existe
  - `401` — sem token válido

---

### `DELETE /clientes/:id`
- **Módulo:** LGPD
- **Autenticação:** Protegida (JWT)
- **Request Params:** `id` (uuid do cliente)
- **Request:** nenhum body
- **Response 200:**
  ```ts
  { resultado: "REMOVIDO" | "ANONIMIZADO" }
  ```
  `"REMOVIDO"` quando o cliente não tinha nenhuma `Cobranca` associada (registro apagado
  fisicamente do banco, junto com seus `TelefoneCliente`). `"ANONIMIZADO"` quando havia
  `Cobranca` associada (LGPD-R-01/R-02): os campos de PII (`nome`, `documento`, `telefones`,
  `email`, `endereco`, `inscricaoEstadual`, `nomeContato`, `referenciaServico`) são substituídos
  por valores placeholder (`nome: "Cliente removido"`, `documento: "00000000000"`, telefone
  `"+10000000000"`, demais campos `null`); o registro do `Cliente` e suas `Cobranca`/
  `MensagemEnviada` permanecem intactos para integridade contábil.
- **Efeito colateral:** loga um evento de auditoria estruturado (Pino, `app.log.info`) com
  `{ clienteId, resultado }` — nunca com PII (LGPD-R-03).
- **Distinção de `PATCH /clientes/:id/status`:** esta rota é destrutiva e irreversível (não há
  "descancelar"); inativar continua sendo o fluxo padrão do dia a dia, exclusão definitiva é
  uma ação rara para atender pedido de exclusão do titular do dado (LGPD art. 18).
- **Erros:**
  - `404 { error: string }` — cliente não existe
  - `401` — sem token válido

---

### `POST /cobrancas`
- **Módulo:** AVULSA (cobrança manual/pontual, MVP v1.3)
- **Autenticação:** Protegida (JWT)
- **Request Body:**
  ```ts
  {
    clienteId: string;
    valor: number;
    vencimento: string;      // ISO date
    descricao?: string | null;
  }
  ```
- **Response 201:**
  ```ts
  {
    id: string;
    status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
    origem: "AVULSA";
    descricao: string | null;
    linkPagamento: string | null;
    pixCopiaECola: string | null;
  }
  ```
- **Efeito colateral:** dispara `DispararLembreteInicialUseCase` de forma assíncrona (não bloqueia a resposta); falha no disparo é só logada, não afeta o `201`
- **Erros:**
  - `400 { error: string }` — validação da entidade `Cobranca` ou do cliente associado
  - `404 { error: string }` — `clienteId` não corresponde a nenhum cliente
  - `401` — sem token válido

---

### `GET /configuracoes`
- **Módulo:** ONB
- **Autenticação:** Protegida (JWT)
- **Request:** nenhum
- **Response 200:**
  ```ts
  {
    asaasApiKeyConfigurada: boolean;
    asaasApiKeyUltimosDigitos: string | null; // últimos 4 caracteres da chave, nunca o valor completo
    nomeRemetente: string | null;
    confirmacaoPagamentoHabilitada: boolean;
  }
  ```
  Sem nenhuma configuração salva ainda, devolve os defaults (`asaasApiKeyConfigurada: false`,
  `nomeRemetente: null`, `confirmacaoPagamentoHabilitada: false`) — nunca `404`.
- **Erros:**
  - `401` — sem token válido

---

### `PUT /configuracoes`
- **Módulo:** ONB
- **Autenticação:** Protegida (JWT)
- **Request Body (todos os campos opcionais — edição parcial, campo omitido preserva o valor atual):**
  ```ts
  {
    asaasApiKey?: string;   // "" remove a credencial salva, voltando ao fallback de ASAAS_API_KEY do .env
    nomeRemetente?: string | null;
    confirmacaoPagamentoHabilitada?: boolean;
  }
  ```
- **Response 200:** mesmo shape de `GET /configuracoes`, já refletindo a atualização
- **Efeito:** `asaasApiKey` é cifrada em repouso (AES-256-GCM) antes de persistir — nunca fica em
  texto plano no banco nem retorna em claro em nenhuma resposta HTTP. Uma vez que
  `confirmacaoPagamentoHabilitada` é enviado (mesmo `false`), o valor salvo passa a prevalecer
  sobre `CONFIRMACAO_PAGAMENTO_HABILITADA` do `.env` a partir daí.
- **Erros:**
  - `401` — sem token válido

---

### `POST /configuracoes/whatsapp/conectar`
- **Módulo:** ONB
- **Autenticação:** Protegida (JWT)
- **Request:** nenhum
- **Response 200:**
  ```ts
  {
    qrCodeBase64: string | null; // null quando a instância já está conectada
    status: string;              // status ao vivo vindo da Evolution API (ex: "open", "connecting")
  }
  ```
- **Erros:**
  - `401` — sem token válido
  - `502 { error: "Não foi possível conectar ao WhatsApp no momento" }` — Evolution API indisponível

---

### `GET /configuracoes/whatsapp/status`
- **Módulo:** ONB
- **Autenticação:** Protegida (JWT)
- **Request:** nenhum
- **Response 200:**
  ```ts
  { status: string } // consultado ao vivo via Evolution API, nunca persistido localmente
  ```
- **Erros:**
  - `401` — sem token válido
  - `502 { error: "Não foi possível conectar ao WhatsApp no momento" }` — Evolution API indisponível

---

## Shape comum: `ClienteDTO`

Usado como response de `GET /clientes`, `GET /clientes/:id`, `POST /clientes`, `PUT /clientes/:id`,
`PATCH /clientes/:id/status`:

```ts
{
  id: string;
  nome: string;
  documento: string;
  tipoDocumento: "CPF" | "CNPJ";       // derivado do tamanho do documento, não persistido
  telefones: Array<{ id?: string; numero: string; principal: boolean }>;
  email: string | null;
  valorCobranca: number;
  diaVencimento: number;
  status: "ATIVO" | "INATIVO";
  inscricaoEstadual: string | null;
  endereco: {
    rua: string; numero: string | null; bairro: string | null;
    cidade: string; uf: string; cep: string;
  } | null;
  nomeContato: string | null;
  referenciaServico: string | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

## Formato padrão de erro

Ver `rules.md`. Resumo: `400`/`401`/`404`, sempre `{ error: string }` (exceto `404` de algumas
rotas que podem devolver corpo vazio conforme já implementado), nunca stack trace ou detalhe de
implementação.

## Observação sobre deriva de documentação

Esta primeira versão do contrato já nasceu corrigindo uma divergência: `POST /cobrancas`
(módulo `cobranca-avulsa`, ver `claude.md` linha do tempo 2026-07-09) estava implementada e
registrada em `app.ts`, mas não constava na tabela de rotas do `claude.md` §4.3 nem na lista de
rotas do `tasks.md` desta sprint. Reforça a regra API-R-04: o código é sempre a fonte de
verdade.
