import type { PrismaClient } from "@prisma/client";

import { ErroGeracaoCobranca } from "../../domain/cobranca/erro-geracao-cobranca.js";
import type { ErroGeracaoCobrancaRepository } from "../../domain/cobranca/erro-geracao-cobranca-repository.js";

export class PrismaErroGeracaoCobrancaRepository implements ErroGeracaoCobrancaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(erro: ErroGeracaoCobranca): Promise<void> {
    await this.prisma.erroGeracaoCobranca.create({
      data: {
        id: erro.id,
        clienteId: erro.clienteId,
        nomeCliente: erro.nomeCliente,
        mensagemErro: erro.mensagemErro,
        ocorridoEm: erro.ocorridoEm,
      },
    });
  }

  async listarRecentes(limite: number): Promise<ErroGeracaoCobranca[]> {
    const registros = await this.prisma.erroGeracaoCobranca.findMany({
      orderBy: { ocorridoEm: "desc" },
      take: limite,
    });

    return registros.map((registro) =>
      ErroGeracaoCobranca.restaurar({
        id: registro.id,
        clienteId: registro.clienteId,
        nomeCliente: registro.nomeCliente,
        mensagemErro: registro.mensagemErro,
        ocorridoEm: registro.ocorridoEm,
      }),
    );
  }
}
