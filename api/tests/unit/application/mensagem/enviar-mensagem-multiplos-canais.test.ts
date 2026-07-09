import { describe, expect, it } from "vitest";

import { enviarMensagemMultiplosCanais } from "../../../../src/application/mensagem/enviar-mensagem-multiplos-canais.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";

describe("enviarMensagemMultiplosCanais", () => {
  const input = {
    telefone: "+5511999998888",
    texto: "texto whatsapp",
    email: "maria@example.com",
    assuntoEmail: "Assunto",
    corpoHtmlEmail: "<p>corpo</p>",
  };

  it("envia por WhatsApp e por e-mail em paralelo quando o cliente tem os dois canais", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();

    const resultados = await enviarMensagemMultiplosCanais(canalMensagem, canalNotificacao, input);

    expect(canalMensagem.chamadas).toHaveLength(1);
    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(resultados).toEqual(
      expect.arrayContaining([
        { statusEnvio: "ENVIADO", canal: "whatsapp" },
        { statusEnvio: "ENVIADO", canal: "email" },
      ]),
    );
    expect(resultados).toHaveLength(2);
  });

  it("não tenta e-mail quando o cliente não tem e-mail cadastrado", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();

    const resultados = await enviarMensagemMultiplosCanais(canalMensagem, canalNotificacao, {
      ...input,
      email: null,
    });

    expect(canalNotificacao.chamadas).toHaveLength(0);
    expect(resultados).toEqual([{ statusEnvio: "ENVIADO", canal: "whatsapp" }]);
  });

  it("registra FALHA no whatsapp e ENVIADO no e-mail quando só o whatsapp falha", async () => {
    const canalMensagem = new FakeCanalMensagem();
    canalMensagem.deveFalharPara.add(input.telefone);
    const canalNotificacao = new FakeCanalNotificacao();

    const resultados = await enviarMensagemMultiplosCanais(canalMensagem, canalNotificacao, input);

    expect(resultados).toEqual(
      expect.arrayContaining([
        { statusEnvio: "FALHA", canal: "whatsapp" },
        { statusEnvio: "ENVIADO", canal: "email" },
      ]),
    );
  });

  it("registra FALHA no e-mail e ENVIADO no whatsapp quando só o e-mail falha", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();
    canalNotificacao.deveFalharPara.add(input.email);

    const resultados = await enviarMensagemMultiplosCanais(canalMensagem, canalNotificacao, input);

    expect(resultados).toEqual(
      expect.arrayContaining([
        { statusEnvio: "ENVIADO", canal: "whatsapp" },
        { statusEnvio: "FALHA", canal: "email" },
      ]),
    );
  });

  it("registra FALHA nos dois canais quando ambos falham, sem lançar erro", async () => {
    const canalMensagem = new FakeCanalMensagem();
    canalMensagem.deveFalharPara.add(input.telefone);
    const canalNotificacao = new FakeCanalNotificacao();
    canalNotificacao.deveFalharPara.add(input.email);

    const resultados = await enviarMensagemMultiplosCanais(canalMensagem, canalNotificacao, input);

    expect(resultados).toEqual(
      expect.arrayContaining([
        { statusEnvio: "FALHA", canal: "whatsapp" },
        { statusEnvio: "FALHA", canal: "email" },
      ]),
    );
  });
});
