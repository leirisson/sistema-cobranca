# Sprint 1 — Frontend: Autenticação (FE-AUTH)

> Status: concluída (2026-07-09) — ver `CLAUDE.md` (raiz), seção 10, para o registro completo
> Depende de: [Sprint 0 — Backend: gaps de API](sprint-00-backend-gaps-api.md) (precisa de `POST /auth/login` e do middleware de auth)
> Specs de referência: `frontend/specs/spec.md` (spec de FE-AUTH, hoje na raiz de `specs/` — ver nota no `sprints/README.md`), `frontend/specs/07-frontend-autenticacao/design.md`, `frontend/specs/decisoes-tecnicas.md` §4

## Objetivo

Entregar o único ponto de entrada não autenticado do painel (`/login`) e a
proteção de sessão via cookie httpOnly + `middleware.ts`, fechando
FE-AUTH-US-01 a US-03 (`api/specs` equivalente do frontend). Sem isso, nenhuma
outra tela do painel pode ser considerada "pronta" — FE-CAD e FE-DASH dependem
de rota autenticada.

## Tasks

- [x] FE-AUTH-01 — Página `/login` (Server Component) + `<LoginForm />` (Client Component). **Desvio da spec:** react-hook-form + Zod causaram um bug reproduzível de submit nativo (ver `CLAUDE.md` seção 10, obstáculo desta sprint) — trocado por HTML5 `required`/`type="email"` como validação client-side mínima
- [x] FE-AUTH-02 — Server Action `login(formData)` em `lib/auth/actions.ts`: chama `POST /auth/login`, grava cookie `session` (httpOnly, secure em produção, sameSite=lax) em caso de sucesso, redireciona para `/dashboard`
- [x] FE-AUTH-03 — Tratamento de erro de login: mensagem genérica fixa ("E-mail ou senha inválidos.") via `useActionState`, nunca diferenciando causa
- [x] FE-AUTH-04 — `proxy.ts` na raiz (Next.js 16 renomeou `middleware.ts`/`middleware` para `proxy.ts`/`proxy` — ver obstáculo no `CLAUDE.md`): `matcher` para todas as rotas exceto `/login`/`_next`/estáticos; sem cookie `session` → redirect para `/login`
- [x] FE-AUTH-05 — Camada `lib/api/client.ts` (wrapper fetch): repassa `Authorization: Bearer <token>` do cookie em toda chamada; trata `401` da API limpando o cookie e redirecionando para `/login` (sessão expirada)
- [x] FE-AUTH-06 — Botão "Sair" (`components/logout-button.tsx`, compartilhado, será reaproveitado no shell autenticado de FE-CAD/FE-DASH) + Server Action `logout()`: remove cookie, redireciona para `/login`

## Critérios de conclusão da sprint

- [x] Login com credencial real (usuário seed criado na Sprint 0) funciona ponta a ponta contra o backend
- [x] Acessar qualquer rota do painel sem sessão redireciona para `/login`
- [x] Sessão expirada/401 da API força novo login, sem tela quebrada
- [x] Logout limpa a sessão e impede acesso a rotas protegidas até novo login
- [x] Lint e typecheck do frontend limpos
- [x] Checklist do `claude.md` (raiz do repo, seção 7.2) validado

## Após esta sprint

Painel autenticado disponível — Sprint 2 (FE-CAD) pode começar assumindo sessão
válida e reaproveitando `lib/api/client.ts`.
