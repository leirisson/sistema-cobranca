# Notificações por E-mail (Gmail)
`spec.md` — fase SPECIFY

**ID do módulo:** `EMAIL`
**Escopo:** Small
**Depende de:** `cobrancas` (COB), `mensagens` (MSG — reaproveita templates e conceito de régua)

## Capturar o quê

### Contexto
O MVP v1 usa WhatsApp (Evolution API) como canal principal de comunicação (módulo `mensagens`). Este módulo adiciona **e-mail via Gmail** como canal complementar — útil tanto para clientes que preferem e-mail quanto como fallback quando o envio por WhatsApp falha.

### User Stories

**EMAIL-US-01 (P1)** — Como usuário do sistema, quero que o cliente receba um e-mail de lembrete de cobrança, para atingir clientes que preferem ou só usam e-mail.

**EMAIL-US-02 (P1)** — Como usuário do sistema, quero que o cliente receba confirmação de pagamento por e-mail, para ter um canal formal de comprovante além do WhatsApp.

**EMAIL-US-03 (P2)** — Como usuário do sistema, quero que o sistema envie e-mail automaticamente quando o envio por WhatsApp falhar, para não perder a comunicação com o cliente por causa de instabilidade de um canal só.

**EMAIL-US-04 (P3)** — Como usuário do sistema, quero configurar qual conta Gmail é usada para o envio, para manter a comunicação saindo do e-mail profissional da empresa.

### Requisitos (WHEN / THEN / SHALL)

- **EMAIL-R-01**: WHEN um cliente não tem e-mail cadastrado, THEN o sistema SHALL pular o envio por e-mail silenciosamente, sem gerar erro (e-mail é opcional no cadastro, ver módulo `clientes`).
- **EMAIL-R-02**: WHEN o sistema precisa enviar um e-mail, THEN o sistema SHALL autenticar via Nodemailer com transport Gmail, usando usuário + senha de app do Google (conta Gmail da empresa), nunca a senha real da conta.
- **EMAIL-R-03**: WHEN uma cobrança é gerada, THEN o sistema SHALL enviar e-mail de lembrete com nome, valor, vencimento e link de pagamento — no mesmo momento do disparo do WhatsApp (módulo `mensagens`).
- **EMAIL-R-04**: WHEN uma cobrança é marcada como `PAGO`, THEN o sistema SHALL enviar e-mail de confirmação, se a opção estiver ativada (mesmo toggle do módulo `pagamentos`).
- **EMAIL-R-05**: IF o envio por WhatsApp falhar (módulo `mensagens`, MSG-R-06) AND o cliente tiver e-mail cadastrado, THEN o sistema SHALL tentar enviar a mesma mensagem por e-mail como fallback.
- **EMAIL-R-06**: WHEN um e-mail é enviado (com sucesso ou falha), THEN o sistema SHALL registrar o evento em `MensagemEnviada` com um campo de canal (`whatsapp` | `email`), reaproveitando a mesma tabela do módulo `mensagens`.
- **EMAIL-R-07**: IF a API do Gmail retornar erro de quota ou autenticação, THEN o sistema SHALL registrar a falha e SHALL NOT interromper o processamento das demais mensagens da fila.

### Decisão técnica
- Envio via **Nodemailer** com transport Gmail, autenticado por usuário + senha de app do Google, permitindo enviar em nome da conta Gmail configurada sem expor a senha real da conta
- Assim como o gateway de pagamento (módulo `cobrancas`), o envio de e-mail é abstraído atrás de uma interface própria (porta) de "canal de notificação" — o mesmo template usado no WhatsApp serve de base para o e-mail, adaptado pro formato HTML

### IDs de rastreabilidade
| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| EMAIL-01 | EMAIL-US-01 | EMAIL-R-01, EMAIL-R-03 | `CanalNotificacao` (porta), `NodemailerGmailNotificador` (adapter) |
| EMAIL-02 | EMAIL-US-04 | EMAIL-R-02 | Senha de app Gmail (credenciais em variável de ambiente/secret) |
| EMAIL-03 | EMAIL-US-02 | EMAIL-R-04 | Reuso do toggle de confirmação (módulo `pagamentos`) |
| EMAIL-04 | EMAIL-US-03 | EMAIL-R-05 | Lógica de fallback no disparo de mensagens (módulo `mensagens`) |
| EMAIL-05 | — | EMAIL-R-06, EMAIL-R-07 | `MensagemEnviada` (campo `canal`), log estruturado |

## Fora de escopo deste módulo
- Templates de e-mail visualmente elaborados (HTML rico, marca própria) — v1 usa e-mail simples em texto/HTML básico
- Rastreamento de abertura/clique do e-mail (open rate, link tracking)
- Envio em massa/newsletter — este módulo é só notificação transacional (1 cliente, 1 cobrança)
- Suporte a outros provedores de e-mail (SendGrid, SES) — só Gmail no v1
