# 07 — Frontend: Autenticação
`spec.md` — fase SPECIFY

**ID do módulo:** `FE-AUTH`
**Escopo:** Small
**Depende de:** nenhum módulo de backend específico (autenticação básica, single-tenant no MVP v1)

## Capturar o quê

### Contexto
O MVP v1 é single-tenant (um usuário/empresa usando o sistema). Não há RBAC nem múltiplos papéis ainda (isso é do v2) — a autenticação existe só pra proteger o acesso ao painel, não pra segmentar dados entre empresas.

### User Stories

**FE-AUTH-US-01 (P1)** — Como usuário do sistema, quero fazer login com e-mail e senha, para acessar meu painel de cobranças com segurança.

**FE-AUTH-US-02 (P1)** — Como usuário do sistema, quero permanecer logado entre sessões, para não precisar autenticar toda vez que abro o painel.

**FE-AUTH-US-03 (P2)** — Como usuário do sistema, quero fazer logout, para encerrar minha sessão em um computador compartilhado.

### Requisitos (WHEN / THEN / SHALL)

- **FE-AUTH-R-01**: WHEN o usuário acessa qualquer rota do painel sem estar autenticado, THEN o sistema SHALL redirecionar para a tela de login.
- **FE-AUTH-R-02**: WHEN o usuário envia e-mail/senha corretos, THEN o sistema SHALL autenticar e redirecionar para o dashboard (módulo `09-frontend-dashboard-cobrancas`).
- **FE-AUTH-R-03**: WHEN o usuário envia credenciais inválidas, THEN o sistema SHALL exibir mensagem de erro genérica (não indicar se o erro foi no e-mail ou na senha, por segurança).
- **FE-AUTH-R-04**: WHEN o usuário autentica com sucesso, THEN o sistema SHALL manter a sessão ativa via token (ex: JWT em cookie httpOnly) até logout explícito ou expiração.
- **FE-AUTH-R-05**: WHEN o usuário clica em "sair", THEN o sistema SHALL invalidar a sessão local e redirecionar para o login.

### Telas previstas
- `/login` — formulário de e-mail + senha
- Nenhuma tela de "cadastro de novo usuário" no v1 (usuário único, criado manualmente/via seed — self-service de conta é do v2, junto com multi-tenant)

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| FE-AUTH-01 | FE-AUTH-US-01 | FE-AUTH-R-01, FE-AUTH-R-02, FE-AUTH-R-03 | Página `/login`, chamada à API de autenticação |
| FE-AUTH-02 | FE-AUTH-US-02 | FE-AUTH-R-04 | Middleware de sessão (cookie httpOnly) |
| FE-AUTH-03 | FE-AUTH-US-03 | FE-AUTH-R-05 | Botão de logout, limpeza de sessão |

## Fora de escopo deste módulo
- RBAC / múltiplos papéis de usuário (v2)
- Onboarding self-service de nova empresa (v2, junto com multi-tenant)
- Recuperação de senha por e-mail (aceitável adiar pro v1.1/v2 — no v1 reset é manual, direto no banco)
- Login social (Google, etc.)
