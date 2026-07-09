import { beforeEach, describe, expect, it } from "vitest";

import { CriarCobrancaManualUseCase } from "../../../../src/application/cobranca/criar-cobranca-manual-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteInvalidoError } from "../../../../src/domain/cliente/cliente-invalido-error.js";
import { ClienteNaoEncontradoError } from "../../../../src/domain/cliente/cliente-nao-encontrado-error.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";
import { FakeGatewayPagamento } from "../../fakes/fake-gateway-pagamento.js";

describe("CriarCobrancaManualUseCase", () => {
  let clienteRepository: FakeClienteRepository;
  let cobrancaRepository: FakeCobrancaRepository;
  let gateway: FakeGatewayPagamento;
  let useCase: CriarCobrancaManualUseCase;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    cobrancaRepository = new FakeCobrancaRepository();
    gateway = new FakeGatewayPagamento();
    useCase = new CriarCobrancaManualUseCase(clienteRepository, cobrancaRepository, gateway);
  });

  function clienteAtivo() {
    return Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
  }

  it("cria cobrança avulsa no gateway e persiste como PENDENTE com origem AVULSA (AVULSA-R-01)", async () => {
    const cliente = clienteAtivo();
    await clienteRepository.salvar(cliente);
    const vencimento = new Date("2026-08-20T00:00:00Z");

    const cobranca = await useCase.executar({
      clienteId: cliente.id,
      valor: 300,
      vencimento,
      descricao: "Serviço extra - troca de peça",
    });

    expect(gateway.chamadas).toHaveLength(1);
    expect(gateway.chamadas[0]).toMatchObject({
      clienteId: cliente.id,
      valor: 300,
      vencimento,
      nomeCliente: cliente.nome,
      documentoCliente: cliente.documento,
      emailCliente: cliente.email,
    });
    expect(cobrancaRepository.cobrancas).toHaveLength(1);
    expect(cobranca.status).toBe("PENDENTE");
    expect(cobranca.valor).toBe(300);
    expect(cobranca.vencimento).toEqual(vencimento);
    expect(cobranca.gatewayChargeId).toBe("asaas_1");
    expect(cobranca.origem).toBe("AVULSA");
    expect(cobranca.descricao).toBe("Serviço extra - troca de peça");
  });

  it("permite criar cobrança avulsa sem descrição (opcional)", async () => {
    const cliente = clienteAtivo();
    await clienteRepository.salvar(cliente);

    const cobranca = await useCase.executar({
      clienteId: cliente.id,
      valor: 300,
      vencimento: new Date("2026-08-20T00:00:00Z"),
    });

    expect(cobranca.descricao).toBeNull();
  });

  it("permite criar cobrança avulsa mesmo já existindo cobrança para o mesmo ciclo do cliente (AVULSA-R-05)", async () => {
    const cliente = clienteAtivo();
    await clienteRepository.salvar(cliente);
    const cobrancaExistente = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-08-10"),
      gatewayChargeId: "asaas_existente",
      linkPagamento: "https://sandbox.asaas.com/i/asaas_existente",
    });
    await cobrancaRepository.salvar(cobrancaExistente);

    const cobranca = await useCase.executar({
      clienteId: cliente.id,
      valor: 80,
      vencimento: new Date("2026-08-15T00:00:00Z"),
    });

    expect(gateway.chamadas).toHaveLength(1);
    expect(cobrancaRepository.cobrancas).toHaveLength(2);
    expect(cobranca.valor).toBe(80);
  });

  it("lança ClienteNaoEncontradoError quando clienteId não existe", async () => {
    await expect(
      useCase.executar({ clienteId: "id-inexistente", valor: 100, vencimento: new Date("2026-08-20") }),
    ).rejects.toThrow(ClienteNaoEncontradoError);

    expect(gateway.chamadas).toHaveLength(0);
    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });

  it("lança ClienteInvalidoError quando cliente está INATIVO", async () => {
    const cliente = clienteAtivo();
    cliente.inativar();
    await clienteRepository.salvar(cliente);

    await expect(
      useCase.executar({ clienteId: cliente.id, valor: 100, vencimento: new Date("2026-08-20") }),
    ).rejects.toThrow(ClienteInvalidoError);

    expect(gateway.chamadas).toHaveLength(0);
    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });

  it("rejeita valor inválido sem chamar o gateway de pagamento", async () => {
    const cliente = clienteAtivo();
    await clienteRepository.salvar(cliente);

    await expect(
      useCase.executar({ clienteId: cliente.id, valor: 0, vencimento: new Date("2026-08-20") }),
    ).rejects.toThrow();

    expect(gateway.chamadas).toHaveLength(0);
    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });

  it("propaga erro do gateway sem persistir cobrança inconsistente", async () => {
    const cliente = clienteAtivo();
    await clienteRepository.salvar(cliente);
    gateway.deveFalhar = true;

    await expect(
      useCase.executar({ clienteId: cliente.id, valor: 100, vencimento: new Date("2026-08-20") }),
    ).rejects.toThrow();

    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });
});
