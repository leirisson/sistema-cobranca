import { beforeEach, describe, expect, it } from "vitest";

import { DispararLembreteInicialUseCase } from "../../../../src/application/mensagem/disparar-lembrete-inicial-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeMensagemEnviadaRepository } from "../../fakes/fake-mensagem-enviada-repository.js";

function criarCliente(telefone = "+5511999998888", email?: string | null) {
  return Cliente.criar({
    nome: "Maria Silva",
    documento: "12345678900",
    telefones: [{ numero: telefone, principal: true }],
    email,
    valorCobranca: 150,
    diaVencimento: 10,
  });
}

function criarCobranca(clienteId: string) {
  return Cobranca.criar({
    clienteId,
    valor: 150,
    vencimento: new Date("2026-08-10"),
    gatewayChargeId: "asaas_123",
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  });
}

describe("DispararLembreteInicialUseCase", () => {
  let clienteRepository: FakeClienteRepository;
  let mensagemRepository: FakeMensagemEnviadaRepository;
  let canalMensagem: FakeCanalMensagem;
  let canalNotificacao: FakeCanalNotificacao;
  let useCase: DispararLembreteInicialUseCase;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    mensagemRepository = new FakeMensagemEnviadaRepository();
    canalMensagem = new FakeCanalMensagem();
    canalNotificacao = new FakeCanalNotificacao();
    useCase = new DispararLembreteInicialUseCase(
      clienteRepository,
      mensagemRepository,
      canalMensagem,
      canalNotificacao,
    );
  });

  it("envia lembrete pro telefone principal do cliente com nome, valor, vencimento e link (MSG-R-01)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalMensagem.chamadas).toHaveLength(1);
    expect(canalMensagem.chamadas[0]?.telefone).toBe("+5511999998888");
    expect(canalMensagem.chamadas[0]?.texto).toContain("Maria Silva");
    expect(canalMensagem.chamadas[0]?.texto).toContain(cobranca.linkPagamento);
  });

  it("registra MensagemEnviada com tipo LEMBRETE e status ENVIADO (MSG-R-05)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.tipo).toBe("LEMBRETE");
    expect(mensagemRepository.mensagens[0]?.statusEnvio).toBe("ENVIADO");
    expect(mensagemRepository.mensagens[0]?.cobrancaId).toBe(cobranca.id);
  });

  it("registra falha sem lançar erro quando o canal falha e não há e-mail de fallback (MSG-R-06)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    const cobranca = criarCobranca(cliente.id);

    await expect(useCase.executar(cobranca)).resolves.not.toThrow();

    expect(mensagemRepository.mensagens[0]?.statusEnvio).toBe("FALHA");
    expect(mensagemRepository.mensagens[0]?.canal).toBe("whatsapp");
  });

  it("lança erro se o cliente da cobrança não existir", async () => {
    const cobranca = criarCobranca("cliente-inexistente");

    await expect(useCase.executar(cobranca)).rejects.toThrow();
  });

  it("registra canal whatsapp quando o envio por WhatsApp funciona (EMAIL-R-06)", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(0);
    expect(mensagemRepository.mensagens[0]?.canal).toBe("whatsapp");
  });

  it("tenta fallback por e-mail quando o WhatsApp falha e o cliente tem e-mail cadastrado (EMAIL-R-05)", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(canalNotificacao.chamadas[0]?.destinatario).toBe("maria@example.com");
    expect(canalNotificacao.chamadas[0]?.corpoHtml).toContain(cobranca.linkPagamento);
    expect(mensagemRepository.mensagens[0]?.statusEnvio).toBe("ENVIADO");
    expect(mensagemRepository.mensagens[0]?.canal).toBe("email");
  });

  it("registra FALHA quando WhatsApp e o fallback por e-mail falham (EMAIL-R-07)", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    canalNotificacao.deveFalharPara.add("maria@example.com");
    const cobranca = criarCobranca(cliente.id);

    await expect(useCase.executar(cobranca)).resolves.not.toThrow();

    expect(mensagemRepository.mensagens[0]?.statusEnvio).toBe("FALHA");
    expect(mensagemRepository.mensagens[0]?.canal).toBe("email");
  });

  it("não tenta fallback por e-mail quando o cliente não tem e-mail cadastrado (EMAIL-R-01)", async () => {
    const cliente = criarCliente(undefined, null);
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(0);
    expect(mensagemRepository.mensagens[0]?.statusEnvio).toBe("FALHA");
    expect(mensagemRepository.mensagens[0]?.canal).toBe("whatsapp");
  });
});
