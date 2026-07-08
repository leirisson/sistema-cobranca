import { montarTextoMensagem, type DadosTemplateMensagem, type TipoMensagemComTemplate } from "./template-mensagem.js";

export interface EmailMensagem {
  assunto: string;
  corpoHtml: string;
}

const ASSUNTOS: Record<TipoMensagemComTemplate, string> = {
  LEMBRETE: "Lembrete de cobrança",
  VENCIMENTO: "Sua cobrança vence hoje",
  ATRASO: "Cobrança em Atraso",
};

export function montarEmailMensagem(tipo: TipoMensagemComTemplate, dados: DadosTemplateMensagem): EmailMensagem {
  const texto = montarTextoMensagem(tipo, dados);
  const corpoHtml = `<p>${texto.replace(dados.linkPagamento, `<a href="${dados.linkPagamento}">${dados.linkPagamento}</a>`)}</p>`;

  return { assunto: ASSUNTOS[tipo], corpoHtml };
}
