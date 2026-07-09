# Base Legal de Tratamento de Dados Pessoais — CobraCerta

> Documento de compliance, não código. Referência: LGPD-R-04 (`spec.md`).
> Escrito da perspectiva do CobraCerta como operador do sistema em nome do usuário
> (prestador de serviço, controlador dos dados dos próprios clientes finais).

## 1. Quem é quem

- **Titular do dado**: o cliente final do usuário do CobraCerta (a pessoa/empresa que é
  cobrada) — ex: paciente de uma clínica, cliente de um escritório de advocacia.
- **Controlador**: o usuário do CobraCerta (prestador de serviço) — é quem decide coletar e
  para que usar os dados do seu próprio cliente.
- **Operador**: o CobraCerta (o sistema/produto) — processa os dados em nome do controlador,
  conforme instruído pela funcionalidade do produto (gerar cobrança, enviar lembrete).

## 2. Base legal de tratamento

**Execução de contrato** (LGPD art. 7º, V) é a base legal aplicável a todos os dados pessoais
tratados pelo CobraCerta. O tratamento existe estritamente para viabilizar a cobrança
recorrente ou avulsa acordada entre o controlador (usuário do sistema) e o titular (cliente
final dele) — sem os dados abaixo, a cobrança e o lembrete de pagamento não são possíveis.

Não há tratamento de dado pessoal para finalidade diferente desta (ex: nenhum uso para
marketing, perfil de comportamento, ou repasse a terceiros fora do necessário para operar
a cobrança — Asaas como gateway de pagamento, Evolution API/WhatsApp e Gmail como canais de
envio de mensagem).

## 3. Propósito de cada campo pessoal armazenado

| Campo (`Cliente`) | Propósito |
|---|---|
| `nome` | Identificar o titular na cobrança e nas mensagens enviadas a ele |
| `documento` (CPF/CNPJ) | Exigido pelo gateway de pagamento (Asaas) para emitir boleto/PIX em nome do titular |
| `telefones` | Canal de envio do lembrete/régua de cobrança via WhatsApp |
| `email` | Canal de envio do lembrete/régua de cobrança e do link da fatura por e-mail |
| `endereco` | Opcional; usado apenas quando o boleto emitido exige endereço do pagador |
| `inscricaoEstadual` | Opcional; relevante para clientes pessoa jurídica em alguns segmentos (ex: B2B) |
| `nomeContato` | Opcional; nome de um contato humano na empresa do titular (quando o titular é pessoa jurídica) |
| `referenciaServico` | Opcional; texto livre descrevendo o serviço prestado, referenciado na cobrança |

Nenhum desses campos é coletado além do necessário para emitir a cobrança e notificar o
titular — não há campo de PII armazenado "para uso futuro" sem propósito imediato.

## 4. Retenção e exclusão

- Enquanto o cliente está `ATIVO` ou `INATIVO` (inativação, `PATCH /clientes/:id/status`), os
  dados pessoais permanecem armazenados — inativar só interrompe a geração de novas cobranças,
  não é uma forma de exclusão.
- Exclusão definitiva (`DELETE /clientes/:id`, ver `endpoints.md`) atende o direito de exclusão
  do titular (LGPD art. 18, VI):
  - Se o cliente **não tem** nenhuma `Cobranca` associada: os dados são removidos fisicamente.
  - Se o cliente **tem** `Cobranca` associada: os campos de PII são anonimizados (substituídos
    por valores placeholder), mas o registro financeiro (`Cobranca`, `MensagemEnviada`) é
    preservado — necessário para a integridade contábil do usuário do sistema, que pode ter
    obrigação de guarda fiscal sobre cobranças já emitidas (nota fiscal, por exemplo).
- Toda exclusão definitiva gera um log de auditoria estruturado (id do cliente + resultado da
  operação), sem conter o dado pessoal em si — permite rastrear que uma exclusão aconteceu sem
  reter o dado excluído no próprio log.

## 5. O que este documento não cobre (fora de escopo do MVP v1)

- Portal de autoatendimento para o titular do dado solicitar exclusão diretamente — o titular
  não tem login no CobraCerta; toda solicitação passa pelo usuário do sistema (controlador).
- Expurgo automático por prazo de guarda (job agendado) — a exclusão é sempre sob demanda.
- Nomeação formal de DPO (Data Protection Officer) ou processo jurídico externo ao produto —
  responsabilidade do controlador (usuário do sistema), não do operador (CobraCerta).
