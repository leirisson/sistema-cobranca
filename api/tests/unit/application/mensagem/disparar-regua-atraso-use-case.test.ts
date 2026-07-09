import { beforeEach, describe, expect, it } from "vitest";

import { DispararReguaAtrasoUseCase } from "../../../../src/application/mensagem/disparar-regua-atraso-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { FakeCanalMensagem } from "../../fakes/fake-canal-mensagem.js";
import { FakeCanalNotificacao } from "../../fakes/fake-canal-notificacao.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";
import { FakeConfiguracaoRepository } from "../../fakes/fake-configuracao-repository.js";
import { FakeMensagemEnviadaRepository } from "../../fakes/fake-mensagem-enviada-repository.js";

function criarCliente() {
  return Cliente.criar({
    nome: "Maria Silva",
    documento: "12345678900",
    telefones: [{ numero: "+5511999998888", principal: true }],
    valorCobranca: 150,
    diaVencimento: 10,
  });
}

function criarCobranca(clienteId: string, vencimento: Date) {
  return Cobranca.criar({
    clienteId,
    valor: 150,
    vencimento,
    gatewayChargeId: "asaas_123",
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  });
}

describe("DispararReguaAtrasoUseCase", () => {
  let clienteRepository: FakeClienteRepository;
  let cobrancaRepository: FakeCobrancaRepository;
  let mensagemRepository: FakeMensagemEnviadaRepository;
  let canalMensagem: FakeCanalMensagem;
  let canalNotificacao: FakeCanalNotificacao;
  let configuracaoRepository: FakeConfiguracaoRepository;
  let useCase: DispararReguaAtrasoUseCase;
  let cliente: Cliente;

  beforeEach(async () => {
    clienteRepository = new FakeClienteRepository();
    cobrancaRepository = new FakeCobrancaRepository();
    mensagemRepository = new FakeMensagemEnviadaRepository();
    canalMensagem = new FakeCanalMensagem();
    canalNotificacao = new FakeCanalNotificacao();
    configuracaoRepository = new FakeConfiguracaoRepository();
    useCase = new DispararReguaAtrasoUseCase(
      clienteRepository,
      cobrancaRepository,
      mensagemRepository,
      canalMensagem,
      canalNotificacao,
      configuracaoRepository,
    );
    cliente = criarCliente();
    await clienteRepository.salvar(cliente);
  });

  it("dispara mensagem de VENCIMENTO no dia do vencimento - D0 (MSG-R-02)", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-10"));

    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.tipo).toBe("VENCIMENTO");
  });

  it("dispara mensagem de ATRASO em D+1 (MSG-R-03)", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-11"));

    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.tipo).toBe("ATRASO");
  });

  it("dispara novo lembrete de ATRASO em D+3 (MSG-R-03)", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-13"));

    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(mensagemRepository.mensagens[0]?.tipo).toBe("ATRASO");
  });

  it("não dispara nada fora dos marcos D0/D+1/D+3", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-12"));

    expect(mensagemRepository.mensagens).toHaveLength(0);
    expect(canalMensagem.chamadas).toHaveLength(0);
  });

  it("não dispara mensagem para cobrança já PAGA (MSG-R-04)", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    cobranca.marcarComoPaga(new Date("2026-08-09"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-10"));

    expect(mensagemRepository.mensagens).toHaveLength(0);
    expect(canalMensagem.chamadas).toHaveLength(0);
  });

  it("não dispara mensagem para cobrança CANCELADA", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    cobranca.cancelar();
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-10"));

    expect(mensagemRepository.mensagens).toHaveLength(0);
  });

  it("não duplica envio do mesmo tipo pra mesma cobrança (idempotência, ex: cron rodando 2x)", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-10"));
    await useCase.executar(new Date("2026-08-10"));

    expect(mensagemRepository.mensagens).toHaveLength(1);
    expect(canalMensagem.chamadas).toHaveLength(1);
  });

  it("marca cobrança como ATRASADA ao disparar mensagem de atraso em D+1", async () => {
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-11"));

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("ATRASADO");
  });

  it("registra falha e continua processando as demais cobranças da fila (MSG-R-06)", async () => {
    const outroCliente = Cliente.criar({
      nome: "João Souza",
      documento: "98765432100",
      telefones: [{ numero: "+5511988887777", principal: true }],
      valorCobranca: 200,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(outroCliente);

    const cobrancaComFalha = criarCobranca(cliente.id, new Date("2026-08-10"));
    const cobrancaOk = criarCobranca(outroCliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobrancaComFalha);
    await cobrancaRepository.salvar(cobrancaOk);
    canalMensagem.deveFalharPara.add("+5511999998888");

    await useCase.executar(new Date("2026-08-10"));

    expect(mensagemRepository.mensagens).toHaveLength(2);
    const falha = mensagemRepository.mensagens.find((m) => m.cobrancaId === cobrancaComFalha.id);
    const sucesso = mensagemRepository.mensagens.find((m) => m.cobrancaId === cobrancaOk.id);
    expect(falha?.statusEnvio).toBe("FALHA");
    expect(sucesso?.statusEnvio).toBe("ENVIADO");
  });

  it("envia por WhatsApp e por e-mail em paralelo quando o cliente tem os dois canais cadastrados (EMAIL-R-05)", async () => {
    const clienteComEmail = Cliente.criar({
      nome: "Ana Souza",
      documento: "98765432100",
      telefones: [{ numero: "+5511977776666", principal: true }],
      email: "ana@example.com",
      valorCobranca: 200,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(clienteComEmail);

    const cobranca = criarCobranca(clienteComEmail.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-10"));

    expect(canalNotificacao.chamadas).toHaveLength(1);
    expect(canalNotificacao.chamadas[0]?.destinatario).toBe("ana@example.com");
    expect(mensagemRepository.mensagens).toHaveLength(2);
    expect(mensagemRepository.mensagens.every((m) => m.statusEnvio === "ENVIADO")).toBe(true);
    expect(mensagemRepository.mensagens.map((m) => m.canal)).toEqual(
      expect.arrayContaining(["whatsapp", "email"]),
    );
  });

  it("inclui o nome do remetente configurado na mensagem enviada", async () => {
    const configuracao = await configuracaoRepository.buscar();
    configuracao.atualizarNomeRemetente("Minha Empresa");
    await configuracaoRepository.salvar(configuracao);
    const cobranca = criarCobranca(cliente.id, new Date("2026-08-10"));
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(new Date("2026-08-10"));

    expect(canalMensagem.chamadas[0]?.texto).toContain("Minha Empresa");
  });
});
