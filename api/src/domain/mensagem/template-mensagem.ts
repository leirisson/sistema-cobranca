export interface DadosTemplateMensagem {
  nomeCliente: string;
  valor: number;
  vencimento: Date;
  linkPagamento: string;
  pixCopiaECola?: string | null;
  nomeRemetente?: string | null;
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

export function montarTextoMensagem(tipo: TipoMensagemComTemplate, dados: DadosTemplateMensagem): string {
  const valorFormatado = formatarValor(dados.valor);
  const vencimentoFormatado = formatarData(dados.vencimento);
  const trechoPix = montarTrechoPix(dados.pixCopiaECola);
  const assinatura = montarAssinatura(dados.nomeRemetente);

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
