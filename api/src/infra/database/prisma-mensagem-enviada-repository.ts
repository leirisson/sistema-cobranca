import type { PrismaClient } from "@prisma/client";

import type { MensagemEnviada, TipoMensagem } from "../../domain/mensagem/mensagem-enviada.js";
import type { MensagemEnviadaRepository } from "../../domain/mensagem/mensagem-enviada-repository.js";

export class PrismaMensagemEnviadaRepository implements MensagemEnviadaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(mensagem: MensagemEnviada): Promise<void> {
    await this.prisma.mensagemEnviada.create({
      data: {
        id: mensagem.id,
        cobrancaId: mensagem.cobrancaId,
        tipo: mensagem.tipo,
        statusEnvio: mensagem.statusEnvio,
        canal: mensagem.canal,
        enviadoEm: mensagem.enviadoEm,
      },
    });
  }

  async existeParaCobrancaETipo(cobrancaId: string, tipo: TipoMensagem): Promise<boolean> {
    const registro = await this.prisma.mensagemEnviada.findFirst({
      where: { cobrancaId, tipo },
    });

    return registro !== null;
  }
}
