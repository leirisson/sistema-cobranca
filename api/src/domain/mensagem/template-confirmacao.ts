export interface DadosTemplateConfirmacao {
  nomeCliente: string;
  valor: number;
  nomeRemetente?: string | null;
}

function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function montarAssinatura(nomeRemetente?: string | null): string {
  return nomeRemetente ? `\n\n— ${nomeRemetente}` : "";
}

export function montarTextoConfirmacao(dados: DadosTemplateConfirmacao): string {
  return `Olá, ${dados.nomeCliente}! Confirmamos o recebimento do seu pagamento de ${formatarValor(dados.valor)}. Obrigado!${montarAssinatura(dados.nomeRemetente)}`;
}

export function montarEmailConfirmacao(dados: DadosTemplateConfirmacao): { assunto: string; corpoHtml: string } {
  return {
    assunto: "Confirmação de pagamento",
    corpoHtml: `<p>${montarTextoConfirmacao(dados)}</p>`,
  };
}
