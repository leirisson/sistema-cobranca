import type { PrismaClient } from "@prisma/client";

import { MensagemEnviada, type TipoMensagem } from "../../domain/mensagem/mensagem-enviada.js";
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

  async buscarPorId(id: string): Promise<MensagemEnviada | null> {
    const registro = await this.prisma.mensagemEnviada.findUnique({ where: { id } });

    if (!registro) {
      return null;
    }

    return MensagemEnviada.restaurar({
      id: registro.id,
      cobrancaId: registro.cobrancaId,
      tipo: registro.tipo,
      statusEnvio: registro.statusEnvio as "ENVIADO" | "FALHA",
      canal: registro.canal,
      enviadoEm: registro.enviadoEm,
    });
  }
}
