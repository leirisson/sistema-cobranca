# Regras — Cobranças (COB)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Entidades principais
- `Cobranca` — id, cliente_id, valor, vencimento, status, gateway_charge_id, link_pagamento, paid_at, created_at

## Decisão técnica: isolamento do gateway
- A aplicação nunca depende diretamente do SDK/HTTP do Asaas nas regras de negócio
- Existe uma porta própria `GatewayPagamento` ("o que um gateway de pagamento faz": criar cobrança, cancelar cobrança); `AsaasGateway` é apenas uma implementação
- Trocar de gateway no futuro (Mercado Pago, Efí) = nova implementação da mesma interface, sem alterar regra de negócio existente

## Invariantes do domínio
- Nunca persistir cobrança sem `gatewayChargeId`/link de pagamento válido (COB-R-03)
- Nunca gerar duas cobranças para o mesmo ciclo do mesmo cliente (COB-R-04)
- Nunca gerar cobrança para cliente `INATIVO` (COB-R-05)

## Fora de escopo
- Múltiplos gateways de pagamento (v2)
- Valores variáveis, parcelamento, juros/multa automáticos (v2)
- Cobrança avulsa fora da recorrência (v2)
- Retry automático sofisticado com fila de dead-letter
