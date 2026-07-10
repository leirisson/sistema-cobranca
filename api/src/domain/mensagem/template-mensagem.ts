export interface DadosTemplateMensagem {
  nomeCliente: string;
  valor: number;
  vencimento: Date;
  linkPagamento: string;
  pixCopiaECola?: string | null;
  nomeRemetente?: string | null;
  mensagemPersonalizada?: string | null;
}

export type TipoMensagemComTemplate = "LEMBRETE" | "VENCIMENTO" | "ATRASO";

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function montarTrechoPix(pixCopiaECola?: string | null): string {
  return pixCopiaECola ? ` Ou pague via Pix copia-e-cola: ${pixCopiaECola}` : "";
}

function montarAssinatura(nomeRemetente?: string | null): string {
  return nomeRemetente ? `\n\n— ${nomeRemetente}` : "";
}

function substituirPlaceholders(template: string, dados: DadosTemplateMensagem): string {
  return template
    .replaceAll("{nome}", dados.nomeCliente)
    .replaceAll("{valor}", formatarValor(dados.valor))
    .replaceAll("{vencimento}", formatarData(dados.vencimento))
    .replaceAll("{link}", dados.linkPagamento);
}

export function montarTextoMensagem(tipo: TipoMensagemComTemplate, dados: DadosTemplateMensagem): string {
  const valorFormatado = formatarValor(dados.valor);
  const vencimentoFormatado = formatarData(dados.vencimento);
  const trechoPix = montarTrechoPix(dados.pixCopiaECola);
  const assinatura = montarAssinatura(dados.nomeRemetente);

  if (dados.mensagemPersonalizada && dados.mensagemPersonalizada.trim().length > 0) {
    return `${substituirPlaceholders(dados.mensagemPersonalizada, dados)}${trechoPix}${assinatura}`;
  }

  switch (tipo) {
    case "LEMBRETE":
      return `Olá, ${dados.nomeCliente}! Sua cobrança de ${valorFormatado} vence em ${vencimentoFormatado}. Pague pelo link: ${dados.linkPagamento}${trechoPix}${assinatura}`;
    case "VENCIMENTO":
      return `Olá, ${dados.nomeCliente}! Sua cobrança de ${valorFormatado} vence hoje (${vencimentoFormatado}). Pague pelo link: ${dados.linkPagamento}${trechoPix}${assinatura}`;
    case "ATRASO":
      return `Olá, ${dados.nomeCliente}! Sua cobrança de ${valorFormatado}, com vencimento em ${vencimentoFormatado}, está em atraso. Regularize pelo link: ${dados.linkPagamento}${trechoPix}${assinatura}`;
    default: {
      const tipoInvalido: never = tipo;
      throw new Error(`Tipo de mensagem sem template: ${String(tipoInvalido)}`);
    }
  }
}
