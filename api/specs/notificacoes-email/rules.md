# Regras — Notificações por E-mail (EMAIL)

> Regras específicas deste módulo. Regras técnicas transversais (stack, DDD, pastas) estão em `api/specs/_geral/rules.md`.

## Decisão técnica
- Envio via **Gmail API** (não SMTP simples), autenticado por OAuth2 — nunca usuário/senha em texto puro (EMAIL-R-02)
- Canal de notificação abstraído atrás de uma porta própria `CanalNotificacao`; `GmailNotificador` é a implementação — mesmo princípio de isolamento usado no gateway de pagamento
- Mesmo template usado no WhatsApp serve de base para o e-mail, adaptado pro formato HTML

## Invariantes do domínio
- Cliente sem e-mail cadastrado → pular envio silenciosamente, sem erro (EMAIL-R-01)
- Falha do WhatsApp + cliente com e-mail cadastrado → fallback automático por e-mail (EMAIL-R-05)
- Erro de quota/autenticação do Gmail → registrar falha, nunca interromper o processamento da fila (EMAIL-R-07)
- Todo envio de e-mail reaproveita a tabela `MensagemEnviada` do módulo `mensagens`, com campo `canal` (`whatsapp` | `email`) (EMAIL-R-06)

## Fora de escopo
- Templates de e-mail visualmente elaborados (HTML rico, marca própria)
- Rastreamento de abertura/clique do e-mail
- Envio em massa/newsletter
- Suporte a outros provedores de e-mail (SendGrid, SES) — só Gmail no v1
