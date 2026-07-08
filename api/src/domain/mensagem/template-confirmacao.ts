export interface DadosTemplateConfirmacao {
  nomeCliente: string;
  valor: number;
}

function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function montarTextoConfirmacao(dados: DadosTemplateConfirmacao): string {
  return `Olá, ${dados.nomeCliente}! Confirmamos o recebimento do seu pagamento de ${formatarValor(dados.valor)}. Obrigado!`;
}

export function montarEmailConfirmacao(dados: DadosTemplateConfirmacao): { assunto: string; corpoHtml: string } {
  return {
    assunto: "Confirmação de pagamento",
    corpoHtml: `<p>${montarTextoConfirmacao(dados)}</p>`,
  };
}
