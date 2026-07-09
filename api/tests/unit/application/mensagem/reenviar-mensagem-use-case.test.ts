import { beforeEach, describe, expect, it } from "vitest";

import { ReenviarMensagemUseCase } from "../../../../src/application/mensagem/reenviar-mensagem-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { CobrancaInvalidaError } from "../../../../src/domain/cobranca/cobranca-invalida-error.js";
import { CobrancaNaoEncontradaError } from "../../../../src/domain/cobranca/cobranca-nao-encontrada-error.js";
import { MensagemEnviada } from "../../../../src/domain/mensagem/mensagem-enviada.js";
import { MensagemInvalidaError } from "../../../../src/domain/mensagem/mensagem-invalida-error.js";
import { MensagemNaoEncontradaError } from "../../../../src/domain/mensagem/mensagem-nao-encontrada-error.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";
import { FakeMensagemEnviadaRepository } from "../../fakes/fake-mensagem-enviada-repository.js";

function criarCliente() {
  return Cliente.criar({
    nome: "Maria Silva",
    documento: "24971563792",
    telefones: [{ numero: "+5511999998888", principal: true }],
    email: "maria@example.com",
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

describe("ReenviarMensagemUseCase", () => {
  let clienteRepository: FakeClienteRepository;
  let cobrancaRepository: FakeCobrancaRepository;
  let mensagemEnviadaRepository: FakeMensagemEnviadaRepository;
  let canalMensagem: FakeCanalMensagem;
  let canalNotificacao: FakeCanalNotificacao;
  let configuracaoRepository: FakeConfiguracaoRepository;
  let useCase: ReenviarMensagemUseCase;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    cobrancaRepository = new FakeCobrancaRepository();
    mensagemEnviadaRepository = new FakeMensagemEnviadaRepository();
    canalMensagem = new FakeCanalMensagem();
    canalNotificacao = new FakeCanalNotificacao();
    configuracaoRepository = new FakeConfiguracaoRepository();
    useCase = new ReenviarMensagemUseCase(
      clienteRepository,
      cobrancaRepository,
      mensagemEnviadaRepository,
      canalMensagem,
      canalNotificacao,
      configuracaoRepository,
    );
  });

  it("reenvia pelo mesmo canal (whatsapp) e registra novo MensagemEnviada sem sobrescrever o original (REENVIO-R-01)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "LEMBRETE", statusEnvio: "FALHA", canal: "whatsapp" });
    await mensagemEnviadaRepository.salvar(original);

    const resultado = await useCase.executar(original.id);

    expect(resultado.canal).toBe("whatsapp");
    expect(resultado.statusEnvio).toBe("ENVIADO");
    expect(mensagemEnviadaRepository.mensagens).toHaveLength(2);
    expect(mensagemEnviadaRepository.mensagens[0]).toBe(original);
    expect(mensagemEnviadaRepository.mensagens[0]?.statusEnvio).toBe("FALHA");
    expect(canalMensagem.chamadas).toHaveLength(1);
    expect(canalNotificacao.chamadas).toHaveLength(0);
  });

  it("reenvia pelo mesmo canal (email) sem tentar whatsapp (regra: mesmo canal do registro original)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "VENCIMENTO", statusEnvio: "FALHA", canal: "email" });
    await mensagemEnviadaRepository.salvar(original);

    const resultado = await useCase.executar(original.id);

    expect(resultado.canal).toBe("email");
    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(canalMensagem.chamadas).toHaveLength(0);
  });

  it("reconstrói o texto de CONFIRMACAO usando o template dedicado", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "CONFIRMACAO", statusEnvio: "FALHA", canal: "whatsapp" });
    await mensagemEnviadaRepository.salvar(original);

    await useCase.executar(original.id);

    expect(canalMensagem.chamadas[0]?.texto).toContain("Confirmamos o recebimento");
  });

  it("registra nova FALHA quando o reenvio falha de novo, permitindo nova tentativa (REENVIO-R-03)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "LEMBRETE", statusEnvio: "FALHA", canal: "whatsapp" });
    await mensagemEnviadaRepository.salvar(original);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);

    const resultado = await useCase.executar(original.id);

    expect(resultado.statusEnvio).toBe("FALHA");
    expect(mensagemEnviadaRepository.mensagens).toHaveLength(2);

    await expect(useCase.executar(original.id)).resolves.toBeDefined();
    expect(mensagemEnviadaRepository.mensagens).toHaveLength(3);
  });

  it("lança erro quando a mensagem original não existe", async () => {
    await expect(useCase.executar("id-inexistente")).rejects.toThrow(MensagemNaoEncontradaError);
  });

  it("lança erro quando a mensagem original não está com statusEnvio FALHA", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "LEMBRETE", statusEnvio: "ENVIADO", canal: "whatsapp" });
    await mensagemEnviadaRepository.salvar(original);

    await expect(useCase.executar(original.id)).rejects.toThrow(MensagemInvalidaError);
    expect(canalMensagem.chamadas).toHaveLength(0);
  });

  it("lança erro quando a cobrança da mensagem não existe mais", async () => {
    const original = MensagemEnviada.criar({ cobrancaId: "cobranca-orfa", tipo: "LEMBRETE", statusEnvio: "FALHA" });
    await mensagemEnviadaRepository.salvar(original);

    await expect(useCase.executar(original.id)).rejects.toThrow(CobrancaNaoEncontradaError);
  });

  it("bloqueia reenvio quando a cobrança está PAGO (REENVIO-R-04)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    cobranca.marcarComoPaga(new Date());
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "LEMBRETE", statusEnvio: "FALHA" });
    await mensagemEnviadaRepository.salvar(original);

    await expect(useCase.executar(original.id)).rejects.toThrow(CobrancaInvalidaError);
    expect(canalMensagem.chamadas).toHaveLength(0);
  });

  it("bloqueia reenvio quando a cobrança está CANCELADO (REENVIO-R-04)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);
    cobranca.cancelar();
    await cobrancaRepository.salvar(cobranca);
    const original = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "LEMBRETE", statusEnvio: "FALHA" });
    await mensagemEnviadaRepository.salvar(original);

    await expect(useCase.executar(original.id)).rejects.toThrow(CobrancaInvalidaError);
  });
});
