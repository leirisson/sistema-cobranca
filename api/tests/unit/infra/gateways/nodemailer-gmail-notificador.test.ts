import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

const { NodemailerGmailNotificador } = await import("../../../../src/infra/gateways/nodemailer-gmail-notificador.js");

const CONFIG = {
  usuario: "cobranca@example.com",
  senhaApp: "senha-app-16-digitos",
  remetente: "CobraCerta <cobranca@example.com>",
};

describe("NodemailerGmailNotificador", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    createTransportMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cria o transporter com service gmail e as credenciais de senha de app", () => {
    new NodemailerGmailNotificador(CONFIG);

    expect(createTransportMock).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: CONFIG.usuario, pass: CONFIG.senhaApp },
    });
  });

  it("envia e-mail com destinatario, assunto e corpoHtml corretos", async () => {
    sendMailMock.mockResolvedValueOnce(undefined);
    const notificador = new NodemailerGmailNotificador(CONFIG);

    await notificador.enviarEmail({
      destinatario: "cliente@example.com",
      assunto: "Lembrete de cobrança",
      corpoHtml: "<p>Sua cobrança vence em breve.</p>",
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: CONFIG.remetente,
      to: "cliente@example.com",
      subject: "Lembrete de cobrança",
      html: "<p>Sua cobrança vence em breve.</p>",
    });
  });

  it("propaga erro quando sendMail rejeita", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP indisponível"));
    const notificador = new NodemailerGmailNotificador(CONFIG);

    await expect(
      notificador.enviarEmail({
        destinatario: "cliente@example.com",
        assunto: "assunto",
        corpoHtml: "<p>corpo</p>",
      }),
    ).rejects.toThrow("SMTP indisponível");
  });
});
