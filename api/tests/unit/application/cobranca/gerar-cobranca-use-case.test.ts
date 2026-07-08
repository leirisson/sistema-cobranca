import { beforeEach, describe, expect, it } from "vitest";

import { GerarCobrancaUseCase } from "../../../../src/application/cobranca/gerar-cobranca-use-case.js";
import { Cliente } from "../../../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { ClienteInativoError } from "../../../../src/domain/cobranca/cliente-inativo-error.js";
import { CobrancaDuplicadaError } from "../../../../src/domain/cobranca/cobranca-duplicada-error.js";
import { FakeClienteRepository } from "../../fakes/fake-cliente-repository.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";
import { FakeGatewayPagamento } from "../../fakes/fake-gateway-pagamento.js";

const ANTECEDENCIA_DIAS = 5;

describe("GerarCobrancaUseCase", () => {
  let clienteRepository: FakeClienteRepository;
  let cobrancaRepository: FakeCobrancaRepository;
  let gateway: FakeGatewayPagamento;
  let useCase: GerarCobrancaUseCase;

  beforeEach(() => {
    clienteRepository = new FakeClienteRepository();
    cobrancaRepository = new FakeCobrancaRepository();
    gateway = new FakeGatewayPagamento();
    useCase = new GerarCobrancaUseCase(
      clienteRepository,
      cobrancaRepository,
      gateway,
      ANTECEDENCIA_DIAS,
    );
  });

  function clienteAtivo(diaVencimento: number) {
    return Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento,
    });
  }

  it("gera cobrança no gateway e persiste como PENDENTE quando vencimento está na janela de antecedência (COB-R-01, COB-R-02)", async () => {
    const cliente = clienteAtivo(10);
    await clienteRepository.salvar(cliente);
    const hoje = new Date("2026-08-05T00:00:00Z");

    await useCase.executar(hoje);

    expect(gateway.chamadas).toHaveLength(1);
    expect(cobrancaRepository.cobrancas).toHaveLength(1);
    const cobranca = cobrancaRepository.cobrancas[0]!;
    expect(cobranca.clienteId).toBe(cliente.id);
    expect(cobranca.status).toBe("PENDENTE");
    expect(cobranca.gatewayChargeId).toBe("asaas_1");
    expect(cobranca.vencimento.getUTCDate()).toBe(10);
  });

  it("não gera cobrança quando vencimento está fora da janela de antecedência", async () => {
    const cliente = clienteAtivo(25);
    await clienteRepository.salvar(cliente);
    const hoje = new Date("2026-08-05T00:00:00Z");

    await useCase.executar(hoje);

    expect(gateway.chamadas).toHaveLength(0);
    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });

  it("não gera cobrança para cliente INATIVO (COB-R-05)", async () => {
    const cliente = clienteAtivo(10);
    cliente.inativar();
    await clienteRepository.salvar(cliente);
    const hoje = new Date("2026-08-05T00:00:00Z");

    await useCase.executar(hoje);

    expect(gateway.chamadas).toHaveLength(0);
    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });

  it("não gera segunda cobrança para o mesmo ciclo do cliente (COB-R-04)", async () => {
    const cliente = clienteAtivo(10);
    await clienteRepository.salvar(cliente);
    const cobrancaExistente = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-08-10"),
      gatewayChargeId: "asaas_existente",
      linkPagamento: "https://sandbox.asaas.com/i/asaas_existente",
    });
    await cobrancaRepository.salvar(cobrancaExistente);
    const hoje = new Date("2026-08-05T00:00:00Z");

    await useCase.executar(hoje);

    expect(gateway.chamadas).toHaveLength(0);
    expect(cobrancaRepository.cobrancas).toHaveLength(1);
  });

  it("propaga erro do gateway sem persistir cobrança inconsistente (COB-R-03)", async () => {
    const cliente = clienteAtivo(10);
    await clienteRepository.salvar(cliente);
    gateway.deveFalhar = true;
    const hoje = new Date("2026-08-05T00:00:00Z");

    await expect(useCase.executar(hoje)).rejects.toThrow();

    expect(cobrancaRepository.cobrancas).toHaveLength(0);
  });
});

describe("ClienteInativoError e CobrancaDuplicadaError", () => {
  it("são instâncias de erro de domínio nomeadas", () => {
    expect(new ClienteInativoError("id-1").name).toBe("ClienteInativoError");
    expect(new CobrancaDuplicadaError("id-1").name).toBe("CobrancaDuplicadaError");
  });
});
