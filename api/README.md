# CobraCerta API

## Requisitos

- Node.js 20+
- Docker (Postgres + Redis)

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run dev
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe o servidor Fastify em modo watch |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a build compilada |
| `npm test` | Roda a suíte de testes (Vitest) |
| `npm run test:coverage` | Testes com cobertura (`domain/` e `application/`) |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Aplica migrations em dev |
| `npm run prisma:studio` | Abre o Prisma Studio |

## Estrutura

Ver `api/specs/_geral/rules.md` na raiz do repositório para as convenções de arquitetura (DDD), stack e IDs de rastreabilidade.
