# Regras — Reenvio Manual de Mensagem (REENVIO)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica: reaproveitar templates e canais existentes

- `ReenviarMensagemUseCase` não cria texto novo — reconstrói o mesmo tipo de mensagem (LEMBRETE/VENCIMENTO/ATRASO/CONFIRMACAO) a partir do `tipo` da `MensagemEnviada` original, usando os mesmos helpers de `template-mensagem.ts`/`template-email.ts`
- Reenvio tenta o mesmo canal do registro original (`whatsapp` ou `email`), não os dois — se o usuário quiser reenviar nos dois canais, precisa acionar o reenvio duas vezes (uma por registro de falha)

## Decisão técnica: nunca sobrescrever histórico

- Cada tentativa de reenvio gera um novo registro de `MensagemEnviada`, nunca atualiza o registro existente — preserva rastreabilidade completa (quantas vezes foi tentado, quando, resultado de cada uma)

## Invariantes do domínio

- Reenvio bloqueado para cobrança `PAGO` ou `CANCELADO`
- Reenvio sempre usa o mesmo canal do registro de falha original

## Fora de escopo

- Painel de erros consolidado
- Reenvio em lote
- Edição de texto antes de reenviar
