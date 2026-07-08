import { beforeEach, describe, expect, it } from "vitest";

import { ConfirmarPagamentoUseCase } from "../../../../src/application/cobranca/confirmar-pagamento-use-case.js";
import { Cobranca } from "../../../../src/domain/cobranca/cobranca.js";
import { CobrancaNaoEncontradaError } from "../../../../src/domain/cobranca/cobranca-nao-encontrada-error.js";
import { FakeCobrancaRepository } from "../../fakes/fake-cobranca-repository.js";
import { FakeNotificadorConfirmacao } from "../../fakes/fake-notificador-confirmacao.js";

function criarCobrancaPendente() {
  return Cobranca.criar({
    clienteId: "123e4567-e89b-12d3-a456-426614174000",
    valor: 150,
    vencimento: new Date("2026-08-10"),
    gatewayChargeId: "asaas_123",
    linkPagamento: "https://sandbox.asaas.com/i/asaas_123",
  });
}

describe("ConfirmarPagamentoUseCase", () => {
  let cobrancaRepository: FakeCobrancaRepository;
  let notificador: FakeNotificadorConfirmacao;

  function criarUseCase(confirmacaoHabilitada: boolean) {
    return new ConfirmarPagamentoUseCase(cobrancaRepository, notificador, confirmacaoHabilitada);
  }

  beforeEach(() => {
    cobrancaRepository = new FakeCobrancaRepository();
    notificador = new FakeNotificadorConfirmacao();
  });

  it("marca cobrança como paga e registra paidAt (PAG-R-03)", async () => {
    const cobranca = criarCobrancaPendente();
    await cobrancaRepository.salvar(cobranca);
    const useCase = criarUseCase(false);
    const paidAt = new Date("2026-08-09T12:00:00Z");

    await useCase.executar({ gatewayChargeId: "asaas_123", paidAt });

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("PAGO");
    expect(atualizada?.paidAt).toEqual(paidAt);
  });

  it("lança erro quando gatewayChargeId não corresponde a nenhuma cobrança", async () => {
    const useCase = criarUseCase(false);

    await expect(
      useCase.executar({ gatewayChargeId: "asaas_inexistente", paidAt: new Date() }),
    ).rejects.toThrow(CobrancaNaoEncontradaError);
  });

  it("ignora webhook para cobrança já paga, sem lançar erro (PAG-R-04, idempotência)", async () => {
    const cobranca = criarCobrancaPendente();
    cobranca.marcarComoPaga(new Date("2026-08-08"));
    await cobrancaRepository.salvar(cobranca);
    const useCase = criarUseCase(false);

    await expect(
      useCase.executar({ gatewayChargeId: "asaas_123", paidAt: new Date("2026-08-09") }),
    ).resolves.not.toThrow();

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.paidAt).toEqual(new Date("2026-08-08"));
  });

  it("ignora webhook para cobrança cancelada, sem lançar erro (PAG-R-04, idempotência)", async () => {
    const cobranca = criarCobrancaPendente();
    cobranca.cancelar();
    await cobrancaRepository.salvar(cobranca);
    const useCase = criarUseCase(false);

    await expect(
      useCase.executar({ gatewayChargeId: "asaas_123", paidAt: new Date() }),
    ).resolves.not.toThrow();

    const atualizada = await cobrancaRepository.buscarPorId(cobranca.id);
    expect(atualizada?.status).toBe("CANCELADO");
  });

  it("dispara notificação de confirmação quando o toggle está habilitado (PAG-R-05)", async () => {
    const cobranca = criarCobrancaPendente();
    await cobrancaRepository.salvar(cobranca);
    const useCase = criarUseCase(true);

    await useCase.executar({ gatewayChargeId: "asaas_123", paidAt: new Date() });

    expect(notificador.chamadas).toHaveLength(1);
    expect(notificador.chamadas[0]?.id).toBe(cobranca.id);
  });

  it("não dispara notificação quando o toggle está desabilitado", async () => {
    const cobranca = criarCobrancaPendente();
    await cobrancaRepository.salvar(cobranca);
    const useCase = criarUseCase(false);

    await useCase.executar({ gatewayChargeId: "asaas_123", paidAt: new Date() });

    expect(notificador.chamadas).toHaveLength(0);
  });

  it("não dispara notificação quando o webhook é ignorado por idempotência", async () => {
    const cobranca = criarCobrancaPendente();
    cobranca.marcarComoPaga(new Date("2026-08-08"));
    await cobrancaRepository.salvar(cobranca);
    const useCase = criarUseCase(true);

    await useCase.executar({ gatewayChargeId: "asaas_123", paidAt: new Date("2026-08-09") });

    expect(notificador.chamadas).toHaveLength(0);
  });
});
