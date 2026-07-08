# Regras — Mensagens (MSG)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Entidades principais
- `MensagemEnviada` — id, cobranca_id, tipo (lembrete/vencimento/atraso/confirmacao), enviado_em, status_envio

## Régua de disparo (fixa no MVP v1)
- Lembrete no momento da geração da cobrança (MSG-R-01)
- Mensagem de vencimento no dia (D0) (MSG-R-02)
- Mensagem de atraso em D+1 e novo lembrete em D+3 (MSG-R-03)
- Régua **não é configurável** pelo usuário no v1 (fica pro v2)

## Invariantes do domínio
- Nunca disparar mensagem de lembrete/atraso para cobrança já `PAGO` (MSG-R-04)
- Falha de envio (Evolution API) nunca interrompe o processamento das demais mensagens da fila (MSG-R-06)

## Fora de escopo
- Régua de cobrança configurável pelo usuário (v2)
- Envio por e-mail (ver módulo `notificacoes-email`)
- Confirmação de pagamento via WhatsApp (ver módulo `pagamentos`)
