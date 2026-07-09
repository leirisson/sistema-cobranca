import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import { Cobranca } from "../../domain/cobranca/cobranca.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";
import type { GatewayPagamento } from "../../domain/cobranca/gateway-pagamento.js";

const MILISSEGUNDOS_POR_DIA = 1000 * 60 * 60 * 24;

export class GerarCobrancaUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly cobrancaRepository: CobrancaRepository,
    private readonly gatewayPagamento: GatewayPagamento,
    private readonly antecedenciaDias: number,
  ) {}

  async executar(hoje: Date): Promise<Cobranca[]> {
    const clientesAtivos = await this.clienteRepository.listarAtivos();
    const cobrancasGeradas: Cobranca[] = [];

    for (const cliente of clientesAtivos) {
      const vencimento = this.calcularVencimentoDoCiclo(hoje, cliente.diaVencimento);

      if (!this.dentroDaJanelaDeAntecedencia(hoje, vencimento)) {
        continue;
      }

      const jaExiste = await this.cobrancaRepository.existeParaCicloVigente(cliente.id, vencimento);

      if (jaExiste) {
        continue;
      }

      const resultadoGateway = await this.gatewayPagamento.criarCobranca({
        clienteId: cliente.id,
        valor: cliente.valorCobranca,
        vencimento,
        nomeCliente: cliente.nome,
        documentoCliente: cliente.documento,
        emailCliente: cliente.email,
      });

      const cobranca = Cobranca.criar({
        clienteId: cliente.id,
        valor: cliente.valorCobranca,
        vencimento,
        gatewayChargeId: resultadoGateway.gatewayChargeId,
        linkPagamento: resultadoGateway.linkPagamento,
        pixCopiaECola: resultadoGateway.pixCopiaECola,
      });

      await this.cobrancaRepository.salvar(cobranca);
      cobrancasGeradas.push(cobranca);
    }

    return cobrancasGeradas;
  }

  private calcularVencimentoDoCiclo(hoje: Date, diaVencimento: number): Date {
    return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), diaVencimento));
  }

  private dentroDaJanelaDeAntecedencia(hoje: Date, vencimento: Date): boolean {
    const diasParaVencer = Math.round((vencimento.getTime() - hoje.getTime()) / MILISSEGUNDOS_POR_DIA);

    return diasParaVencer >= 0 && diasParaVencer <= this.antecedenciaDias;
  }
}
