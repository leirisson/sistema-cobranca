import { describe, expect, it } from "vitest";

import { MensagemEnviada } from "../../../../src/domain/mensagem/mensagem-enviada.js";
import { MensagemInvalidaError } from "../../../../src/domain/mensagem/mensagem-invalida-error.js";

function dadosValidos() {
  return {
    cobrancaId: "123e4567-e89b-12d3-a456-426614174000",
    tipo: "LEMBRETE" as const,
    statusEnvio: "ENVIADO" as const,
  };
}

describe("MensagemEnviada", () => {
  it("cria registro de mensagem enviada com enviadoEm preenchido (MSG-R-05)", () => {
    const mensagem = MensagemEnviada.criar(dadosValidos());

    expect(mensagem.id).toBeDefined();
    expect(mensagem.cobrancaId).toBe(dadosValidos().cobrancaId);
    expect(mensagem.tipo).toBe("LEMBRETE");
    expect(mensagem.statusEnvio).toBe("ENVIADO");
    expect(mensagem.enviadoEm).toBeInstanceOf(Date);
  });

  it("rejeita mensagem sem cobrancaId", () => {
    expect(() => MensagemEnviada.criar({ ...dadosValidos(), cobrancaId: "" })).toThrow(MensagemInvalidaError);
  });

  it("aceita os quatro tipos previstos (LEMBRETE, VENCIMENTO, ATRASO, CONFIRMACAO)", () => {
    for (const tipo of ["LEMBRETE", "VENCIMENTO", "ATRASO", "CONFIRMACAO"] as const) {
      expect(() => MensagemEnviada.criar({ ...dadosValidos(), tipo })).not.toThrow();
    }
  });

  it("aceita status de envio ENVIADO ou FALHA (MSG-R-06)", () => {
    expect(() => MensagemEnviada.criar({ ...dadosValidos(), statusEnvio: "ENVIADO" })).not.toThrow();
    expect(() => MensagemEnviada.criar({ ...dadosValidos(), statusEnvio: "FALHA" })).not.toThrow();
  });

  it("restaura um registro existente sem reaplicar enviadoEm padrão", () => {
    const mensagem = MensagemEnviada.restaurar({
      id: "223e4567-e89b-12d3-a456-426614174000",
      cobrancaId: dadosValidos().cobrancaId,
      tipo: "ATRASO",
      statusEnvio: "FALHA",
      enviadoEm: new Date("2026-08-05"),
    });

    expect(mensagem.tipo).toBe("ATRASO");
    expect(mensagem.statusEnvio).toBe("FALHA");
    expect(mensagem.enviadoEm).toEqual(new Date("2026-08-05"));
  });
});
