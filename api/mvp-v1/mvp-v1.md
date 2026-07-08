# Spec — Sistema de Cobrança Automática (nome provisório: CobraCerta)
## MVP v1

## 1. Objetivo
Eliminar o trabalho manual de cobrar clientes recorrentes, automatizando a geração de cobranças, o envio de lembretes via WhatsApp e o controle de status de pagamento, com uma visão simples de quem está em dia e quem está inadimplente.

## 2. Problema
Prestadores de serviço (advogados, clínicas, dentistas, prestadores B2B com mensalidade) perdem tempo toda semana:
- Lembrando manualmente quem precisa pagar
- Gerando boleto/PIX um a um
- Cobrando atrasados por WhatsApp/telefone
- Sem visão consolidada de inadimplência

## 3. Escopo do MVP v1
Fazer o ciclo básico funcionar de ponta a ponta para um único usuário/empresa (single-tenant).

### 3.1 Cadastro de clientes
- CRUD de cliente: nome, telefone (WhatsApp), e-mail, CPF/CNPJ opcional
- Cadastro de cobrança recorrente por cliente: valor, dia de vencimento, periodicidade (mensal fixo no MVP v1)
- Status do cliente: ativo / inativo

### 3.2 Geração automática de cobrança
- Job agendado (cron) gera a cobrança do mês para cada cliente ativo, X dias antes do vencimento (configurável, default 5 dias)
- Integração com 1 gateway de pagamento (Asaas — boleto + PIX, boa API e webhook simples)
- Cobrança salva no banco com status: `pendente`, `pago`, `atrasado`, `cancelado`

### 3.3 Envio de lembretes (WhatsApp via Evolution API)
- Mensagem automática X dias antes do vencimento
- Mensagem no dia do vencimento
- Mensagem de atraso (D+1, D+3) — regra fixa no v1, sem régua configurável ainda
- Template de mensagem simples com variáveis (nome, valor, link de pagamento, vencimento)

### 3.4 Confirmação de pagamento
- Webhook do gateway atualiza status da cobrança para `pago` automaticamente
- Disparo de mensagem de confirmação de recebimento (opcional, toggle on/off)

### 3.5 Dashboard básico
- Lista de cobranças do mês com status
- Filtro por status (pendente/pago/atrasado)
- Total a receber no mês / total recebido / total em atraso
- Busca por cliente

## 4. Modelo de dados (simplificado)
```
Cliente
- id, nome, telefone, email, documento, status, created_at

Cobranca
- id, cliente_id, valor, vencimento, status, gateway_charge_id,
  link_pagamento, paid_at, created_at

MensagemEnviada
- id, cobranca_id, tipo (lembrete/vencimento/atraso/confirmacao),
  enviado_em, status_envio
```

## 5. Fluxo principal
1. Cliente é cadastrado com valor e dia de vencimento
2. Job diário verifica cobranças a gerar (baseado na antecedência configurada)
3. Sistema cria cobrança no gateway, salva link de pagamento
4. Evolution API dispara lembrete via WhatsApp
5. Cliente paga → webhook atualiza status → confirmação disparada
6. Se não pagar → régua fixa de atraso dispara mensagens D+1 e D+3
7. Usuário acompanha tudo pelo dashboard

## 6. Stack proposta
- Backend: Fastify + TypeScript + PostgreSQL + Prisma
- Filas/agendamento: BullMQ (jobs de geração de cobrança e disparo de mensagens)
- WhatsApp: Evolution API
- Gateway de pagamento: Asaas (sandbox primeiro)
- Frontend do dashboard: Next.js simples, sem necessidade de design elaborado no v1

## 7. Critérios de aceite do MVP v1
- [ ] Cadastrar cliente e configurar cobrança recorrente
- [ ] Cobrança é gerada automaticamente sem intervenção manual
- [ ] Lembrete chega no WhatsApp do cliente nos prazos configurados
- [ ] Pagamento via PIX/boleto reflete status `pago` automaticamente em até 1 min do webhook
- [ ] Dashboard mostra corretamente pendentes, pagos e atrasados do mês

## 8. Fora de escopo do MVP v1 (fica pro v2)
- Multi-tenant / múltiplos clientes da plataforma (RBAC)
- Régua de cobrança configurável pelo usuário
- Múltiplos gateways
- Portal do cliente final
- Relatórios financeiros avançados / exportação
- Cobrança com valores variáveis, parcelamento, juros/multa automáticos