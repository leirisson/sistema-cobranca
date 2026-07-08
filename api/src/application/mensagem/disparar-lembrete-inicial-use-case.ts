import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import type { Cobranca } from "../../domain/cobranca/cobranca.js";
import { MensagemEnviada } from "../../domain/mensagem/mensagem-enviada.js";
import type { MensagemEnviadaRepository } from "../../domain/mensagem/mensagem-enviada-repository.js";
import { montarTextoMensagem } from "../../domain/mensagem/template-mensagem.js";

export class DispararLembreteInicialUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly mensagemEnviadaRepository: MensagemEnviadaRepository,
    private readonly canalMensagem: CanalMensagem,
  ) {}

  async executar(cobranca: Cobranca): Promise<void> {
    const cliente = await this.clienteRepository.buscarPorId(cobranca.clienteId);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(cobranca.clienteId);
    }

    const telefonePrincipal = cliente.telefonePrincipal;

    if (!telefonePrincipal) {
      throw new ClienteNaoEncontradoError(cobranca.clienteId);
    }

    const texto = montarTextoMensagem("LEMBRETE", {
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

    const mensagem = MensagemEnviada.criar({
      cobrancaId: cobranca.id,
      tipo: "LEMBRETE",
      statusEnvio,
    });

    await this.mensagemEnviadaRepository.salvar(mensagem);
  }
}
