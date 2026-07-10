import { beforeEach, describe, expect, it } from "vitest";

import { BuscarIndicadoresDashboardUseCase } from "../../../../src/application/cobranca/buscar-indicadores-dashboard-use-case.js";
import { FakeDashboardCobrancaQuery } from "../../fakes/fake-dashboard-cobranca-query.js";

describe("BuscarIndicadoresDashboardUseCase", () => {
  let query: FakeDashboardCobrancaQuery;
  let useCase: BuscarIndicadoresDashboardUseCase;

  beforeEach(() => {
    query = new FakeDashboardCobrancaQuery();
    useCase = new BuscarIndicadoresDashboardUseCase(query);
  });

  it("usa o mês/ano corrente por padrão quando nenhum filtro é informado", async () => {
    const referencia = new Date("2026-07-15T12:00:00Z");

    await useCase.executar({}, referencia);

    expect(query.ultimoFiltroListar).toBeNull();
  });

  it("repassa os indicadores calculados pela query", async () => {
    query.indicadores = {
      totalGeradas: 10,
      totalPagas: 6,
      totalAtrasadas: 2,
      ticketMedio: 150,
      totalAvulsas: 1,
      proximosVencimentos: { quantidade: 3, valorTotal: 450 },
    };

    const resultado = await useCase.executar({}, new Date("2026-07-15T12:00:00Z"));

    expect(resultado).toEqual(query.indicadores);
  });

  it("permite informar mês/ano explicitamente", async () => {
    const referencia = new Date("2026-07-15T12:00:00Z");

    const resultado = await useCase.executar({ mes: 12, ano: 2025 }, referencia);

    expect(resultado).toEqual(query.indicadores);
  });
});
