# MVP v1 — Specs Modulares (fase SPECIFY)

Este MVP v1 foi classificado como **Large (multi-componente)** no auto-sizing —
por isso passa pelo pipeline completo: Specify → Design → Tasks → Execute,
quebrado por módulo em vez de um spec único.

Este diretório contém apenas a fase **01 SPECIFY** de cada módulo. Design (`design.md`)
e Tasks (`tasks.md`) ficam para quando entrarmos nas próximas fases de cada módulo.

## Módulos e ordem de dependência

```
01-cadastro-clientes  (CAD)   → base, sem dependência
        ↓
02-geracao-cobranca   (COB)   → depende de CAD
        ↓
03-lembretes-whatsapp (MSG)   → depende de COB
        ↓
        ├── 06-notificacao-email (EMAIL) → depende de COB, MSG (canal complementar/fallback)
        ↓
04-confirmacao-pagamento (PAG) → depende de COB, MSG (+ EMAIL para confirmação)
        ↓
05-dashboard          (DASH)  → depende de CAD, COB, PAG

--- Frontend (consome os módulos de backend acima via API) ---

07-frontend-autenticacao (FE-AUTH)       → base do frontend, sem dependência de backend específico
        ↓
08-frontend-gestao-clientes (FE-CAD)     → depende de FE-AUTH, CAD, spec-mvp-v1.2
09-frontend-dashboard-cobrancas (FE-DASH) → depende de FE-AUTH, DASH, PAG
```

## Rastreabilidade entre módulo e sprint (referência: sprints-mvp-v1.md)

| Módulo | Sprint |
|---|---|
| CAD — Cadastro de clientes | Sprint 1 |
| COB — Geração de cobrança | Sprint 2 |
| MSG — Lembretes WhatsApp | Sprint 3 |
| EMAIL — Notificação por e-mail (Gmail) | Sprint 3 |
| PAG — Confirmação de pagamento | Sprint 3 |
| DASH — Dashboard (backend) | Sprint 4 |
| FE-AUTH — Frontend: autenticação | Sprint 4 |
| FE-CAD — Frontend: gestão de clientes | Sprint 4 |
| FE-DASH — Frontend: dashboard de cobranças | Sprint 4 |

## Convenção de IDs
Cada requisito e user story tem um ID único no formato `<MODULO>-<TIPO>-<NUMERO>`
(ex: `CAD-US-01`, `COB-R-03`), permitindo rastrear de spec → design → tasks → commit
quando as próximas fases forem escritas.

## Próximo passo sugerido
Escrever `design.md` do módulo `01-cadastro-clientes` primeiro (é a base de tudo),
definindo arquitetura interna, modelo de dados e interfaces — antes de quebrar em
tasks executáveis.
