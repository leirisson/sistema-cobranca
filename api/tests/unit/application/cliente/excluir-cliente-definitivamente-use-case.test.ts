import { beforeEach, describe, expect, it } from "vitest";

import { ExcluirClienteDefinitivamenteUseCase } from "../../../../src/application/cliente/excluir-cliente-definitivamente-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { ClienteNaoEncontradoError } from "../../../../src/domain/cliente/cliente-nao-encontrado-error.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";

function criarCliente() {
  return Cliente.criar({
    nome: "Maria Silva",
    documento: "24971563792",
    telefones: [{ numero: "+5511999998888", principal: true }],
    email: "maria@example.com",
    valorCobranca: 150,
    diaVencimento: 10,
    inscricaoEstadual: "123456",
    endereco: { rua: "Rua A", numero: "10", bairro: "Centro", cidade: "Manaus", uf: "AM", cep: "69000-000" },
    nomeContato: "João",
    referenciaServico: "Manutenção veicular",
  });
}

describe("ExcluirClienteDefinitivamenteUseCase", () => {
  let clienteRepository: FakeClienteRepository;
  let cobrancaRepository: FakeCobrancaRepository;
  let useCase: ExcluirClienteDefinitivamenteUseCase;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    cobrancaRepository = new FakeCobrancaRepository();
    useCase = new ExcluirClienteDefinitivamenteUseCase(clienteRepository, cobrancaRepository);
  });

  it("remove fisicamente o cliente sem nenhuma Cobranca associada", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);

    await useCase.executar(cliente.id);

    const buscado = await clienteRepository.buscarPorId(cliente.id);
    expect(buscado).toBeNull();
  });

  it("anonimiza (não remove) o cliente com Cobranca associada (LGPD-R-01)", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-08-10"),
      gatewayChargeId: "asaas_123",
      linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
    });
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(cliente.id);

    const anonimizado = await clienteRepository.buscarPorId(cliente.id);
    expect(anonimizado).not.toBeNull();
    expect(anonimizado!.nome).toBe("Cliente removido");
    expect(anonimizado!.documento).toBe("00000000000");
    expect(anonimizado!.email).toBeNull();
    expect(anonimizado!.endereco).toBeNull();
    expect(anonimizado!.nomeContato).toBeNull();
    expect(anonimizado!.referenciaServico).toBeNull();
    expect(anonimizado!.inscricaoEstadual).toBeNull();
    expect(anonimizado!.telefones).toHaveLength(1);
    expect(anonimizado!.telefonePrincipal?.numero).toBe("+10000000000");
  });

  it("preserva a Cobranca associada após anonimizar o cliente", async () => {
    const cliente = criarCliente();
    await clienteRepository.salvar(cliente);
    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-08-10"),
      gatewayChargeId: "asaas_123",
      linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
    });
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(cliente.id);

    const cobrancaPersistida = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(cobrancaPersistida).not.toBeNull();
    expect(cobrancaPersistida!.clienteId).toBe(cliente.id);
  });

  it("lança erro quando o cliente não existe", async () => {
    await expect(useCase.executar("id-inexistente")).rejects.toThrow(ClienteNaoEncontradoError);
  });
});
