import { describe, expect, it } from "vitest";

import { AlertaOperacionalService } from "../../../../src/infra/notificacoes/alerta-operacional-service.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";

describe("AlertaOperacionalService", () => {
  it("envia o alerta via WhatsApp quando o destino é um telefone", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();
    const service = new AlertaOperacionalService(canalMensagem, canalNotificacao, "+5511999999999");

    await service.alertar({ job: "gerar-cobranca", erro: new Error("Redis fora do ar") });

    expect(canalMensagem.chamadas).toEqual([
      {
        telefone: "+5511999999999",
        texto: expect.stringContaining("gerar-cobranca") as string,
      },
    ]);
    expect(canalMensagem.chamadas[0]?.texto).toContain("Redis fora do ar");
    expect(canalNotificacao.chamadas).toHaveLength(0);
  });

  it("envia o alerta via e-mail quando o destino contém @", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();
    const service = new AlertaOperacionalService(canalMensagem, canalNotificacao, "dono@cobracerta.com");

    await service.alertar({ job: "disparar-regua-atraso", erro: new Error("timeout") });

    expect(canalNotificacao.chamadas).toEqual([
      {
        destinatario: "dono@cobracerta.com",
        assunto: expect.stringContaining("disparar-regua-atraso") as string,
        corpoHtml: expect.stringContaining("timeout") as string,
      },
    ]);
    expect(canalMensagem.chamadas).toHaveLength(0);
  });

  it("identifica o job e o horário na mensagem, sem exigir consulta ao log do servidor", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();
    const service = new AlertaOperacionalService(canalMensagem, canalNotificacao, "+5511999999999");

    const antes = new Date();
    await service.alertar({ job: "gerar-cobranca", erro: new Error("falha") });
    const depois = new Date();

    const [chamada] = canalMensagem.chamadas;
    expect(chamada).toBeDefined();
    expect(chamada?.texto).toContain("gerar-cobranca");

    const horarioEncontrado = [antes, depois].some((data) =>
      chamada?.texto.includes(data.toISOString().slice(0, 10)),
    );
    expect(horarioEncontrado).toBe(true);
  });

  it("não envia nada e não lança quando não há destino configurado (OBS-R-02)", async () => {
    const canalMensagem = new FakeCanalMensagem();
    const canalNotificacao = new FakeCanalNotificacao();
    const service = new AlertaOperacionalService(canalMensagem, canalNotificacao, undefined);

    await expect(service.alertar({ job: "gerar-cobranca", erro: new Error("falha") })).resolves.toBeUndefined();

    expect(canalMensagem.chamadas).toHaveLength(0);
    expect(canalNotificacao.chamadas).toHaveLength(0);
  });

  it("não lança quando o próprio envio do alerta falha (OBS-R-04)", async () => {
    const canalMensagem = new FakeCanalMensagem();
    canalMensagem.deveFalharPara.add("+5511999999999");
    const canalNotificacao = new FakeCanalNotificacao();
    const service = new AlertaOperacionalService(canalMensagem, canalNotificacao, "+5511999999999");

    await expect(
      service.alertar({ job: "gerar-cobranca", erro: new Error("falha original") }),
    ).resolves.toBeUndefined();
  });
});
