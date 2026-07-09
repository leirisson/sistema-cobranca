import { beforeEach, describe, expect, it } from "vitest";

import { BuscarDetalheCobrancaUseCase } from "../../../../src/application/cobranca/buscar-detalhe-cobranca-use-case.js";
import { FakeDashboardCobrancaQuery } from "../../fakes/fake-dashboard-cobranca-query.js";

describe("BuscarDetalheCobrancaUseCase", () => {
  let query: FakeDashboardCobrancaQuery;
  let useCase: BuscarDetalheCobrancaUseCase;

  beforeEach(() => {
    query = new FakeDashboardCobrancaQuery();
    useCase = new BuscarDetalheCobrancaUseCase(query);
  });

  it("retorna o detalhe da cobrança quando encontrada (FE-DASH-R-04)", async () => {
    query.detalhe = {
      id: "c1",
      nomeCliente: "Maria Silva",
      valor: 150,
      vencimento: new Date("2026-07-10"),
      status: "PENDENTE",
      linkPagamento: "https://sandbox.asaas.com/i/xyz",
      pixCopiaECola: "00020126...",
      origem: "AVULSA",
      descricao: "Serviço extra - troca de peça",
      mensagens: [
        { id: "m1", tipo: "LEMBRETE", canal: "whatsapp", statusEnvio: "ENVIADO", enviadoEm: new Date("2026-07-05") },
      ],
    };

    const resultado = await useCase.executar("c1");

    expect(resultado).toEqual(query.detalhe);
    expect(query.ultimoIdBuscado).toBe("c1");
  });

  it("retorna null quando a cobrança não existe", async () => {
    query.detalhe = null;

    const resultado = await useCase.executar("inexistente");

    expect(resultado).toBeNull();
  });
});
