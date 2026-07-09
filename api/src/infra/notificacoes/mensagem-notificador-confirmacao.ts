import { enviarMensagemMultiplosCanais } from "../../application/mensagem/enviar-mensagem-multiplos-canais.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import type { Cobranca } from "../../domain/cobranca/cobranca.js";
import type { NotificadorConfirmacao } from "../../domain/cobranca/notificador-confirmacao.js";
import type { ConfiguracaoRepository } from "../../domain/configuracao/configuracao-repository.js";
import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import type { CanalNotificacao } from "../../domain/mensagem/canal-notificacao.js";
import { MensagemEnviada } from "../../domain/mensagem/mensagem-enviada.js";
import type { MensagemEnviadaRepository } from "../../domain/mensagem/mensagem-enviada-repository.js";
import { montarEmailConfirmacao, montarTextoConfirmacao } from "../../domain/mensagem/template-confirmacao.js";

export class MensagemNotificadorConfirmacao implements NotificadorConfirmacao {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly mensagemEnviadaRepository: MensagemEnviadaRepository,
    private readonly canalMensagem: CanalMensagem,
    private readonly canalNotificacao: CanalNotificacao,
    private readonly configuracaoRepository: ConfiguracaoRepository,
  ) {}

  async notificarPagamentoConfirmado(cobranca: Cobranca): Promise<void> {
    const cliente = await this.clienteRepository.buscarPorId(cobranca.clienteId);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(cobranca.clienteId);
    }

    const telefonePrincipal = cliente.telefonePrincipal;

    if (!telefonePrincipal) {
      throw new ClienteNaoEncontradoError(cobranca.clienteId);
    }

    const configuracao = await this.configuracaoRepository.buscar();

    const texto = montarTextoConfirmacao({
      nomeCliente: cliente.nome,
      valor: cobranca.valor,
      nomeRemetente: configuracao.nomeRemetente,
    });
    const email = montarEmailConfirmacao({
      nomeCliente: cliente.nome,
      valor: cobranca.valor,
      nomeRemetente: configuracao.nomeRemetente,
    });

    const resultados = await enviarMensagemMultiplosCanais(this.canalMensagem, this.canalNotificacao, {
      telefone: telefonePrincipal.numero,
      texto,
      email: cliente.email,
      assuntoEmail: email.assunto,
      corpoHtmlEmail: email.corpoHtml,
    });

    for (const resultado of resultados) {
      const mensagem = MensagemEnviada.criar({
        cobrancaId: cobranca.id,
        tipo: "CONFIRMACAO",
        statusEnvio: resultado.statusEnvio,
        canal: resultado.canal,
      });

      await this.mensagemEnviadaRepository.salvar(mensagem);
    }
  }
}
