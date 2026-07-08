# Spec — Sistema de Cobrança Automática (CobraCerta)
## MVP v3 — Emissão de Nota Fiscal

> Pré-requisito: MVP v2 em produção, multi-tenant funcionando, pagamento confirmado via webhook.

## 1. Objetivo do v3
Fechar o ciclo financeiro: quando uma cobrança é paga, o sistema emite automaticamente a nota fiscal correspondente, sem o usuário precisar entrar em outro sistema pra isso. Isso remove o segundo maior trabalho manual do prestador de serviço (depois de cobrar: emitir nota todo mês).

## 2. Contexto e decisão importante: NFS-e, não NF-e
O público-alvo (advogados, clínicas, dentistas, prestadores de serviço/IT) emite **NFS-e (nota fiscal de serviço eletrônica)**, não NF-e (que é para produtos/mercadorias). NFS-e é municipal — cada prefeitura tem seu próprio sistema/layout, o que é a maior complexidade técnica dessa spec.

**Decisão de arquitetura:** não integrar direto com cada prefeitura. Usar um provedor intermediário que já abstrai isso (ex: PlugNotas, Focus NFe, NFe.io, eNotas). Eles cobram por nota emitida ou mensalidade, mas evitam meses de trabalho de integração municipal por municipal.

## 3. Escopo do MVP v3

### 3.1 Configuração fiscal por empresa (tenant)
- Cadastro de dados fiscais da empresa: razão social, CNPJ, inscrição municipal, regime tributário (MEI/Simples/Presumido/Real), código de serviço (item da lista LC 116), alíquota de ISS
- Certificado digital A1 (upload do .pfx + senha) — necessário pra emissão em muitos municípios
- Escolha do provedor de NFS-e (dropdown, começando com 1 integrado no MVP: Focus NFe ou PlugNotas)

### 3.2 Configuração fiscal por cliente (tomador do serviço)
- CPF/CNPJ do cliente (já existe no cadastro, mas agora validado como obrigatório pra emissão)
- Endereço completo (exigência da nota)
- Indicação se cliente é isento/tem retenção de impostos (ISS retido, INSS, etc. — comum em clínicas/pessoa jurídica que contrata PJ)

### 3.3 Emissão automática
- Ao confirmar pagamento (status `pago`), sistema dispara emissão de NFS-e via API do provedor escolhido
- Retry automático em caso de erro do provedor/prefeitura (fila com backoff, ex: BullMQ)
- Status da nota: `pendente`, `emitida`, `erro`, `cancelada`

### 3.4 Envio ao cliente
- Após emissão, link do PDF da nota é enviado automaticamente via WhatsApp/e-mail ao cliente
- Nota também disponível no portal do cliente final (do v2)

### 3.5 Gestão de erros de emissão
- Painel mostra notas com erro e o motivo (ex: dado fiscal faltando, CNPJ inválido, serviço fora do padrão)
- Reenvio manual após correção do dado

### 3.6 Cancelamento
- Cancelar nota fiscal vinculada a uma cobrança estornada/cancelada (dentro do prazo legal do município, geralmente 24h-30 dias dependendo da prefeitura)

## 4. Modelo de dados (incrementos sobre o v2)
```
DadosFiscaisEmpresa
- id, empresa_id, cnpj, inscricao_municipal, regime_tributario,
  codigo_servico, aliquota_iss, certificado_a1_ref, provedor_nfse

NotaFiscal
- id, cobranca_id, empresa_id, cliente_id, numero, serie,
  status, pdf_url, xml_url, provedor_response, erro_mensagem,
  emitida_em, cancelada_em

DadosFiscaisCliente (incremento em Cliente)
- + endereco_completo, retencao_iss (bool), retencao_inss (bool)
```

## 5. Fluxo principal
1. Empresa configura dados fiscais + certificado digital uma vez
2. Cobrança é paga → webhook do gateway confirma
3. Sistema monta payload da NFS-e (dados da empresa + cliente + valor + código de serviço)
4. Chama API do provedor de NFS-e → aguarda confirmação da prefeitura
5. Nota emitida → PDF salvo → enviado ao cliente automaticamente
6. Se erro → cai na fila de retry / painel de erros pra correção manual

## 6. Stack — incrementos
- Provedor de NFS-e: Focus NFe ou PlugNotas (avaliar qual tem melhor cobertura de municípios dos seus clientes-alvo em Manaus/AM)
- Armazenamento de PDF/XML: bucket S3-compatible (ou o mesmo storage já usado no Easypanel)
- Fila de emissão com retry: BullMQ, separada da fila de cobrança pra isolar falhas

## 7. Critérios de aceite do MVP v3
- [ ] Ao confirmar pagamento, nota fiscal é emitida sem intervenção manual em até alguns minutos
- [ ] PDF da nota chega automaticamente ao cliente via WhatsApp
- [ ] Erros de emissão aparecem no painel com motivo claro e ação de correção
- [ ] Cancelamento de nota funciona dentro do prazo legal
- [ ] Dados fiscais de pelo menos 2 regimes tributários diferentes (MEI e Simples) testados

## 8. Riscos e pontos de atenção
- Certificado digital A1 tem validade (1 ano) — sistema precisa alertar antes de expirar
- Nem toda prefeitura é suportada pelos provedores intermediários — validar cobertura antes de vender pra cliente de município pequeno
- Mudança de alíquota/código de serviço no meio do caminho exige reemissão cuidadosa (não é só editar, senão gera inconsistência fiscal)

## 9. Fora de escopo do v3 (backlog futuro)
- Emissão de NF-e (produto) — só NFS-e no v3
- Integração contábil direta (exportação para sistemas como Contabilizei, Omie)
- Emissão de nota em lote retroativo (histórico anterior ao sistema)
- Múltiplos provedores de NFS-e simultâneos (só 1 integrado no v3)