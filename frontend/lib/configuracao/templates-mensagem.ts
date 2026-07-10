export interface TemplateMensagemCobranca {
  id: string;
  nome: string;
  descricao: string;
  texto: string;
}

export const templatesMensagemCobranca: TemplateMensagemCobranca[] = [
  {
    id: "formal",
    nome: "Formal",
    descricao: "Tom institucional, para relação B2B",
    texto:
      "Prezado(a) {nome},\n\n" +
      "Informamos que consta em nosso sistema uma cobrança no valor de {valor}, com vencimento em {vencimento}.\n\n" +
      "Para sua comodidade, disponibilizamos o link abaixo para efetuar o pagamento:\n{link}\n\n" +
      "Caso o pagamento já tenha sido realizado, favor desconsiderar este aviso.\n\n" +
      "Permanecemos à disposição para eventuais dúvidas.\n\n" +
      "Atenciosamente.",
  },
  {
    id: "cordial",
    nome: "Cordial",
    descricao: "Profissional, com tom mais próximo",
    texto:
      "Olá, {nome}! Tudo bem?\n\n" +
      "Passando para lembrar que sua fatura no valor de {valor} vence em {vencimento}.\n\n" +
      "Você pode efetuar o pagamento diretamente por este link: {link}\n\n" +
      "Se precisar de qualquer suporte ou tiver dúvidas sobre a cobrança, é só nos avisar.\n\n" +
      "Agradecemos a confiança em nossos serviços.",
  },
  {
    id: "institucional",
    nome: "Institucional",
    descricao: "Objetivo, com aviso de vencimento",
    texto:
      "Prezado(a) {nome},\n\n" +
      "Comunicamos que a cobrança referente aos serviços prestados, no valor de {valor}, tem vencimento previsto para {vencimento}.\n\n" +
      "Solicitamos a gentileza de efetuar o pagamento até a data indicada, através do link a seguir:\n{link}\n\n" +
      "Em caso de pagamento já efetuado, este comunicado deve ser desconsiderado.\n\n" +
      "Atenciosamente,\nEquipe financeira.",
  },
];
