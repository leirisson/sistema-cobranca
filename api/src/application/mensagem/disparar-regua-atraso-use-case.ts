import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";
import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import { MensagemEnviada } from "../../domain/mensagem/mensagem-enviada.js";
import type { MensagemEnviadaRepository } from "../../domain/mensagem/mensagem-enviada-repository.js";
import { montarTextoMensagem, type TipoMensagemComTemplate } from "../../domain/mensagem/template-mensagem.js";

const MILISSEGUNDOS_POR_DIA = 1000 * 60 * 60 * 24;
const MARCOS_REGUA: Record<number, TipoMensagemComTemplate> = {
  0: "VENCIMENTO",
  1: "ATRASO",
  3: "ATRASO",
};

export class DispararReguaAtrasoUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly mensagemEnviadaRepository: MensagemEnviadaRepository,
    private readonly canalMensagem: CanalMensagem,
  ) {}

  async executar(hoje: Date): Promise<void> {
    const cobrancas = await this.cobrancaRepository.listarPendentesOuAtrasadas();

    for (const cobranca of cobrancas) {
      const diasDesdeVencimento = this.calcularDiasDesdeVencimento(hoje, cobranca.vencimento);
      const tipo = MARCOS_REGUA[diasDesdeVencimento];

      if (!tipo) {
        continue;
      }

      const jaEnviada = await this.mensagemEnviadaRepository.existeParaCobrancaETipo(cobranca.id, tipo);

      if (jaEnviada) {
        continue;
      }

      const cliente = await this.clienteRepository.buscarPorId(cobranca.clienteId);
      const telefonePrincipal = cliente?.telefonePrincipal;

      if (!cliente || !telefonePrincipal) {
        continue;
      }

      if (diasDesdeVencimento >= 1 && cobranca.status === "PENDENTE") {
        cobranca.marcarComoAtrasada();
        await this.cobrancaRepository.salvar(cobranca);
      }

      const texto = montarTextoMensagem(tipo, {
        nomeCliente: cliente.nome,
        valor: cobranca.valor,
        vencimento: cobranca.vencimento,
        linkPagamento: cobranca.linkPagamento,
      });

      let statusEnvio: "ENVIADO" | "FALHA" = "ENVIADO";

      try {
        await this.canalMensagem.enviarMensagem({ telefone: telefonePrincipal.numero, texto });
      } catch {
        statusEnvio = "FALHA";
      }

      const mensagem = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo, statusEnvio });
      await this.mensagemEnviadaRepository.salvar(mensagem);
    }
  }

  private calcularDiasDesdeVencimento(hoje: Date, vencimento: Date): number {
    return Math.round((hoje.getTime() - vencimento.getTime()) / MILISSEGUNDOS_POR_DIA);
  }
}
