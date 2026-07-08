# Regras — Pagamentos (PAG)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Segurança do webhook
- Todo webhook do gateway deve ser validado por `ASAAS_WEBHOOK_TOKEN` antes de processar qualquer dado do payload (PAG-R-01)
- Token inválido → rejeitar com 401, sem alterar nenhuma cobrança (PAG-R-02)

## Máquina de estados da `Cobranca`
- Transições idempotentes: webhook para cobrança já `PAGO` ou `CANCELADO` é ignorado sem erro (PAG-R-04)
- Confirmação válida → status `PAGO` + `paid_at` registrado (PAG-R-03)

## Fora de escopo
- Conciliação automática entre cobranças geradas e recebidas no gateway (v2)
- Suporte a múltiplos gateways enviando webhook (v2 — v1 assume só Asaas)
- Estorno/reembolso automático
