# 07 — Frontend: Autenticação
`design.md` — fase DESIGN

**ID do módulo:** `FE-AUTH`
**Depende de:** `spec.md` deste módulo, `../decisoes-tecnicas.md`

## 1. Rotas/páginas

| Rota | Tipo | Descrição |
|---|---|---|
| `/login` | Página pública (Server Component com um Client Component de formulário) | Único ponto de entrada não autenticado |
| `middleware.ts` | Middleware (raiz do projeto) | Intercepta toda rota fora de `/login` e assets estáticos |

Não há layout autenticado ainda neste módulo — `app/layout.tsx` fica genérico; o "shell" do painel (nav, header com botão de logout) é responsabilidade compartilhada com os módulos FE-CAD/FE-DASH, mas o **botão de logout em si** (FE-AUTH-US-03) é especificado aqui.

## 2. Fluxo de login (`/login`)

1. `app/login/page.tsx` (Server Component): renderiza um Client Component `<LoginForm />`.
2. `<LoginForm />` (Client Component, react-hook-form): campos e-mail + senha, validação client-side mínima (formato de e-mail, senha não vazia) via Zod — validação de credencial em si é sempre do backend.
3. Submit chama a Server Action `login(formData)`.
4. `login()` (em `lib/auth/actions.ts`):
   - Chama `POST /auth/login` no backend (gap de API — ver seção 5) com `{ email, senha }`.
   - Sucesso (200): recebe `{ token }`, grava em cookie httpOnly via `cookies().set("session", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" })`, redireciona para `/dashboard` (FE-AUTH-R-02).
   - Falha (401): retorna estado de erro genérico para o form via `useActionState` — **nunca** diferenciar "e-mail não existe" de "senha errada" (FE-AUTH-R-03).
5. Estado de erro renderizado acima do formulário, mensagem fixa: "E-mail ou senha inválidos." (tom de voz conforme `DesignSystem.md` §6 — específico, sem se desculpar, mas aqui a especificidade tem limite deliberado de segurança).

## 3. Middleware (sessão)

`middleware.ts` na raiz:
- `matcher`: todas as rotas exceto `/login`, `/_next/*`, arquivos estáticos.
- Lê o cookie `session`. Se ausente → `redirect("/login")` (FE-AUTH-R-01).
- Não decodifica/valida o JWT no middleware (Edge runtime tem restrições de lib) — validação de assinatura/expiração acontece no backend a cada chamada de API; se o backend responder 401, a camada `lib/api/client.ts` (ver `decisoes-tecnicas.md` §3) trata isso limpando o cookie e redirecionando.

## 4. Logout

- Botão "Sair" (componente compartilhado, provavelmente no header/nav do shell autenticado) chama a Server Action `logout()`.
- `logout()`: `cookies().delete("session")`, `redirect("/login")` (FE-AUTH-R-05). Não depende de chamar o backend (sessão é stateless via JWT) — a menos que o backend implemente uma blocklist de token, o que está fora de escopo do MVP v1.

## 5. Gaps de API (pré-requisito de backend)

O backend hoje **não tem nenhum mecanismo de autenticação nem model de usuário**. Antes da execução deste módulo, precisa existir:

| Endpoint | Método | Payload | Resposta | Observação |
|---|---|---|---|---|
| `/auth/login` | POST | `{ email: string, senha: string }` | `200 { token: string }` ou `401` (mensagem genérica) | Token JWT, expiração a definir (sugestão: 7 dias, já que FE-AUTH-R-02 pede "permanecer logado entre sessões") |

Também necessário (fora do endpoint em si):
- Model de usuário no Prisma (mínimo: `id`, `email`, `senhaHash`). Como o MVP v1 é single-tenant e "usuário único, criado manualmente/via seed" (conforme `spec.md` — sem tela de cadastro), pode ser uma tabela simples sem relação com `Cliente`.
- Hash de senha (ex: bcrypt/argon2) — a decidir no design técnico do **backend**, fora do escopo deste documento de frontend.
- Middleware/plugin Fastify que valida o header `Authorization: Bearer <token>` nas rotas que passarem a exigir autenticação (hoje nenhuma rota exige — `/dashboard/cobrancas` está aberta; precisa ser protegida junto com a criação do login, senão o frontend adiciona uma porta da frente sem trancar a de trás).

> Este gap é o maior risco de sequenciamento do MVP v1 frontend: FE-CAD e FE-DASH dependem de rotas autenticadas, então o endpoint de login (e a proteção das rotas existentes/futuras) precisa ser resolvido no backend antes ou em paralelo ao início da execução deste módulo.

## 6. Fora de escopo
Herdado de `spec.md` (RBAC, self-service, recuperação de senha por e-mail, login social) — sem mudanças.
