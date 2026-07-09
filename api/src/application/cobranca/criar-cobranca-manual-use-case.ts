import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import { ClienteInvalidoError } from "../../domain/cliente/cliente-invalido-error.js";
import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import { Cobranca } from "../../domain/cobranca/cobranca.js";
import { CobrancaInvalidaError } from "../../domain/cobranca/cobranca-invalida-error.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";
import type { GatewayPagamento } from "../../domain/cobranca/gateway-pagamento.js";

export interface CriarCobrancaManualInput {
  clienteId: string;
  valor: number;
  vencimento: Date;
  descricao?: string | null;
}

export class CriarCobrancaManualUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly gatewayPagamento: GatewayPagamento,
  ) {}

  async executar(input: CriarCobrancaManualInput): Promise<Cobranca> {
    const cliente = await this.clienteRepository.buscarPorId(input.clienteId);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(input.clienteId);
    }

    if (cliente.status !== "ATIVO") {
      throw new ClienteInvalidoError("Cliente inativo não pode receber cobrança");
    }

    if (input.valor <= 0) {
      throw new CobrancaInvalidaError("Valor deve ser maior que zero");
    }

    const resultadoGateway = await this.gatewayPagamento.criarCobranca({
      clienteId: cliente.id,
      valor: input.valor,
      vencimento: input.vencimento,
      nomeCliente: cliente.nome,
      documentoCliente: cliente.documento,
      emailCliente: cliente.email,
    });

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: input.valor,
      vencimento: input.vencimento,
      gatewayChargeId: resultadoGateway.gatewayChargeId,
      linkPagamento: resultadoGateway.linkPagamento,
      pixCopiaECola: resultadoGateway.pixCopiaECola,
      origem: "AVULSA",
      descricao: input.descricao,
    });

    await this.cobrancaRepository.salvar(cobranca);

    return cobranca;
  }
}
