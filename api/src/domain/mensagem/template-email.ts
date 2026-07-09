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

function montarBlocoPixHtml(pixCopiaECola?: string | null): string {
  if (!pixCopiaECola) {
    return "";
  }

  return `<p>Ou pague via Pix copia-e-cola:</p><p><code>${pixCopiaECola}</code></p>`;
}

export function montarEmailMensagem(tipo: TipoMensagemComTemplate, dados: DadosTemplateMensagem): EmailMensagem {
  const textoBase = montarTextoMensagem(tipo, { ...dados, pixCopiaECola: undefined });
  const corpoLink = `<p>${textoBase.replace(dados.linkPagamento, `<a href="${dados.linkPagamento}">${dados.linkPagamento}</a>`)}</p>`;
  const corpoHtml = `${corpoLink}${montarBlocoPixHtml(dados.pixCopiaECola)}`;

  return { assunto: ASSUNTOS[tipo], corpoHtml };
}
