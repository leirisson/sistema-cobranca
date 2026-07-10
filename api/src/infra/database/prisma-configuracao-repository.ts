import type { PrismaClient } from "@prisma/client";

import { Configuracao, ID_CONFIGURACAO_DEFAULT } from "../../domain/configuracao/configuracao.js";
import type { ConfiguracaoRepository } from "../../domain/configuracao/configuracao-repository.js";

export class PrismaConfiguracaoRepository implements ConfiguracaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscar(): Promise<Configuracao> {
    const registro = await this.prisma.configuracao.findUnique({
      where: { id: ID_CONFIGURACAO_DEFAULT },
    });

    if (!registro) {
      const criado = await this.prisma.configuracao.create({
        data: { id: ID_CONFIGURACAO_DEFAULT },
      });

      return this.paraEntidade(criado);
    }

    return this.paraEntidade(registro);
  }

  async salvar(configuracao: Configuracao): Promise<void> {
    await this.prisma.configuracao.upsert({
      where: { id: configuracao.id },
      create: {
        id: configuracao.id,
        asaasApiKeyCifrada: configuracao.asaasApiKeyCifrada,
        nomeRemetente: configuracao.nomeRemetente,
        mensagemCobrancaPersonalizada: configuracao.mensagemCobrancaPersonalizada,
        confirmacaoPagamentoHabilitada: configuracao.confirmacaoPagamentoHabilitada,
        confirmacaoPagamentoConfiguradaPeloUsuario: configuracao.confirmacaoPagamentoConfiguradaPeloUsuario,
      },
      update: {
        asaasApiKeyCifrada: configuracao.asaasApiKeyCifrada,
        nomeRemetente: configuracao.nomeRemetente,
        mensagemCobrancaPersonalizada: configuracao.mensagemCobrancaPersonalizada,
        confirmacaoPagamentoHabilitada: configuracao.confirmacaoPagamentoHabilitada,
        confirmacaoPagamentoConfiguradaPeloUsuario: configuracao.confirmacaoPagamentoConfiguradaPeloUsuario,
      },
    });
  }

  private paraEntidade(registro: {
    id: string;
    asaasApiKeyCifrada: string | null;
    nomeRemetente: string | null;
    mensagemCobrancaPersonalizada: string | null;
    confirmacaoPagamentoHabilitada: boolean;
    confirmacaoPagamentoConfiguradaPeloUsuario: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Configuracao {
    return Configuracao.restaurar({
      id: registro.id,
      asaasApiKeyCifrada: registro.asaasApiKeyCifrada,
      nomeRemetente: registro.nomeRemetente,
      mensagemCobrancaPersonalizada: registro.mensagemCobrancaPersonalizada,
      confirmacaoPagamentoHabilitada: registro.confirmacaoPagamentoHabilitada,
      confirmacaoPagamentoConfiguradaPeloUsuario: registro.confirmacaoPagamentoConfiguradaPeloUsuario,
      createdAt: registro.createdAt,
      updatedAt: registro.updatedAt,
    });
  }
}
