import { beforeEach, describe, expect, it } from "vitest";

import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { MensagemNotificadorConfirmacao } from "../../../../src/infra/notificacoes/mensagem-notificador-confirmacao.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";
import { FakeMensagemEnviadaRepository } from "../../fakes/fake-mensagem-enviada-repository.js";

function criarCliente(email: string | null = "maria@example.com") {
  return Cliente.criar({
    nome: "Maria Silva",
    documento: "12345678900",
    telefones: [{ numero: "+5511999998888", principal: true }],
    email,
    valorCobranca: 150,
    diaVencimento: 10,
  });
}

function criarCobranca(clienteId: string) {
  const cobranca = Cobranca.criar({
    clienteId,
    valor: 150,
    vencimento: new Date("2026-08-10"),
    gatewayChargeId: "asaas_123",
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  });
  cobranca.marcarComoPaga(new Date("2026-08-09"));
  return cobranca;
}

describe("MensagemNotificadorConfirmacao", () => {
  let clienteRepository: FakeClienteRepository;
  let mensagemRepository: FakeMensagemEnviadaRepository;
  let canalMensagem: FakeCanalMensagem;
  let canalNotificacao: FakeCanalNotificacao;
  let configuracaoRepository: FakeConfiguracaoRepository;
  let notificador: MensagemNotificadorConfirmacao;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    mensagemRepository = new FakeMensagemEnviadaRepository();
    canalMensagem = new FakeCanalMensagem();
    canalNotificacao = new FakeCanalNotificacao();
    configuracaoRepository = new FakeConfiguracaoRepository();
    notificador = new MensagemNotificadorConfirmacao(
      clienteRepository,
      mensagemRepository,
      canalMensagem,
      canalNotificacao,
      configuracaoRepository,
    );
  });

  it("envia confirmação por WhatsApp e por e-mail em paralelo, registrando MensagemEnviada tipo CONFIRMACAO pra cada canal (PAG-R-05)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await notificador.notificarPagamentoConfirmado(cobranca);

    expect(canalMensagem.chamadas).toHaveLength(1);
    expect(canalMensagem.chamadas[0]?.texto).toContain("Maria Silva");
    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(mensagemRepository.mensagens).toHaveLength(2);
    expect(mensagemRepository.mensagens.every((m) => m.tipo === "CONFIRMACAO")).toBe(true);
    expect(mensagemRepository.mensagens.every((m) => m.statusEnvio === "ENVIADO")).toBe(true);
    expect(mensagemRepository.mensagens.map((m) => m.canal)).toEqual(
      expect.arrayContaining(["whatsapp", "email"]),
    );
  });

  it("registra ENVIADO no e-mail mesmo quando o WhatsApp falha (EMAIL-R-05)", async () => {
    const cliente = criarCliente("maria@example.com");
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    const cobranca = criarCobranca(cliente.id);

    await notificador.notificarPagamentoConfirmado(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(mensagemRepository.mensagens).toHaveLength(2);
    const porCanal = Object.fromEntries(mensagemRepository.mensagens.map((m) => [m.canal, m.statusEnvio]));
    expect(porCanal.whatsapp).toBe("FALHA");
    expect(porCanal.email).toBe("ENVIADO");
  });

  it("não tenta enviar e-mail quando o cliente não tem e-mail cadastrado", async () => {
    const cliente = criarCliente(null);
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await notificador.notificarPagamentoConfirmado(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(0);
    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.canal).toBe("whatsapp");
  });

  it("inclui o nome do remetente configurado na confirmação", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const configuracao = await configuracaoRepository.buscar();
    configuracao.atualizarNomeRemetente("Minha Empresa");
    await configuracaoRepository.salvar(configuracao);
    const cobranca = criarCobranca(cliente.id);

    await notificador.notificarPagamentoConfirmado(cobranca);

    expect(canalMensagem.chamadas[0]?.texto).toContain("Minha Empresa");
  });
});
