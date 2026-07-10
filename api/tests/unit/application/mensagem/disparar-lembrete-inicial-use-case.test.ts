import { beforeEach, describe, expect, it } from "vitest";

import { DispararLembreteInicialUseCase } from "../../../../src/application/mensagem/disparar-lembrete-inicial-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";
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
  let configuracaoRepository: FakeConfiguracaoRepository;
  let useCase: DispararLembreteInicialUseCase;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    mensagemRepository = new FakeMensagemEnviadaRepository();
    canalMensagem = new FakeCanalMensagem();
    canalNotificacao = new FakeCanalNotificacao();
    configuracaoRepository = new FakeConfiguracaoRepository();
    useCase = new DispararLembreteInicialUseCase(
      clienteRepository,
      mensagemRepository,
      canalMensagem,
      canalNotificacao,
      configuracaoRepository,
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

  it("registra falha sem lançar erro quando o WhatsApp falha e não há e-mail cadastrado (MSG-R-06)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    const cobranca = criarCobranca(cliente.id);

    await expect(useCase.executar(cobranca)).resolves.not.toThrow();

    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.statusEnvio).toBe("FALHA");
    expect(mensagemRepository.mensagens[0]?.canal).toBe("whatsapp");
  });

  it("lança erro se o cliente da cobrança não existir", async () => {
    const cobranca = criarCobranca("cliente-inexistente");

    await expect(useCase.executar(cobranca)).rejects.toThrow();
  });

  it("envia por WhatsApp e por e-mail em paralelo quando o cliente tem os dois canais cadastrados (EMAIL-R-06)", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalMensagem.chamadas).toHaveLength(1);
    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(canalNotificacao.chamadas[0]?.destinatario).toBe("maria@example.com");
    expect(canalNotificacao.chamadas[0]?.corpoHtml).toContain(cobranca.linkPagamento);
    expect(mensagemRepository.mensagens).toHaveLength(2);
    expect(mensagemRepository.mensagens.map((m) => m.canal)).toEqual(
      expect.arrayContaining(["whatsapp", "email"]),
    );
    expect(mensagemRepository.mensagens.every((m) => m.statusEnvio === "ENVIADO")).toBe(true);
  });

  it("registra FALHA no whatsapp e ENVIADO no e-mail quando só o WhatsApp falha (EMAIL-R-05)", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(mensagemRepository.mensagens).toHaveLength(2);
    const porCanal = Object.fromEntries(mensagemRepository.mensagens.map((m) => [m.canal, m.statusEnvio]));
    expect(porCanal.whatsapp).toBe("FALHA");
    expect(porCanal.email).toBe("ENVIADO");
  });

  it("registra FALHA nos dois canais quando WhatsApp e e-mail falham (EMAIL-R-07)", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    canalMensagem.deveFalharPara.add(cliente.telefonePrincipal!.numero);
    canalNotificacao.deveFalharPara.add("maria@example.com");
    const cobranca = criarCobranca(cliente.id);

    await expect(useCase.executar(cobranca)).resolves.not.toThrow();

    expect(mensagemRepository.mensagens).toHaveLength(2);
    expect(mensagemRepository.mensagens.every((m) => m.statusEnvio === "FALHA")).toBe(true);
  });

  it("não tenta enviar e-mail quando o cliente não tem e-mail cadastrado (EMAIL-R-01)", async () => {
    const cliente = criarCliente(undefined, null);
    await clienteRepository.salvar(cliente);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalNotificacao.chamadas).toHaveLength(0);
    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.canal).toBe("whatsapp");
  });

  it("inclui o nome do remetente configurado na mensagem enviada", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const configuracao = await configuracaoRepository.buscar();
    configuracao.atualizarNomeRemetente("Minha Empresa");
    await configuracaoRepository.salvar(configuracao);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalMensagem.chamadas[0]?.texto).toContain("Minha Empresa");
  });

  it("usa a mensagem de cobrança personalizada configurada, no lugar do template fixo", async () => {
    const cliente = criarCliente(undefined, "maria@example.com");
    await clienteRepository.salvar(cliente);
    const configuracao = await configuracaoRepository.buscar();
    configuracao.atualizarMensagemCobrancaPersonalizada("Oi {nome}, sua fatura de {valor} vence {vencimento}: {link}");
    await configuracaoRepository.salvar(configuracao);
    const cobranca = criarCobranca(cliente.id);

    await useCase.executar(cobranca);

    expect(canalMensagem.chamadas[0]?.texto).toContain("Oi Maria Silva, sua fatura de");
    expect(canalMensagem.chamadas[0]?.texto).toContain(cobranca.linkPagamento);
    expect(canalNotificacao.chamadas[0]?.corpoHtml).toContain("Oi Maria Silva");
  });
});
