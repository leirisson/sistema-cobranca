# Onboarding / Configurações da Empresa
`spec.md` — fase SPECIFY

**ID do módulo:** `ONB`
**Escopo:** Medium
**Depende de:** `clientes` (CAD, usuário já autenticado), `mensagens` (MSG, WhatsApp), `notificacoes-email` (EMAIL), `pagamentos` (PAG, toggle de confirmação)

## Contexto

Identificado na Análise de Gaps (`api/SistemaDeCobrançaAutomática.md`, gap 1) como o item
🔴 mais bloqueante: hoje toda credencial externa (`ASAAS_API_KEY`, `EVOLUTION_*`, Gmail) é
variável de ambiente, configurável só por quem tem acesso ao deploy. Isso é aceitável para
o piloto com 1 cliente (situação atual, ver `claude.md` seção 10), mas inviabiliza vender o
produto para um segundo cliente sem intervenção manual em servidor.

## Capturar o quê

### User Stories

**ONB-US-01 (P1)** — Como usuário do sistema, quero conectar meu próprio WhatsApp à Evolution
API pareando via QR Code numa tela, para não depender de alguém mexer em infraestrutura.

**ONB-US-02 (P1)** — Como usuário do sistema, quero inserir minha própria chave do Asaas numa
tela de configuração, para não depender de variável de ambiente/redeploy.

**ONB-US-03 (P2)** — Como usuário do sistema, quero configurar o nome da minha empresa que
aparece assinando as mensagens de lembrete, para o cliente final saber quem está cobrando.

**ONB-US-04 (P2)** — Como usuário do sistema, quero ligar/desligar a mensagem de confirmação
de pagamento numa tela, sem precisar de variável de ambiente (`CONFIRMACAO_PAGAMENTO_HABILITADA`
hoje só é alterável no `.env`).

### Requisitos (WHEN / THEN / SHALL)

- **ONB-R-01**: WHEN o usuário acessa a tela de configurações e solicita parear o WhatsApp, THEN o sistema SHALL gerar um QR Code via Evolution API e exibi-lo na tela, atualizando o status da instância (conectado/desconectado) sem exigir reload manual.
- **ONB-R-02**: WHEN o usuário salva a chave do Asaas na tela de configurações, THEN o sistema SHALL persistir essa credencial de forma segura (nunca em texto plano legível por qualquer rota que não seja a de configuração) e usá-la em toda chamada subsequente ao `AsaasGateway`, substituindo a variável de ambiente como fonte primária.
- **ONB-R-03**: WHEN nenhuma credencial de Asaas foi configurada pela tela, THEN o sistema SHALL cair de volta para a variável de ambiente (`ASAAS_API_KEY`), preservando compatibilidade com o ambiente atual do piloto.
- **ONB-R-04**: WHEN o usuário salva o nome da empresa/remetente, THEN as próximas mensagens disparadas (WhatsApp e e-mail) SHALL incluir esse nome no texto/assunto.
- **ONB-R-05**: WHEN o usuário alterna o toggle de confirmação de pagamento na tela, THEN o `ConfirmarPagamentoUseCase` SHALL respeitar esse valor persistido, em vez de ler só `CONFIRMACAO_PAGAMENTO_HABILITADA` do `.env`.
- **ONB-R-06**: IF a instância do WhatsApp cair (desconectar) depois de já configurada, THEN a tela de configurações SHALL indicar o status "desconectado" e permitir reconectar (novo QR Code) sem precisar recriar a instância do zero.

### IDs de rastreabilidade

| ID | User Story | Requisito | Componente técnico previsto |
|---|---|---|---|
| ONB-01 | ONB-US-01 | ONB-R-01, ONB-R-06 | Endpoint(s) proxy para `/instance/connect`/`/instance/connectionState` da Evolution API + tela de QR Code |
| ONB-02 | ONB-US-02 | ONB-R-02, ONB-R-03 | Nova entidade/tabela `Configuracao` (ou `ConfiguracaoEmpresa`), fallback para env var |
| ONB-03 | ONB-US-03 | ONB-R-04 | Campo `nomeRemetente` em `Configuracao`, usado pelos templates de mensagem/e-mail |
| ONB-04 | ONB-US-04 | ONB-R-05 | Campo `confirmacaoPagamentoHabilitada` em `Configuracao`, substituindo a leitura direta de env var pelo use case |

## Fora de escopo deste módulo

- Multi-tenant (múltiplas empresas com múltiplas configurações simultâneas) — v2, MVP v1 continua single-tenant (1 registro de configuração só)
- Troca de gateway de pagamento pela tela (só a chave do Asaas já configurado)
- Onboarding guiado passo-a-passo (wizard) — a v1 desta tela é um formulário simples de configurações, sem fluxo de "primeiro acesso" dedicado
