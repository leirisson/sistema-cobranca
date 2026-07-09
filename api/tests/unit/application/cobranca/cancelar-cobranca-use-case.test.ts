import { beforeEach, describe, expect, it } from "vitest";

import { CancelarCobrancaUseCase } from "../../../../src/application/cobranca/cancelar-cobranca-use-case.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { CobrancaInvalidaError } from "../../../../src/domain/cobranca/cobranca-invalida-error.js";
import { CobrancaNaoEncontradaError } from "../../../../src/domain/cobranca/cobranca-nao-encontrada-error.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";
import { FakeGatewayPagamento } from "../../fakes/fake-gateway-pagamento.js";

function criarCobrancaPendente() {
  return Cobranca.criar({
    clienteId: "123e4567-e89b-12d3-a456-426614174000",
    valor: 150,
    vencimento: new Date("2026-08-10"),
    gatewayChargeId: "asaas_123",
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  });
}

describe("CancelarCobrancaUseCase", () => {
  let cobrancaRepository: FakeCobrancaRepository;
  let gatewayPagamento: FakeGatewayPagamento;
  let useCase: CancelarCobrancaUseCase;

  beforeEach(() => {
    cobrancaRepository = new FakeCobrancaRepository();
    gatewayPagamento = new FakeGatewayPagamento();
    useCase = new CancelarCobrancaUseCase(cobrancaRepository, gatewayPagamento);
  });

  it("cancela cobrança PENDENTE e persiste o novo status (CANC-R-01)", async () => {
    const cobranca = criarCobrancaPendente();
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(cobranca.id);

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("CANCELADO");
  });

  it("cancela cobrança ATRASADO", async () => {
    const cobranca = criarCobrancaPendente();
    cobranca.marcarComoAtrasada();
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(cobranca.id);

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("CANCELADO");
  });

  it("chama o gateway de pagamento para cancelar a cobrança (CANC-R-04)", async () => {
    const cobranca = criarCobrancaPendente();
    await cobrancaRepository.salvar(cobranca);

    await useCase.executar(cobranca.id);

    expect(gatewayPagamento.cancelamentos).toEqual(["asaas_123"]);
  });

  it("cancela localmente mesmo quando o gateway falha (CANC-R-04)", async () => {
    const cobranca = criarCobrancaPendente();
    await cobrancaRepository.salvar(cobranca);
    gatewayPagamento.deveFalharAoCancelar = true;

    await expect(useCase.executar(cobranca.id)).resolves.not.toThrow();

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("CANCELADO");
  });

  it("lança erro quando a cobrança não existe", async () => {
    await expect(useCase.executar("id-inexistente")).rejects.toThrow(CobrancaNaoEncontradaError);
  });

  it("bloqueia cancelamento de cobrança já PAGO (CANC-R-02)", async () => {
    const cobranca = criarCobrancaPendente();
    cobranca.marcarComoPaga(new Date());
    await cobrancaRepository.salvar(cobranca);

    await expect(useCase.executar(cobranca.id)).rejects.toThrow(CobrancaInvalidaError);
    expect(gatewayPagamento.cancelamentos).toEqual([]);
  });

  it("bloqueia cancelamento de cobrança já CANCELADO (CANC-R-02)", async () => {
    const cobranca = criarCobrancaPendente();
    cobranca.cancelar();
    await cobrancaRepository.salvar(cobranca);

    await expect(useCase.executar(cobranca.id)).rejects.toThrow(CobrancaInvalidaError);
  });
});
