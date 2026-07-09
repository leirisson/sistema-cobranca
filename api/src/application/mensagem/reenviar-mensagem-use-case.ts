import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import { CobrancaInvalidaError } from "../../domain/cobranca/cobranca-invalida-error.js";
import { CobrancaNaoEncontradaError } from "../../domain/cobranca/cobranca-nao-encontrada-error.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";
import type { ConfiguracaoRepository } from "../../domain/configuracao/configuracao-repository.js";
import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import type { CanalNotificacao } from "../../domain/mensagem/canal-notificacao.js";
import { MensagemEnviada } from "../../domain/mensagem/mensagem-enviada.js";
import type { MensagemEnviadaRepository } from "../../domain/mensagem/mensagem-enviada-repository.js";
import { MensagemInvalidaError } from "../../domain/mensagem/mensagem-invalida-error.js";
import { MensagemNaoEncontradaError } from "../../domain/mensagem/mensagem-nao-encontrada-error.js";
import { montarEmailConfirmacao, montarTextoConfirmacao } from "../../domain/mensagem/template-confirmacao.js";
import { montarEmailMensagem } from "../../domain/mensagem/template-email.js";
import { montarTextoMensagem, type TipoMensagemComTemplate } from "../../domain/mensagem/template-mensagem.js";
import { enviarPorEmail, enviarPorWhatsapp, type ResultadoEnvioPorCanal } from "./enviar-mensagem-multiplos-canais.js";

export class ReenviarMensagemUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly mensagemEnviadaRepository: MensagemEnviadaRepository,
    private readonly canalMensagem: CanalMensagem,
    private readonly canalNotificacao: CanalNotificacao,
    private readonly configuracaoRepository: ConfiguracaoRepository,
  ) {}

  async executar(mensagemId: string): Promise<ResultadoEnvioPorCanal> {
    const original = await this.mensagemEnviadaRepository.buscarPorId(mensagemId);

    if (!original) {
      throw new MensagemNaoEncontradaError(mensagemId);
    }

    if (original.statusEnvio !== "FALHA") {
      throw new MensagemInvalidaError("Só é possível reenviar mensagens com envio marcado como FALHA");
    }

    const cobranca = await this.cobrancaRepository.buscarPorId(original.cobrancaId);

    if (!cobranca) {
      throw CobrancaNaoEncontradaError.porId(original.cobrancaId);
    }

    if (cobranca.status === "PAGO" || cobranca.status === "CANCELADO") {
      throw new CobrancaInvalidaError(`Não é possível reenviar mensagem de uma cobrança com status ${cobranca.status}`);
    }

    const cliente = await this.clienteRepository.buscarPorId(cobranca.clienteId);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(cobranca.clienteId);
    }

    const telefonePrincipal = cliente.telefonePrincipal;

    if (!telefonePrincipal) {
      throw new ClienteNaoEncontradoError(cobranca.clienteId);
    }

    const configuracao = await this.configuracaoRepository.buscar();
    const { texto, assuntoEmail, corpoHtmlEmail } = this.montarConteudo(original.tipo, cliente.nome, cobranca, configuracao.nomeRemetente);

    const resultado =
      original.canal === "whatsapp"
        ? await enviarPorWhatsapp(this.canalMensagem, {
            telefone: telefonePrincipal.numero,
            texto,
            email: cliente.email,
            assuntoEmail,
            corpoHtmlEmail,
          })
        : await enviarPorEmail(
            this.canalNotificacao,
            { telefone: telefonePrincipal.numero, texto, email: cliente.email, assuntoEmail, corpoHtmlEmail },
            cliente.email ?? "",
          );

    const novaMensagem = MensagemEnviada.criar({
      cobrancaId: original.cobrancaId,
      tipo: original.tipo,
      statusEnvio: resultado.statusEnvio,
      canal: resultado.canal,
    });
    await this.mensagemEnviadaRepository.salvar(novaMensagem);

    return resultado;
  }

  private montarConteudo(
    tipo: MensagemEnviada["tipo"],
    nomeCliente: string,
    cobranca: { valor: number; vencimento: Date; linkPagamento: string; pixCopiaECola: string | null },
    nomeRemetente: string | null,
  ): { texto: string; assuntoEmail: string; corpoHtmlEmail: string } {
    if (tipo === "CONFIRMACAO") {
      const dados = { nomeCliente, valor: cobranca.valor, nomeRemetente };
      const email = montarEmailConfirmacao(dados);

      return { texto: montarTextoConfirmacao(dados), assuntoEmail: email.assunto, corpoHtmlEmail: email.corpoHtml };
    }

    const dados = {
      nomeCliente,
      valor: cobranca.valor,
      vencimento: cobranca.vencimento,
      linkPagamento: cobranca.linkPagamento,
      pixCopiaECola: cobranca.pixCopiaECola,
      nomeRemetente,
    };
    const tipoComTemplate = tipo as TipoMensagemComTemplate;
    const email = montarEmailMensagem(tipoComTemplate, dados);

    return { texto: montarTextoMensagem(tipoComTemplate, dados), assuntoEmail: email.assunto, corpoHtmlEmail: email.corpoHtml };
  }
}
