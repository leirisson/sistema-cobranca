# Regras — Segurança Básica da API (SEC)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica: plugins Fastify, não implementação própria

- Rate limiting via `@fastify/rate-limit` (ecossistema oficial do Fastify, já escolhido como framework HTTP do projeto — `_geral/rules.md` seção 1) — nunca implementar contador de tentativas manualmente
- CORS via `@fastify/cors`, mesma lógica

## Decisão técnica: limites diferenciados por rota

- `/auth/login` tem um limite mais agressivo e específico (poucas tentativas por minuto por IP+e-mail) que o restante da API
- Demais rotas protegidas usam um limite geral mais permissivo (throughput normal de uso, não é anti-brute-force)
- `/webhooks/asaas` fica fora do CORS (não é chamado por browser) mas pode ter seu próprio rate limit geral

## Invariantes

- Mensagem de erro de rate limit nunca revela se o e-mail existe (mantém a garantia de AUTH-R-03)
- CORS nunca usa `*` (wildcard) em produção — sempre allowlist explícita via env var

## Fora de escopo

- WAF
- CAPTCHA
- 2FA
- Rate limit distribuído
