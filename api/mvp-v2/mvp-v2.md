# Spec — Sistema de Cobrança Automática (CobraCerta)
## MVP v2

> Pré-requisito: MVP v1 em produção e validado com pelo menos 1 cliente real.

## 1. Objetivo do v2
Transformar o produto de "ferramenta interna de um prestador" em "plataforma multi-cliente" vendável como SaaS — com controle de acesso, régua de cobrança configurável e visão financeira de verdade. Este é o release que sustenta a venda recorrente (assinatura mensal por empresa).

## 2. Escopo do MVP v2

### 2.1 Multi-tenant + RBAC
- Cada empresa (tenant) tem seu próprio espaço isolado de clientes e cobranças
- Papéis: Admin (dono da empresa), Financeiro (gerencia cobranças), Visualizador (só relatórios)
- Onboarding self-service: empresa se cadastra, conecta seu próprio número de WhatsApp e gateway

### 2.2 Régua de cobrança configurável
- Usuário define quantos lembretes, com quantos dias de antecedência/atraso, e o texto de cada mensagem
- Templates com variáveis dinâmicas + suporte a múltiplos canais (WhatsApp + e-mail como fallback)
- Pausar régua por cliente individualmente (ex: cliente já negociou por fora)

### 2.3 Múltiplos gateways de pagamento
- Suporte a Asaas, Mercado Pago e Efí — usuário escolhe qual conectar
- Abstração de gateway no backend (interface única, adapters por provedor)
- Suporte a cartão de crédito recorrente (assinatura), além de PIX/boleto

### 2.4 Cobranças flexíveis
- Valores variáveis por cobrança (não só recorrência fixa)
- Parcelamento
- Juros e multa automáticos por atraso (configurável: % ao dia, teto)
- Cobrança avulsa (fora da recorrência) para casos pontuais

### 2.5 Portal do cliente final
- Link único por cliente para ver histórico de cobranças, baixar recibos, atualizar forma de pagamento
- Sem necessidade de login complexo (magic link via WhatsApp/e-mail)

### 2.6 Relatórios e financeiro
- Relatório de inadimplência (taxa, valor, tempo médio de atraso)
- Fluxo de caixa projetado (a receber por semana/mês)
- Exportação CSV/PDF para contabilidade
- Conciliação: comparação automática entre cobranças geradas e recebidas no gateway

### 2.7 Auditoria e confiabilidade
- Log de toda ação automática (mensagem enviada, cobrança gerada, status alterado) — importante como diferencial em segmentos regulados (jurídico, saúde), no mesmo espírito do princípio "IA sugere, humano decide" que você já usa nos outros specs
- Reenvio manual de cobrança/lembrete pelo painel em caso de falha

## 3. Modelo de dados (incrementos sobre o v1)
```
Empresa (tenant)
- id, nome, plano, gateway_configurado, whatsapp_instance_id, created_at

Usuario
- id, empresa_id, nome, email, papel (admin/financeiro/visualizador)

ReguaCobranca
- id, empresa_id, nome, regras (json: dias, canal, template_id)

Template
- id, empresa_id, tipo, canal, conteudo

Cobranca (evoluído)
- + parcelas, juros_aplicado, multa_aplicada, gateway_usado

LogAuditoria
- id, empresa_id, entidade, entidade_id, acao, payload, created_at
```

## 4. Stack — incrementos
- Isolamento multi-tenant: schema-per-tenant ou tenant_id em todas as tabelas (avaliar volume esperado antes de decidir)
- Autenticação: JWT + RBAC middleware no Fastify
- Fila de mensagens por tenant (evitar que um tenant sature o disparo de outro)
- Painel administrativo interno (para você) monitorar saúde de todos os tenants

## 5. Critérios de aceite do MVP v2
- [ ] Duas empresas diferentes usam a plataforma isoladamente, sem vazamento de dados
- [ ] Usuário configura sua própria régua de cobrança sem precisar de código
- [ ] Cliente final acessa portal e visualiza histórico corretamente
- [ ] Relatório de inadimplência bate com os dados reais de cobranças
- [ ] Trocar de gateway não exige mudança de código, só configuração

## 6. Fora de escopo do v2 (backlog futuro)
- App mobile dedicado para o cliente final
- Split de pagamento entre múltiplos recebedores
- Integração contábil direta (ex: emissão de NF-e automática)
- IA para prever risco de inadimplência por cliente