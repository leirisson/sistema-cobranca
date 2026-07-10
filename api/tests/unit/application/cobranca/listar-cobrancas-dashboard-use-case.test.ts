import { beforeEach, describe, expect, it } from "vitest";

import { ListarCobrancasDashboardUseCase } from "../../../../src/application/cobranca/listar-cobrancas-dashboard-use-case.js";
import { FakeDashboardCobrancaQuery } from "../../fakes/fake-dashboard-cobranca-query.js";

describe("ListarCobrancasDashboardUseCase", () => {
  let query: FakeDashboardCobrancaQuery;
  let useCase: ListarCobrancasDashboardUseCase;

  beforeEach(() => {
    query = new FakeDashboardCobrancaQuery();
    useCase = new ListarCobrancasDashboardUseCase(query);
  });

  it("usa o mês/ano corrente por padrão quando nenhum filtro é informado (DASH-R-01)", async () => {
    const referencia = new Date("2026-07-15T12:00:00Z");

    await useCase.executar({}, referencia);

    expect(query.ultimoFiltroListar).toMatchObject({ mes: 7, ano: 2026 });
    expect(query.ultimoFiltroTotais).toMatchObject({ mes: 7, ano: 2026 });
  });

  it("repassa o filtro de status para a query (DASH-R-02)", async () => {
    await useCase.executar({ status: "ATRASADO" }, new Date("2026-07-15T12:00:00Z"));

    expect(query.ultimoFiltroListar).toMatchObject({ status: "ATRASADO" });
  });

  it("repassa o termo de busca por nome para a query (DASH-R-04)", async () => {
    await useCase.executar({ busca: "Maria" }, new Date("2026-07-15T12:00:00Z"));

    expect(query.ultimoFiltroListar).toMatchObject({ busca: "Maria" });
  });

  it("retorna itens e totais calculados (DASH-R-03)", async () => {
    query.itens = [
      { id: "c1", nomeCliente: "Maria Silva", valor: 150, vencimento: new Date("2026-07-10"), status: "PAGO", origem: "RECORRENTE" },
    ];
    query.totais = { totalAReceber: 0, totalRecebido: 150, totalEmAtraso: 0 };

    const resultado = await useCase.executar({}, new Date("2026-07-15T12:00:00Z"));

    expect(resultado.itens).toEqual(query.itens);
    expect(resultado.totais).toEqual(query.totais);
  });

  it("permite informar mês/ano explicitamente, ignorando a data de referência", async () => {
    await useCase.executar({ mes: 12, ano: 2025 }, new Date("2026-07-15T12:00:00Z"));

    expect(query.ultimoFiltroListar).toMatchObject({ mes: 12, ano: 2025 });
    expect(query.ultimoFiltroTotais).toMatchObject({ mes: 12, ano: 2025 });
  });

  it("pagina os itens (20 por página por padrão)", async () => {
    query.itens = Array.from({ length: 25 }, (_, i) => ({
      id: `c${i + 1}`,
      nomeCliente: `Cliente ${i + 1}`,
      valor: 100,
      vencimento: new Date("2026-07-10"),
      status: "PENDENTE" as const,
      origem: "RECORRENTE" as const,
    }));

    const paginaUm = await useCase.executar({}, new Date("2026-07-15T12:00:00Z"));
    const paginaDois = await useCase.executar({ pagina: 2 }, new Date("2026-07-15T12:00:00Z"));

    expect(paginaUm.itens).toHaveLength(20);
    expect(paginaUm.totalPaginas).toBe(2);
    expect(paginaUm.totalItens).toBe(25);
    expect(paginaDois.itens).toHaveLength(5);
    expect(paginaDois.paginaAtual).toBe(2);
  });
});
